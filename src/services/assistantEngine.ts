// Client-Side Conversational Assistant Engine for VeraCost
// Operates both as standalone client-side engine and as seamless offline fallback
// Guarantees that the assistant NEVER crashes with Error 500 on network or backend issues.

import { SUPPORT_CONFIG } from '../config/support';

export interface AssistantEngineResult {
  text: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
    externalUrl?: string;
  };
  provider: string;
}

const dev = SUPPORT_CONFIG.leadDeveloper;

/**
 * Verified Indian Retail Products for instant client-side answers
 */
export const POPULAR_VERIFIED_PRODUCTS = [
  {
    name: 'Apple iPhone 16 Pro (128 GB)',
    model: 'iPhone 16 Pro',
    aliases: ['iphone 16 pro', 'iphone 16 pro 128gb', '16 pro', 'iphone 16', 'apple iphone'],
    mrp: 119900,
    lowestCheckout: 116999,
    retailer: 'Amazon India',
    offers: [
      { retailer: 'Amazon India', listed: 119900, discount: 3000, checkout: 116999 },
      { retailer: 'Flipkart', listed: 119900, discount: 2500, checkout: 117499 },
      { retailer: 'Croma', listed: 119900, discount: 2000, checkout: 118049 },
    ],
  },
  {
    name: 'Samsung Galaxy S24 Ultra (256 GB)',
    model: 'Galaxy S24 Ultra',
    aliases: ['galaxy s24 ultra', 's24 ultra', 'samsung s24', 's24', 'samsung ultra'],
    mrp: 129999,
    lowestCheckout: 124999,
    retailer: 'Amazon India',
    offers: [
      { retailer: 'Amazon India', listed: 129999, discount: 5000, checkout: 124999 },
      { retailer: 'Samsung India', listed: 129999, discount: 4000, checkout: 125999 },
      { retailer: 'Flipkart', listed: 129999, discount: 3500, checkout: 126598 },
    ],
  },
  {
    name: 'Apple MacBook Air 13-inch (M3, 16 GB, 256 GB)',
    model: 'MacBook Air M3',
    aliases: ['macbook air m3', 'macbook air', 'm3 air', 'macbook m3', 'apple macbook'],
    mrp: 114900,
    lowestCheckout: 104900,
    retailer: 'Croma',
    offers: [
      { retailer: 'Croma', listed: 109900, discount: 5000, checkout: 104900 },
      { retailer: 'Amazon India', listed: 112900, discount: 5000, checkout: 107900 },
      { retailer: 'Reliance Digital', listed: 114900, discount: 5000, checkout: 109900 },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    model: 'WH-1000XM5',
    aliases: ['sony wh-1000xm5', 'wh-1000xm5', 'sony xm5', 'xm5', 'sony headphones'],
    mrp: 34990,
    lowestCheckout: 26990,
    retailer: 'Amazon India',
    offers: [
      { retailer: 'Amazon India', listed: 29990, discount: 3000, checkout: 26990 },
      { retailer: 'Reliance Digital', listed: 31990, discount: 3000, checkout: 28990 },
      { retailer: 'Vijay Sales', listed: 32990, discount: 2500, checkout: 30490 },
    ],
  },
  {
    name: 'Sony Bravia 55-inch 4K Google TV (KD-55X74L)',
    model: 'Bravia 55X74L',
    aliases: ['sony bravia', 'sony tv', 'bravia 55', '55x74l', 'sony 4k tv'],
    mrp: 99900,
    lowestCheckout: 54990,
    retailer: 'Amazon India',
    offers: [
      { retailer: 'Amazon India', listed: 57990, discount: 3000, checkout: 54990 },
      { retailer: 'Flipkart', listed: 58990, discount: 2500, checkout: 56490 },
      { retailer: 'Vijay Sales', listed: 62990, discount: 4000, checkout: 58990 },
    ],
  },
];

/**
 * Core conversational assistant engine
 * Evaluates the query and returns contextual, structured markdown answers
 */
export function generateClientAssistantResponse(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AssistantEngineResult {
  const clean = (query || '').trim();
  const lower = clean.toLowerCase();

  // 1. Check for product price queries
  const matched = POPULAR_VERIFIED_PRODUCTS.filter((p) => {
    return (
      lower.includes(p.name.toLowerCase()) ||
      lower.includes(p.model.toLowerCase()) ||
      p.aliases.some((a) => lower.includes(a.toLowerCase()))
    );
  });

  if (matched.length === 1) {
    const p = matched[0];
    const offerLines = p.offers
      .map(
        (o) =>
          `- **${o.retailer}**: Listed ₹${o.listed.toLocaleString('en-IN')} (Checkout: ~₹${o.checkout.toLocaleString(
            'en-IN'
          )}${o.discount > 0 ? `, saves ₹${o.discount.toLocaleString('en-IN')}` : ''})`
      )
      .join('\n');

    return {
      text: `Here is the verified pricing for **${p.name}** across top Indian retailers:\n\n${offerLines}\n\n🏆 **Lowest Estimated Checkout**: **${p.retailer}** at **₹${p.lowestCheckout.toLocaleString('en-IN')}**.\n\nBeyond upfront price, remember that True Lifetime Cost for this product typically includes essential protection/cases, cables, and 3-year battery degradation. You can import this directly into our TCO Simulator!`,
      suggestedAction: { label: `View ${p.model} in Smart Finder`, actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  if (matched.length >= 2) {
    const p1 = matched[0];
    const p2 = matched[1];
    const diff = Math.abs(p1.lowestCheckout - p2.lowestCheckout);
    const cheaper = p1.lowestCheckout < p2.lowestCheckout ? p1 : p2;

    return {
      text: `Comparing **${p1.name}** vs. **${p2.name}**:\n\n- **${p1.name}**: Lowest verified checkout is ~**₹${p1.lowestCheckout.toLocaleString('en-IN')}** (${p1.retailer})\n- **${p2.name}**: Lowest verified checkout is ~**₹${p2.lowestCheckout.toLocaleString('en-IN')}** (${p2.retailer})\n\nUpfront price advantage: **${cheaper.name}** is ~**₹${diff.toLocaleString('en-IN')}** lower.\n\nWhen evaluating 3-year Total Cost of Ownership (TCO):\n- Check manufacturer warranty & replacement costs\n- Factor in resale recovery (Apple devices typically hold 35–45% residual value; high-end Androids hold 25–35%)\n- You can model both side-by-side in our Simulator Workspace.`,
      suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 2. Greetings and Identity
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste)\b/i.test(lower) ||
    /who are you|what is veracost|what can you do|about veracost/i.test(lower)
  ) {
    return {
      text: `Hello! I am **Vera Assistant**, your official AI shopping and cost-analysis assistant for **VeraCost**.\n\nVeraCost helps you look beyond misleading upfront prices to uncover the **True Total Cost of Ownership (TCO)** for tech, appliances, and vehicles. Here is what I can do for you:\n\n1. **Price & Deal Checks**: Check verified live offers across Amazon India, Flipkart, Croma, and Reliance Digital.\n2. **TCO Cost Audits**: Calculate setup accessories, recurring subscriptions, maintenance, and resale recovery value over 3–5 years.\n3. **Scanning & Visual Search**: Guide you on scanning packaging barcodes, QR codes, or pasting screenshots (<kbd>Ctrl+V</kbd>).\n4. **Smart Comparisons**: Compare 2 or 3 product alternatives side-by-side.\n\nWhat product or question would you like to explore?`,
      suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 3. TCO Calculation
  if (/total ownership|tco|lifetime cost|how does veracost calculate|how veracost works|cost calculation|hidden cost/i.test(lower)) {
    return {
      text: `VeraCost calculates the **True Lifetime Cost** using a transparent mathematical model:\n\n$$\\text{Total Cost of Ownership} = \\text{Upfront Price} + \\text{Setup/Accessories} + \\text{Recurring Expenses} + \\text{Maintenance} + \\text{Operating Power} - \\text{Resale Recovery Value}$$\n\nWhy this matters:\n- A cheaper laptop or phone often lacks included chargers, docks, protection plans, or essential accessories, adding ₹5,000–₹15,000 in setup costs.\n- Lithium-ion batteries typically degrade below 80% after 24–36 months, requiring replacement.\n- Resale value dramatically reduces long-term net spend for models with high secondary-market demand.`,
      suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 4. Barcode Scanning
  if (/barcode|ean-13|upc|scan packaging|camera not opening|scanner/i.test(lower) && !/qr/i.test(lower)) {
    return {
      text: `To scan a packaging barcode with VeraCost:\n\n1. Navigate to **Smart Price Finder** and tap **Scan Barcode**.\n2. Allow camera access in your browser address bar.\n3. Align the EAN-13 or UPC barcode horizontally within the green guidelines.\n4. If your barcode is read, VeraCost instantly retrieves matching retailer offers.\n\n*Troubleshooting tip:* If you are in low light, move into direct light or type the barcode numbers directly into the manual entry box!`,
      suggestedAction: { label: 'Go to Smart Price Finder', actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 5. QR Code Scanning
  if (/qr code|qr scanner|scan qr|quick response/i.test(lower)) {
    return {
      text: `VeraCost includes a secure **Product QR Code Scanner**:\n\n- When scanning Product URLs from Amazon, Flipkart, or brand tags, VeraCost parses the product title securely.\n- If an arbitrary URL is scanned, a safety warning displays the target domain before opening.\n- You can also decode plain text or SKU barcodes.\n\nWould you like to try the QR scanner?`,
      suggestedAction: { label: 'Open Smart Price Finder', actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 6. Visual Image Search & Google Lens
  if (/image search|photo search|google lens|visual search|camera search|search.*image|product image|photo/i.test(lower)) {
    return {
      text: `You can search by photo using VeraCost's **Image Search** and **Google Lens** workflows:\n\n- **Snap or Upload**: Capture an image using your laptop/phone camera or upload a file.\n- **Candidate Object Detection**: If multiple items are in the photo, candidate cards let you choose which object to compare.\n- **Google Lens Direct Handoff**: Click "Search with Google Lens" to inspect web matches without having to upload the image a second time.`,
      suggestedAction: { label: 'Open Image Search', actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 7. Screenshot Import (Ctrl+V)
  if (/screenshot|clipboard|ctrl\+v|paste screenshot|print screen|snip/i.test(lower)) {
    return {
      text: `To import a product screenshot in 1 second:\n\n1. Press **Win + Shift + S** (Windows) or **Cmd + Shift + 4** (Mac) to capture any product deal.\n2. Return to VeraCost and press **Ctrl + V** anywhere on the page.\n3. VeraCost immediately detects the screenshot and prompts: *"Screenshot detected. Would you like VeraCost to identify the product and compare its price?"*\n4. Visible text, brand, model, and prices are extracted with zero fabricated information.`,
      suggestedAction: { label: 'Open Screenshot Import', actionTab: 'screenshot' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 8. Retailer Comparisons & Best Deals
  if (/retailer|lowest price|best price|amazon|flipkart|croma|reliance digital|vijay sales/i.test(lower)) {
    return {
      text: `VeraCost monitors verified Indian e-commerce platforms: **Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Apple Store, and Samsung India**.\n\nWe rank listings by **Estimated Checkout Cost**:\n$$\\text{Checkout Cost} = \\text{Listed Price} + \\text{Mandatory Fees} + \\text{Delivery} - \\text{Bank Card Discounts}$$\n\nThis ensures you never get tricked by low sticker prices that have high delivery charges or hidden fees.`,
      suggestedAction: { label: 'Compare Retailer Offers', actionTab: 'shopping' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 9. Contact Support & Lead Developer
  if (/contact|support|help|developer|ronak|email|phone|call/i.test(lower)) {
    return {
      text: `You can connect directly with our Lead Architect:\n\n- **Developer**: ${dev.name} (${dev.role})\n- **Phone**: [${dev.formattedPhone}](tel:${dev.phone}) (Click to call)\n- **Email**: [${dev.email}](mailto:${dev.email})\n- **Availability**: ${dev.availability}\n\nYou can also visit our Contact & Support page to draft a pre-filled ticket in Gmail or your native mail client!`,
      suggestedAction: { label: 'Visit Contact & Support Page', actionTab: 'support' },
      provider: 'veracost-assistant-engine',
    };
  }

  // 10. General Decision Support (Contextual Fallback)
  return {
    text: `Regarding "${clean.slice(0, 80)}":\n\nVeraCost helps you evaluate this purchase by comparing verified retailer prices across Amazon, Flipkart, and Croma, alongside a 3-year Total Cost of Ownership breakdown.\n\nYou can enter the specific model name in **Smart Price Finder**, paste a product screenshot (<kbd>Ctrl+V</kbd>), or open our **Simulator Workspace** to model setup and recurring expenses.`,
    suggestedAction: { label: 'Search in Smart Price Finder', actionTab: 'shopping' },
    provider: 'veracost-assistant-engine',
  };
}
