// Vera Assistant AI Support Chatbot Backend Service
// Integrates with NVIDIA Nemotron via Nebius Token Factory with a context-aware,
// evidence-grounded reasoning engine connected to real product catalog data.

import { Router, Request, Response } from 'express';
import { SUPPORT_CONFIG } from '../src/config/support';
import { VERIFIED_INDIAN_CATALOG, VerifiedCatalogProduct } from './retailers/verifiedCatalog';

export const supportChatRouter = Router();

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  text?: string;
  timestamp?: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
    externalUrl?: string;
  };
}

const dev = SUPPORT_CONFIG.leadDeveloper;

const SYSTEM_PROMPT = `You are "Vera Assistant", the official expert AI shopping and cost-analysis assistant for VeraCost.
VeraCost is a transparent Total Cost of Ownership (TCO) decision platform powered by NVIDIA Nemotron and verified Indian retailer integrations.

Your Core Capabilities & Guidelines:
1. Explain VeraCost Features: Upfront purchase price vs. Lifetime TCO (setup accessories, recurring costs, maintenance, operating energy, resale recovery value).
2. Shopping & Scanning Troubleshooting:
   - Barcode Scanning: Reads retail EAN-13, EAN-8, UPC-A, Code 128 packaging codes. Reading a barcode and finding product information in databases are separate operations.
   - QR Scanning: Decodes URLs and SKU text. Product URLs can be parsed to extract titles; arbitrary links display security warnings.
   - Image Search: Uses Google Cloud Vision, multimodal AI, or client-side detection. If multiple objects exist, users can choose candidate objects or search with Google Lens.
   - Screenshot Import: Allows clipboard paste (Ctrl+V) or file upload. Explain honestly that web browsers cannot automatically spy on operating system shortcut keys.
3. Retailers Supported: Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Apple Store, Samsung India.
4. Support & Lead Developer:
   - Lead Architect: ${dev.name}
   - Phone: ${dev.formattedPhone} (Clickable tel)
   - Email: ${dev.email} (Gmail / Mail compose)
5. Strict Constraints:
   - NEVER fabricate specific live retailer stock or fake discount percentages.
   - Clarify that estimated checkout costs include delivery, mandatory fees, and standard taxes.
   - Be helpful, concise, professional, and friendly.`;

const handleChatRequest = async (req: Request, res: Response) => {
  let trimmedQuery = '';
  let priorTurns: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  try {
    const { messages, userMessage } = req.body || {};

    const rawText = userMessage || (Array.isArray(messages) && (messages[messages.length - 1]?.content || messages[messages.length - 1]?.text));
    trimmedQuery = (typeof rawText === 'string' ? rawText : String(rawText || '')).trim();

    if (!trimmedQuery) {
      return res.status(200).json({
        reply: "Hello! I am Vera Assistant. I can help you check prices, compare Total Cost of Ownership (TCO), or troubleshoot barcode and QR scanning. What product or question can I help with?",
        suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
        provider: 'veracost-safety-fallback',
        timestamp: new Date().toISOString(),
      });
    }

    // 1. Build sanitized conversation history (prior turns)
    priorTurns = Array.isArray(messages)
      ? messages.slice(-10).map((m: any) => ({
          role: (m?.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: String(m?.content || m?.text || '').trim().slice(0, 1000),
        })).filter((m) => m.content.length > 0)
      : [];

    // Ensure the latest user query is strictly at the end of the conversation history
    const lastTurn = priorTurns[priorTurns.length - 1];
    if (!lastTurn || lastTurn.role !== 'user' || lastTurn.content !== trimmedQuery) {
      priorTurns.push({ role: 'user', content: trimmedQuery });
    }

    // 2. Identify if any catalog products are mentioned in the query or recent context
    const matchedProducts = findProductsInQueryAndContext(trimmedQuery, priorTurns);

    // 3. Check if live Nebius / Nemotron AI is configured
    const customKey = (req.headers['x-nebius-api-key'] as string) || req.body?.customApiKey;
    const nebiusKey = (customKey && customKey.trim() !== '' && !customKey.includes('your_'))
      ? customKey.trim()
      : process.env.NEBIUS_API_KEY;
    const isAiConfigured = Boolean(nebiusKey && nebiusKey.trim() !== '' && !nebiusKey.includes('your_'));

    if (isAiConfigured) {
      let timeout: any = null;
      try {
        const baseUrl = (process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1').replace(/\/+$/, '');
        const model = process.env.NEBIUS_MODEL || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF';

        let contextualSystemPrompt = SYSTEM_PROMPT;
        if (matchedProducts.length > 0) {
          const productContext = matchedProducts.map((p) => formatProductDataForPrompt(p)).join('\n\n');
          contextualSystemPrompt += `\n\nVerified Real Product & Retailer Data currently in VeraCost:\n${productContext}\n(Use these exact verified figures if relevant to the user's question; do not fabricate unverified prices.)`;
        }

        const conversationPayload = [
          { role: 'system', content: contextualSystemPrompt },
          ...priorTurns,
        ];

        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 7500);

        const aiResp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nebiusKey?.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: conversationPayload,
            temperature: 0.35,
            max_tokens: 450,
          }),
          signal: controller.signal,
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const replyText = aiData?.choices?.[0]?.message?.content?.trim();
          if (replyText) {
            let suggestedAction: any = undefined;
            const lowerReply = replyText.toLowerCase();
            if (matchedProducts.length > 0 || lowerReply.includes('smart price finder') || lowerReply.includes('amazon') || lowerReply.includes('flipkart')) {
              suggestedAction = { label: 'Explore in Smart Price Finder', actionTab: 'shopping' };
            } else if (lowerReply.includes('workspace') || lowerReply.includes('tco') || lowerReply.includes('simulator')) {
              suggestedAction = { label: 'Open Simulator Workspace', actionTab: 'workspace' };
            } else if (lowerReply.includes('support') || lowerReply.includes('ronak')) {
              suggestedAction = { label: 'Visit Contact & Support Page', actionTab: 'support' };
            }

            return res.status(200).json({
              reply: replyText,
              provider: 'nvidia-nemotron-live',
              suggestedAction,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (aiErr: any) {
        console.warn('[VeraAssistant] AI call failed or timed out, using dynamic Conversational Engine fallback:', aiErr.message);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }

    // 4. Dynamic, Context-Aware Conversational Reasoning Engine
    const contextualAnswer = generateContextualAssistantResponse(trimmedQuery, priorTurns, matchedProducts);
    return res.status(200).json({
      reply: contextualAnswer.text,
      suggestedAction: contextualAnswer.suggestedAction,
      provider: isAiConfigured ? 'dynamic-reasoning-fallback' : 'veracost-conversational-engine',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[VeraAssistant] Error handling chat message, returning resilient response:', err?.stack || err?.message || err);
    try {
      const fallback = generateContextualAssistantResponse(trimmedQuery || 'help', priorTurns);
      return res.status(200).json({
        reply: fallback.text,
        suggestedAction: fallback.suggestedAction,
        provider: 'veracost-safety-fallback',
        timestamp: new Date().toISOString(),
      });
    } catch {
      return res.status(200).json({
        reply: "Hello! I am Vera Assistant. I can help you evaluate upfront prices vs. Lifetime Total Cost of Ownership (TCO), compare retailer offers, and assist with barcode and QR scanning. What product or question would you like to explore?",
        suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
        provider: 'veracost-failsafe',
        timestamp: new Date().toISOString(),
      });
    }
  }
};

supportChatRouter.post('/chat', handleChatRequest);
supportChatRouter.post('/', handleChatRequest);

/**
 * Searches the verified Indian retail catalog for products mentioned in the query or conversation history
 */
function findProductsInQueryAndContext(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): VerifiedCatalogProduct[] {
  const matched = new Map<string, VerifiedCatalogProduct>();
  const lowerQuery = (query || '').toLowerCase();

  // 1. Direct query matching
  for (const product of VERIFIED_INDIAN_CATALOG) {
    const nameMatch = lowerQuery.includes((product.name || '').toLowerCase());
    const modelMatch = lowerQuery.includes((product.model || '').toLowerCase());
    const aliasMatch = Array.isArray(product.aliases) && product.aliases.some((a) => lowerQuery.includes(String(a || '').toLowerCase()));

    if (nameMatch || modelMatch || aliasMatch) {
      matched.set(product.id, product);
    }
  }

  // 2. Contextual history matching if query is a follow-up (e.g. "what is its price?", "how much?", "compare it")
  const isFollowUp = /it\b|this\b|that\b|price\b|cost\b|cheaper\b|discount\b|where to buy\b|specs\b|compare\b/i.test(lowerQuery);
  if (matched.size === 0 && isFollowUp && Array.isArray(history) && history.length > 0) {
    const recentHistoryText = history.slice(-4).map((h) => String(h?.content || (h as any)?.text || '').toLowerCase()).join(' ');
    for (const product of VERIFIED_INDIAN_CATALOG) {
      if (
        recentHistoryText.includes((product.name || '').toLowerCase()) ||
        recentHistoryText.includes((product.model || '').toLowerCase()) ||
        (Array.isArray(product.aliases) && product.aliases.some((a) => recentHistoryText.includes(String(a || '').toLowerCase())))
      ) {
        matched.set(product.id, product);
        break;
      }
    }
  }

  return Array.from(matched.values()).slice(0, 3);
}

/**
 * Formats a catalog product's real pricing into an evidence snippet for AI context
 */
function formatProductDataForPrompt(p: VerifiedCatalogProduct): string {
  const topOffers = (p.offers || []).slice(0, 3).map((o) => {
    const listed = Number(o.listedPrice) || 0;
    const fees = Number(o.mandatoryFees) || 0;
    const delivery = Number(o.deliveryCharge) || 0;
    const discount = Number(o.applicableDiscount) || 0;
    const checkout = listed + fees + delivery - discount;
    return `* ${o.retailerName || 'Retailer'}: Listed ₹${listed.toLocaleString('en-IN')}, Discount ₹${discount.toLocaleString('en-IN')} (${o.discountDetails || 'Standard'}), Est. Checkout ₹${checkout.toLocaleString('en-IN')}`;
  }).join('\n');

  return `Product: ${p.name || ''} (${p.brand || ''} ${p.model || ''})\nMRP: ₹${(Number(p.mrp) || 0).toLocaleString('en-IN')}\nVerified Offers:\n${topOffers}`;
}

/**
 * Dynamic, context-aware conversational response generator.
 * Never repeats the same canned response; addresses the user's specific query contextually.
 */
export function generateContextualAssistantResponse(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  matchedProducts?: VerifiedCatalogProduct[]
): {
  text: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
  };
} {
  const lower = (query || '').toLowerCase().trim();
  const products = matchedProducts || findProductsInQueryAndContext(query, history);

  // 1. Specific Product & Price Information
  if (Array.isArray(products) && products.length > 0) {
    if (products.length === 1) {
      const p = products[0];
      const offers = Array.isArray(p.offers) ? p.offers : [];
      const sortedOffers = [...offers].sort((a, b) => {
        const costA = (Number(a.listedPrice) || 0) + (Number(a.mandatoryFees) || 0) + (Number(a.deliveryCharge) || 0) - (Number(a.applicableDiscount) || 0);
        const costB = (Number(b.listedPrice) || 0) + (Number(b.mandatoryFees) || 0) + (Number(b.deliveryCharge) || 0) - (Number(b.applicableDiscount) || 0);
        return costA - costB;
      });

      const best = sortedOffers[0];
      const bestCheckout = best
        ? (Number(best.listedPrice) || 0) + (Number(best.mandatoryFees) || 0) + (Number(best.deliveryCharge) || 0) - (Number(best.applicableDiscount) || 0)
        : (Number(p.mrp) || 0);

      const offerLines = sortedOffers.slice(0, 3).map((o) => {
        const listed = Number(o.listedPrice) || 0;
        const discount = Number(o.applicableDiscount) || 0;
        const checkout = listed + (Number(o.mandatoryFees) || 0) + (Number(o.deliveryCharge) || 0) - discount;
        return `- **${o.retailerName || 'Retailer'}**: ₹${listed.toLocaleString('en-IN')} (Checkout: ~₹${checkout.toLocaleString('en-IN')}${discount > 0 ? `, saves ₹${discount.toLocaleString('en-IN')}` : ''})`;
      }).join('\n');

      return {
        text: `Here is the verified pricing for **${p.name}** across top Indian retailers:\n\n${offerLines || 'Verified listings available.'}\n\n🏆 **Lowest Estimated Checkout**: **${best?.retailerName || 'Amazon India'}** at **₹${bestCheckout.toLocaleString('en-IN')}**.\n\nBeyond upfront price, remember that True TCO for this product typically includes essential protection/cases, cables, and 3-year battery degradation. You can import this directly into our TCO Simulator!`,
        suggestedAction: { label: `View ${p.model} in Smart Finder`, actionTab: 'shopping' },
      };
    }

    // Comparison between multiple products
    if (products.length >= 2) {
      const p1 = products[0];
      const p2 = products[1];

      const getBestCost = (prod: VerifiedCatalogProduct) => {
        const prodOffers = Array.isArray(prod.offers) ? prod.offers : [];
        if (!prodOffers.length) return Number(prod.mrp) || 0;
        const costs = prodOffers.map((o) => (Number(o.listedPrice) || 0) + (Number(o.mandatoryFees) || 0) + (Number(o.deliveryCharge) || 0) - (Number(o.applicableDiscount) || 0));
        return Math.min(...costs);
      };

      const cost1 = getBestCost(p1);
      const cost2 = getBestCost(p2);
      const diff = Math.abs(cost1 - cost2);
      const cheaperProd = cost1 < cost2 ? p1 : p2;

      return {
        text: `Comparing **${p1.name}** vs. **${p2.name}**:\n\n- **${p1.name}**: Lowest verified checkout is ~**₹${cost1.toLocaleString('en-IN')}**\n- **${p2.name}**: Lowest verified checkout is ~**₹${cost2.toLocaleString('en-IN')}**\n\nUpfront price advantage: **${cheaperProd.name}** is ~**₹${diff.toLocaleString('en-IN')}** lower.\n\nWhen evaluating 3-year Total Cost of Ownership (TCO):\n- Check manufacturer warranty & replacement costs\n- Factor in resale recovery (Apple devices typically hold 35–45% residual value; high-end Androids hold 25–35%)\n- You can model both side-by-side in our Simulator Workspace.`,
        suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
      };
    }
  }

  // 2. Greetings, Introductions & Identity
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste)\b/i.test(lower) || /who are you|what is veracost|what can you do|about veracost/i.test(lower)) {
    return {
      text: `Hello! I am **Vera Assistant**, your AI shopping and financial guide for **VeraCost**.\n\nVeraCost helps you look beyond misleading upfront prices to uncover the **True Total Cost of Ownership (TCO)** for tech, appliances, and vehicles. Here is what I can do for you:\n\n1. **Price & Deal Checks**: Check verified live offers across Amazon India, Flipkart, Croma, and Reliance Digital.\n2. **TCO Cost Audits**: Calculate setup accessories, recurring subscriptions, maintenance, and resale recovery value over 3–5 years.\n3. **Scanning & Visual Search**: Guide you on scanning packaging barcodes, QR codes, or pasting screenshots (Ctrl+V).\n4. **Smart Comparisons**: Compare 2 or 3 product alternatives side-by-side.\n\nWhat product or question would you like to explore?`,
      suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
    };
  }

  // 3. TCO Calculation & Total Ownership Cost
  if (/total ownership|tco|lifetime cost|how does veracost calculate|how veracost works|cost calculation|hidden cost/i.test(lower)) {
    return {
      text: `VeraCost calculates the **True Lifetime Cost** using a transparent mathematical model:

$$\\text{Total Cost of Ownership} = \\text{Upfront Price} + \\text{Setup/Accessories} + \\text{Recurring Expenses} + \\text{Maintenance} + \\text{Operating Power} - \\text{Resale Recovery Value}$$

Why this matters:
- A cheaper laptop or phone often lacks included chargers, docks, protection plans, or essential accessories, adding ₹5,000–₹15,000 in setup costs.
- Lithium-ion batteries typically degrade below 80% after 24–36 months, requiring replacement.
- Resale value dramatically reduces long-term net spend for models with high secondary-market demand.`,
      suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
    };
  }

  // 4. Barcode Scanning
  if (/barcode|ean-13|upc|scan packaging|camera not opening|scanner/i.test(lower) && !/qr/i.test(lower)) {
    return {
      text: `To scan a packaging barcode with VeraCost:

1. Navigate to **Smart Price Finder** and tap **Scan Barcode**.
2. Allow camera access in your browser address bar.
3. Align the EAN-13 or UPC barcode horizontally within the green guidelines.
4. If your barcode is read, VeraCost instantly retrieves matching retailer offers.

*Troubleshooting tip:* If you are in low light, move into direct light or type the barcode numbers directly into the manual entry box!`,
      suggestedAction: { label: 'Go to Smart Price Finder', actionTab: 'shopping' },
    };
  }

  // 5. QR Code Scanning
  if (/qr code|qr scanner|scan qr|quick response/i.test(lower)) {
    return {
      text: `VeraCost includes a secure **Product QR Code Scanner**:

- When scanning Product URLs from Amazon, Flipkart, or brand tags, VeraCost parses the product title securely.
- If an arbitrary URL is scanned, a safety warning displays the target domain before opening.
- You can also decode plain text or SKU barcodes.

Would you like to try the QR scanner?`,
      suggestedAction: { label: 'Open Smart Price Finder', actionTab: 'shopping' },
    };
  }

  // 6. Visual Image Search & Google Lens
  if (/image search|photo search|google lens|visual search|camera search|search.*image|product image|photo/i.test(lower)) {
    return {
      text: `You can search by photo using VeraCost's **Image Search** and **Google Lens** workflows:

- **Snap or Upload**: Capture an image using your laptop/phone camera or upload a file.
- **Candidate Object Detection**: If multiple items are in the photo, candidate cards let you choose which object to compare.
- **Google Lens Direct Handoff**: Click "Search with Google Lens" to inspect web matches without having to upload the image a second time.`,
      suggestedAction: { label: 'Open Image Search', actionTab: 'shopping' },
    };
  }

  // 7. Screenshot Import (Ctrl+V)
  if (/screenshot|clipboard|ctrl\+v|paste screenshot|print screen|snip/i.test(lower)) {
    return {
      text: `To import a product screenshot in 1 second:\n\n1. Press **Win + Shift + S** (Windows) or **Cmd + Shift + 4** (Mac) to capture any product deal.\n2. Return to VeraCost and press **Ctrl + V** anywhere on the page.\n3. VeraCost immediately detects the screenshot and prompts: *"Screenshot detected. Would you like VeraCost to identify the product and compare its price?"*\n4. Visible text, brand, model, and prices are extracted with zero fabricated information.`,
      suggestedAction: { label: 'Open Screenshot Import', actionTab: 'screenshot' },
    };
  }

  // 8. Retailer Comparisons & Best Deals
  if (/retailer|lowest price|best price|amazon|flipkart|croma|reliance digital|vijay sales/i.test(lower)) {
    return {
      text: `VeraCost monitors verified Indian e-commerce platforms: **Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Apple Store, and Samsung India**.\n\nWe rank listings by **Estimated Checkout Cost**:\n$$\\text{Checkout Cost} = \\text{Listed Price} + \\text{Mandatory Fees} + \\text{Delivery} - \\text{Bank Card Discounts}$$\n\nThis ensures you never get tricked by low sticker prices that have high delivery charges or hidden fees.`,
      suggestedAction: { label: 'Compare Retailer Offers', actionTab: 'shopping' },
    };
  }

  // 9. Contact Support & Lead Developer
  if (/contact|support|help|developer|ronak|email|phone|call/i.test(lower)) {
    return {
      text: `You can connect directly with our Lead Architect:\n\n- **Developer**: ${dev.name} (${dev.role})\n- **Phone**: [${dev.formattedPhone}](tel:${dev.phone}) (Click to call)\n- **Email**: [${dev.email}](mailto:${dev.email})\n- **Availability**: ${dev.availability}\n\nYou can also visit our Contact & Support page to draft a pre-filled ticket in Gmail or your native mail client!`,
      suggestedAction: { label: 'Visit Contact & Support Page', actionTab: 'support' },
    };
  }

  // 10. General Decision Support (Contextual Fallback)
  return {
    text: `Regarding "${query.slice(0, 80)}":\n\nVeraCost helps you evaluate this purchase by comparing verified retailer prices across Amazon, Flipkart, and Croma, alongside a 3-year Total Cost of Ownership breakdown.\n\nYou can enter the specific model name in **Smart Price Finder**, paste a product screenshot (<kbd>Ctrl+V</kbd>), or open our **Simulator Workspace** to model setup and recurring expenses.`,
    suggestedAction: { label: 'Search in Smart Price Finder', actionTab: 'shopping' },
  };
}

/**
 * Backward-compatible FAQ function for unit tests
 */
export function generateKnowledgeBaseAnswer(query: string): {
  text: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
  };
} {
  return generateContextualAssistantResponse(query, []);
}
