// Vera Assistant AI Support Chatbot Backend Service
// Integrates with NVIDIA Nemotron via Nebius Token Factory with a zero-latency Rule-Based Knowledge Engine fallback.

import { Router, Request, Response } from 'express';
import { SUPPORT_CONFIG } from '../src/config/support';

export const supportChatRouter = Router();

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
    externalUrl?: string;
  };
}

const SYSTEM_PROMPT = `You are "Vera Assistant", the official expert AI shopping and cost-analysis assistant for VeraCost.
VeraCost is a transparent Total Cost of Ownership (TCO) decision platform powered by NVIDIA Nemotron and verified Indian retailer integrations.

Your Core Capabilities & Guidelines:
1. Explain VeraCost Features: Upfront purchase price vs. Lifetime TCO (setup accessories, recurring costs, maintenance, operating energy, resale value).
2. Shopping & Scanning Troubleshooting:
   - Barcode Scanning: Reads retail EAN-13, EAN-8, UPC-A, Code 128 packaging codes. Explain that reading a barcode and finding product information in databases are separate operations.
   - QR Scanning: Decodes URLs and text. Product URLs can be parsed securely; arbitrary URLs show destination warnings.
   - Image Search: Uses Google Cloud Vision, multimodal AI, or client-side detection. If multiple objects exist, users can choose candidate objects or search with Google Lens.
   - Screenshot Import: Allows clipboard paste (Ctrl+V) or file upload. Explain honestly that web browsers cannot automatically spy on operating system shortcut keys.
3. Retailers Supported: Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Apple Store, Samsung India.
4. Support & Lead Developer:
   - Lead Architect: Ronak Bairagi
   - Phone: +919051905871 (clickable tel)
   - Email: ronakbairagi83@gmail.com
5. Strict Constraints:
   - NEVER fabricate specific live retailer stock or fake discount percentages.
   - Clarify that estimated checkout costs include delivery, fees, and standard taxes.
   - Be helpful, concise, professional, and friendly.`;

supportChatRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userMessage } = req.body || {};

    const latestText = userMessage || (Array.isArray(messages) && messages[messages.length - 1]?.content);
    if (!latestText || typeof latestText !== 'string' || latestText.trim() === '') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const trimmedQuery = latestText.trim();

    // Check if live Nebius / Nemotron AI is configured
    const customKey = (req.headers['x-nebius-api-key'] as string) || req.body?.customApiKey;
    const nebiusKey = (customKey && customKey.trim() !== '' && !customKey.includes('your_'))
      ? customKey.trim()
      : process.env.NEBIUS_API_KEY;
    const isAiConfigured = Boolean(nebiusKey && nebiusKey.trim() !== '' && !nebiusKey.includes('your_'));

    if (isAiConfigured) {
      try {
        const baseUrl = (process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1').replace(/\/+$/, '');
        const model = process.env.NEBIUS_MODEL || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF';

        const conversationPayload = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(Array.isArray(messages) ? messages.slice(-6).map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content).slice(0, 500),
          })) : [{ role: 'user', content: trimmedQuery }]),
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const aiResp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nebiusKey?.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: conversationPayload,
            temperature: 0.3,
            max_tokens: 350,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const replyText = aiData?.choices?.[0]?.message?.content?.trim();
          if (replyText) {
            return res.json({
              reply: replyText,
              provider: 'nvidia-nemotron-live',
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (aiErr: any) {
        console.warn('[VeraAssistant] AI call failed or timed out, using Knowledge Base fallback:', aiErr.message);
      }
    }

    // High-Precision Knowledge Base & FAQ Fallback Engine
    const fallbackAnswer = generateKnowledgeBaseAnswer(trimmedQuery);
    return res.json({
      reply: fallbackAnswer.text,
      suggestedAction: fallbackAnswer.suggestedAction,
      provider: 'knowledge-base-fallback',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Support Chat Error',
      message: err.message || 'Failed to generate response.',
    });
  }
});

/**
 * Intelligent Rule-Based FAQ & Knowledge Engine
 * Provides immediate, accurate answers when AI is offline or unconfigured.
 */
export function generateKnowledgeBaseAnswer(query: string): {
  text: string;
  suggestedAction?: {
    label: string;
    actionTab?: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'screenshot';
  };
} {
  const lower = query.toLowerCase();

  // 1. TCO & Total Ownership Cost
  if (lower.includes('total ownership') || lower.includes('tco') || lower.includes('how does veracost work') || lower.includes('how veracost works')) {
    return {
      text: 'VeraCost calculates the True Lifetime Cost of products. Instead of looking only at the initial sticker price, our engine factors in:\n\n1. Upfront purchase price & taxes\n2. Setup & essential accessories (adapters, cables, protection)\n3. Recurring costs (cloud, subscriptions, consumables)\n4. Maintenance & repair estimates\n5. Estimated resale recovery value at the end of useful life.\n\nThis reveals which product actually saves you money over 3 to 5 years.',
      suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
    };
  }

  // 2. Barcode Scanning
  if (lower.includes('scan') && (lower.includes('barcode') || lower.includes('ean') || lower.includes('upc') || lower.includes('camera'))) {
    return {
      text: 'To scan a retail barcode in VeraCost:\n\n1. Click "Smart Price Finder" in the navigation.\n2. Tap the "Scan Barcode" button.\n3. Grant camera permission in your browser address bar.\n4. Align the packaging barcode (EAN-13 or UPC) with the green guidelines.\n\nNote: If the barcode is read but not in public registries, VeraCost lets you search Indian retailers directly by the barcode digits or enter the product model manually.',
      suggestedAction: { label: 'Go to Smart Price Finder', actionTab: 'shopping' },
    };
  }

  // 3. QR Code Scanning
  if (lower.includes('qr') || lower.includes('quick response')) {
    return {
      text: 'VeraCost includes a secure QR Code Scanner. When you scan a QR code:\n\n- Product URLs (e.g., Amazon, Flipkart) can be parsed to extract the product title automatically.\n- General URLs display a safety warning and the destination domain before opening.\n- Plain text or SKU codes can be searched across verified retailers in one click.',
      suggestedAction: { label: 'Go to Smart Price Finder', actionTab: 'shopping' },
    };
  }

  // 4. Image Search / Photo Recognition
  if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') || lower.includes('visual')) {
    return {
      text: 'You can identify products by snapping a photo or uploading an image:\n\n1. Tap "Image Search" in Smart Price Finder.\n2. Upload a product photo or capture one with your webcam/phone camera.\n3. VeraCost analyzes labels, brand logos, packaging text, and visible objects.\n4. If multiple objects are detected, candidate cards let you choose which item to search.\n5. You can also click "Search with Google Lens" for immediate global visual search.',
      suggestedAction: { label: 'Open Image Search', actionTab: 'shopping' },
    };
  }

  // 5. Screenshot Handling
  if (lower.includes('screenshot') || lower.includes('clipboard') || lower.includes('paste')) {
    return {
      text: 'To import a product screenshot:\n\n1. Take a screenshot on your device (Win+Shift+S on Windows, or Cmd+Shift+4 on Mac).\n2. Click "Screenshot & Image Import" in VeraCost.\n3. Press Ctrl + V (or Cmd + V) to paste from your clipboard directly, or drag-and-drop the file.\n4. VeraCost extracts the product title, model number, retailer name, and price tag automatically!\n\nNote: Due to browser security, websites cannot monitor operating system shortcut keys in the background.',
      suggestedAction: { label: 'Open Screenshot Import', actionTab: 'screenshot' },
    };
  }

  // 6. Lowest Verified Price / Retailers
  if (lower.includes('lowest') || lower.includes('retailer') || lower.includes('price') || lower.includes('flipkart') || lower.includes('amazon')) {
    return {
      text: 'VeraCost compares prices across verified Indian retailers including Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, and official brand stores.\n\nWe rank offers by "Estimated Checkout Cost" (listed price + mandatory delivery charges - active discounts) so you never get surprised at checkout.',
      suggestedAction: { label: 'Compare Retailer Offers', actionTab: 'shopping' },
    };
  }

  // 7. Product Not Found Troubleshooting
  if (lower.includes('not found') || lower.includes('why could a product not be found') || lower.includes('missing')) {
    return {
      text: 'If a product or barcode is not found:\n\n1. Try entering the brand and primary model number in the search bar (e.g. "Sony WH-1000XM5" or "Galaxy S24 Ultra").\n2. For barcodes, check if the numbers were decoded correctly; you can search by raw digits.\n3. For images, crop the photo tightly around the product and avoid glare.\n4. Use the manual product resolver to input your item directly into the TCO simulator.',
      suggestedAction: { label: 'Try Search in Smart Finder', actionTab: 'shopping' },
    };
  }

  // 8. Contact Support / Lead Developer
  if (lower.includes('contact') || lower.includes('support') || lower.includes('developer') || lower.includes('ronak') || lower.includes('email') || lower.includes('phone')) {
    const dev = SUPPORT_CONFIG.leadDeveloper;
    return {
      text: `You can reach our Lead Architect directly:\n\n- Developer: ${dev.name} (${dev.role})\n- Phone: ${dev.formattedPhone} (Clickable call)\n- Email: ${dev.email} (Clickable mailto)\n- Availability: ${dev.availability}\n\nVisit our Contact & Support page to view full troubleshooting guides or send a direct support ticket.`,
      suggestedAction: { label: 'Visit Contact & Support Page', actionTab: 'support' },
    };
  }

  // 9. Comparison & Multiple Products
  if (lower.includes('compare') || lower.includes('multiple products') || lower.includes('decision')) {
    return {
      text: 'To compare multiple products side-by-side:\n\n1. In Smart Price Finder, click "Import into TCO Calculator" on any retailer offer.\n2. Repeat for a 2nd or 3rd product alternative.\n3. Navigate to "Simulator Workspace" to adjust useful lifespans, monthly costs, and replacement cycles.\n4. View interactive cost timeline charts, monthly audits, and the Nemotron AI Executive Review!',
      suggestedAction: { label: 'Open Simulator Workspace', actionTab: 'workspace' },
    };
  }

  // Default General Guidance
  return {
    text: `Hello! I am Vera Assistant. I can help you with:\n\n- How VeraCost calculates Total Cost of Ownership (TCO)\n- Barcode and QR code scanning tips\n- Google-powered visual image search & candidate selection\n- Clipboard screenshot import (Ctrl+V)\n- Multi-retailer price comparisons across Amazon, Flipkart, Croma, etc.\n- Contacting Lead Developer Ronak Bairagi (+91 90519 05871)\n\nWhat would you like to explore today?`,
    suggestedAction: { label: 'Explore Smart Price Finder', actionTab: 'shopping' },
  };
}
