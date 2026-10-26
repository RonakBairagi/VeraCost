import { describe, it, expect } from 'vitest';
import { normalizeFormatName } from '../src/services/barcodeScannerEngine';
import { SUPPORT_CONFIG } from '../src/config/support';
import { generateKnowledgeBaseAnswer } from '../server/supportChat';

describe('VeraCost Upgrade — Scanner, Visual Search, Support & AI Chatbot Tests', () => {
  describe('Barcode Format Normalization', () => {
    it('normalizes standard retail barcode format strings', () => {
      expect(normalizeFormatName('ean_13')).toBe('EAN-13');
      expect(normalizeFormatName('EAN_8')).toBe('EAN-8');
      expect(normalizeFormatName('upc_a')).toBe('UPC-A');
      expect(normalizeFormatName('upc_e')).toBe('UPC-E');
      expect(normalizeFormatName('code_128')).toBe('Code 128');
      expect(normalizeFormatName('code_39')).toBe('Code 39');
      expect(normalizeFormatName('qr_code')).toBe('QR Code');
    });

    it('falls back gracefully on empty or unknown formats', () => {
      expect(normalizeFormatName('')).toBe('Retail Barcode');
      expect(normalizeFormatName(undefined)).toBe('Retail Barcode');
      expect(normalizeFormatName('custom_format')).toBe('CUSTOM_FORMAT');
    });
  });

  describe('Lead Developer & Support Configuration', () => {
    it('contains exact configured lead developer contact details', () => {
      const dev = SUPPORT_CONFIG.leadDeveloper;
      expect(dev.name).toBe('Ronak Bairagi');
      expect(dev.phone).toBe('+919051905871');
      // Intended support email updated to ronakbaidya83@gmail.com per user requirement
      expect(dev.email).toBe('ronakbaidya83@gmail.com');
      expect(dev.role).toContain('Lead Architect');
    });

    it('provides comprehensive FAQs covering TCO, barcode, and visual recognition', () => {
      const faqs = SUPPORT_CONFIG.faqs;
      expect(faqs.length).toBeGreaterThanOrEqual(5);

      const hasTco = faqs.some((f) => f.category === 'tco');
      const hasScanning = faqs.some((f) => f.category === 'scanning');
      const hasTroubleshooting = faqs.some((f) => f.category === 'troubleshooting');

      expect(hasTco).toBe(true);
      expect(hasScanning).toBe(true);
      expect(hasTroubleshooting).toBe(true);
    });

    it('provides structured troubleshooting guides for camera permissions and barcodes', () => {
      const guides = SUPPORT_CONFIG.troubleshootingGuides;
      expect(guides.length).toBeGreaterThanOrEqual(3);

      const camGuide = guides.find((g) => g.id === 'guide-camera-perms');
      expect(camGuide).toBeDefined();
      expect(camGuide?.steps.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Vera Assistant Knowledge Base & FAQ Engine', () => {
    it('explains Total Cost of Ownership (TCO) methodology', () => {
      const resp = generateKnowledgeBaseAnswer('How does total ownership cost work?');
      expect(resp.text).toContain('Lifetime Cost');
      expect(resp.text).toContain('accessories');
      expect(resp.suggestedAction?.actionTab).toBe('workspace');
    });

    it('answers barcode scanning troubleshooting questions', () => {
      const resp = generateKnowledgeBaseAnswer('How do I scan a barcode?');
      expect(resp.text).toContain('Scan Barcode');
      expect(resp.text).toContain('EAN-13');
      expect(resp.suggestedAction?.actionTab).toBe('shopping');
    });

    it('explains QR code scanning and safety validation', () => {
      const resp = generateKnowledgeBaseAnswer('How does QR code scanning work?');
      expect(resp.text).toContain('QR Code Scanner');
      expect(resp.text).toContain('Product URLs');
      expect(resp.suggestedAction?.actionTab).toBe('shopping');
    });

    it('explains visual image search and multi-object candidate selection', () => {
      const resp = generateKnowledgeBaseAnswer('How can I search using a product image?');
      expect(resp.text).toContain('Image Search');
      expect(resp.text).toContain('candidate cards');
      expect(resp.text).toContain('Google Lens');
      expect(resp.suggestedAction?.actionTab).toBe('shopping');
    });

    it('explains clipboard screenshot import with browser privacy safeguards', () => {
      const resp = generateKnowledgeBaseAnswer('How do I import a screenshot from clipboard?');
      expect(resp.text).toContain('Ctrl + V');
      expect(resp.text).toContain('Screenshot');
      expect(resp.suggestedAction?.actionTab).toBe('screenshot');
    });

    it('provides lead developer contact details when asked for support', () => {
      const resp = generateKnowledgeBaseAnswer('How can I contact support or the developer?');
      expect(resp.text).toContain('Ronak Bairagi');
      expect(resp.text).toContain('+91 90519 05871');
      expect(resp.text).toContain('ronakbaidya83@gmail.com');
      expect(resp.suggestedAction?.actionTab).toBe('support');
    });

    it('explains supported Indian retailers and checkout cost ranking', () => {
      const resp = generateKnowledgeBaseAnswer('Which retailer has the lowest verified price?');
      expect(resp.text).toContain('Amazon India');
      expect(resp.text).toContain('Flipkart');
      expect(resp.text).toContain('Estimated Checkout Cost');
    });
  });

  describe('Contact & Support Mailto and Gmail Compose Standards', () => {
    it('creates pre-filled mailto URL addressed to ronakbaidya83@gmail.com with structured template', async () => {
      const { createSupportMailtoUrl } = await import('../src/config/support');
      const mailto = createSupportMailtoUrl();

      expect(mailto).toContain('mailto:ronakbaidya83@gmail.com');
      expect(mailto).toContain('subject=VeraCost%20Support%20Request');
      expect(mailto).toContain('Hello%20VeraCost%20Support%20Team');
      expect(mailto).toContain('Issue%20description%3A');
      expect(mailto).toContain('Steps%20to%20reproduce%3A');
      expect(mailto).toContain('Expected%20result%3A');
      expect(mailto).toContain('Actual%20result%3A');
      expect(mailto).toContain('Browser%2Fdevice%3A');
      expect(mailto).toContain('Thank%20you.');
    });

    it('embeds custom subject and user issue description into mailto template', async () => {
      const { createSupportMailtoUrl } = await import('../src/config/support');
      const customSubject = 'Barcode scan issue with EAN-13';
      const customDesc = 'Camera preview opened but barcode was not read under warm lighting';
      const mailto = createSupportMailtoUrl(customSubject, customDesc);

      expect(mailto).toContain(encodeURIComponent(customSubject));
      expect(mailto).toContain(encodeURIComponent(customDesc));
      expect(mailto).toContain('mailto:ronakbaidya83@gmail.com');
    });

    it('creates direct Gmail web compose URL with verified recipient and template', async () => {
      const { createGmailComposeUrl } = await import('../src/config/support');
      const gmailUrl = createGmailComposeUrl();

      expect(gmailUrl).toContain('https://mail.google.com/mail/?view=cm&fs=1');
      expect(gmailUrl).toContain('to=ronakbaidya83%40gmail.com');
      expect(gmailUrl).toContain('su=VeraCost%20Support%20Request');
      expect(gmailUrl).toContain('Hello%20VeraCost%20Support%20Team');
      expect(gmailUrl).toContain('Issue%20description%3A');
      expect(gmailUrl).toContain('Steps%20to%20reproduce%3A');
      expect(gmailUrl).toContain('Expected%20result%3A');
      expect(gmailUrl).toContain('Actual%20result%3A');
      expect(gmailUrl).toContain('Browser%2Fdevice%3A');
      expect(gmailUrl).toContain('Thank%20you.');
    });
  });

  describe('Voice Synthesis Text Sanitization', () => {
    it('strips markdown, code blocks, and URLs to ensure natural TTS audio', async () => {
      const { cleanTextForSpeech } = await import('../server/voiceRoutes');
      
      const raw = 'Check out `https://amazon.in/dp/B0CHX` for **iPhone 16**!\n\n```json\n{"mrp": 119900}\n```\n- Price: ₹1,19,900\n- Best deal!';
      const cleaned = cleanTextForSpeech(raw);

      expect(cleaned).not.toContain('```');
      expect(cleaned).not.toContain('https://');
      expect(cleaned).not.toContain('**');
      expect(cleaned).toContain('Rs. 1,19,900');
      expect(cleaned).toContain('iPhone 16');
      expect(cleaned).toContain('Best deal!');
    });
  });

  describe('Google Lens Search & URL Validation', () => {
    it('accurately distinguishes public HTTP/HTTPS images from local dataUrls or localhost', async () => {
      const { isPublicImageUrl } = await import('../src/utils/googleLens');

      // Public URLs supported by Google Lens uploadbyurl
      expect(isPublicImageUrl('https://m.media-amazon.com/images/I/71yzJoE7WlL._SX679_.jpg')).toBe(true);
      expect(isPublicImageUrl('http://example.com/product.png')).toBe(true);

      // Local / temporary / private URLs that Google servers CANNOT fetch
      expect(isPublicImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')).toBe(false);
      expect(isPublicImageUrl('blob:http://localhost:5173/b3d4f5-a1b2')).toBe(false);
      expect(isPublicImageUrl('http://localhost:3000/test.png')).toBe(false);
      expect(isPublicImageUrl('http://127.0.0.1:8080/image.jpg')).toBe(false);
      expect(isPublicImageUrl('')).toBe(false);
      expect(isPublicImageUrl(null)).toBe(false);
      expect(isPublicImageUrl(undefined)).toBe(false);
    });
  });

  describe('Evidence-Based Visual Analysis & Non-Product Filtering', () => {
    it('filters out human anatomical labels and UI noise from commercial product detection', async () => {
      const { isCommercialProductLabel } = await import('../server/services/googleVision');

      // Anatomical and noise labels must be rejected
      expect(isCommercialProductLabel('Hand')).toBe(false);
      expect(isCommercialProductLabel('finger')).toBe(false);
      expect(isCommercialProductLabel('skin')).toBe(false);
      expect(isCommercialProductLabel('flesh')).toBe(false);
      expect(isCommercialProductLabel('nail')).toBe(false);
      expect(isCommercialProductLabel('gesture')).toBe(false);
      expect(isCommercialProductLabel('screenshot')).toBe(false);
      expect(isCommercialProductLabel('rectangle')).toBe(false);
      expect(isCommercialProductLabel('room')).toBe(false);

      // Genuine products and commercial brands must be accepted
      expect(isCommercialProductLabel('Headphones')).toBe(true);
      expect(isCommercialProductLabel('Laptop')).toBe(true);
      expect(isCommercialProductLabel('Sony WH-1000XM5')).toBe(true);
      expect(isCommercialProductLabel('Smartphone')).toBe(true);
      expect(isCommercialProductLabel('Microwave')).toBe(true);
    });

    it('falls back to category "other" instead of inventing "smartphones" or "electronics"', async () => {
      const { inferProductCategory } = await import('../src/engine/discovery');

      // Unrecognized/ambiguous text must never invent smartphones
      expect(inferProductCategory('Random Unclear Object')).toBe('other');
      expect(inferProductCategory('', '')).toBe('other');
      expect(inferProductCategory(undefined, undefined)).toBe('other');

      // Known products remain accurately mapped
      expect(inferProductCategory('iPhone 16 Pro')).toBe('smartphones');
      expect(inferProductCategory('Sony WH-1000XM5')).toBe('audio-wearables');
      expect(inferProductCategory('MacBook Pro M3')).toBe('electronics');
      expect(inferProductCategory('PlayStation 5')).toBe('gaming');
      expect(inferProductCategory('Samsung 253L Refrigerator')).toBe('appliances');
    });
  });

  describe('Vera Dynamic & Contextual Assistant Pipeline', () => {
    it('retrieves real verified pricing for catalog products without hallucinations', async () => {
      const { generateContextualAssistantResponse } = await import('../server/supportChat');

      const resp = generateContextualAssistantResponse('What is the lowest price for iPhone 16 Pro?');
      expect(resp.text).toContain('iPhone 16 Pro');
      expect(resp.text).toContain('Croma');
      expect(resp.text).toContain('Lowest Estimated Checkout');
      expect(resp.suggestedAction?.actionTab).toBe('shopping');
    });

    it('understands follow-up questions referencing products in conversation history', async () => {
      const { generateContextualAssistantResponse } = await import('../server/supportChat');

      const history = [
        { role: 'user' as const, content: 'Can you tell me about the Sony WH-1000XM5 headphones?' },
        { role: 'assistant' as const, content: 'Sony WH-1000XM5 is a flagship noise cancelling headphone.' },
      ];

      const resp = generateContextualAssistantResponse('How much does it cost at checkout?', history);
      expect(resp.text).toContain('Sony WH-1000XM5');
      expect(resp.text).toContain('Croma');
      expect(resp.text).toContain('True TCO');
    });

    it('compares two products side-by-side with verified checkout costs', async () => {
      const { generateContextualAssistantResponse } = await import('../server/supportChat');

      const resp = generateContextualAssistantResponse('Compare iPhone 16 Pro vs Samsung Galaxy S24 Ultra');
      expect(resp.text).toContain('iPhone 16 Pro');
      expect(resp.text).toContain('Samsung Galaxy S24 Ultra');
      expect(resp.text).toContain('Upfront price advantage');
      expect(resp.text).toContain('3-year Total Cost of Ownership');
      expect(resp.suggestedAction?.actionTab).toBe('workspace');
    });

    it('generates contextual fallback for arbitrary queries without repeating a static answer', async () => {
      const { generateContextualAssistantResponse } = await import('../server/supportChat');

      const resp1 = generateContextualAssistantResponse('Will solar panels save me money in Bangalore?');
      const resp2 = generateContextualAssistantResponse('Is mechanical keyboard maintenance expensive?');

      expect(resp1.text).not.toBe(resp2.text);
      expect(resp1.text).toContain('solar panels');
      expect(resp2.text).toContain('mechanical keyboard');
    });
  });

  describe('Firebase Authentication & Error Mapping', () => {
    it('maps Firebase auth error codes to clear user-friendly guidance', async () => {
      const { getFirebaseErrorMessage } = await import('../src/config/firebase');

      expect(getFirebaseErrorMessage('auth/invalid-email')).toContain('improperly formatted');
      expect(getFirebaseErrorMessage('auth/wrong-password')).toContain('Incorrect email or password');
      expect(getFirebaseErrorMessage('auth/email-already-in-use')).toContain('already exists');
      expect(getFirebaseErrorMessage('auth/weak-password')).toContain('at least 6 characters');
      expect(getFirebaseErrorMessage('auth/too-many-requests')).toContain('temporarily restricted');
      expect(getFirebaseErrorMessage('unknown-code')).toContain('An error occurred');
    });

    it('safely detects whether Firebase credentials are configured without throwing', async () => {
      const { isFirebaseConfigured, FIREBASE_CONFIG } = await import('../src/config/firebase');
      expect(FIREBASE_CONFIG.projectId).toBe('veracost-5f3c5');
      expect(FIREBASE_CONFIG.apiKey).toBe('AIzaSyDsw9ZPuiXXnJtqfGp4jEAjZvOygv93gi0');
      expect(FIREBASE_CONFIG.authDomain).toBe('veracost-5f3c5.firebaseapp.com');
      expect(FIREBASE_CONFIG.storageBucket).toBe('veracost-5f3c5.firebasestorage.app');
      expect(FIREBASE_CONFIG.messagingSenderId).toBe('721160941441');
      expect(FIREBASE_CONFIG.appId).toBe('1:721160941441:web:8b9670e6087c32c09d0280');
      expect(FIREBASE_CONFIG.measurementId).toBe('G-WTBKS0LNZE');
      expect(isFirebaseConfigured()).toBe(true);
    });
  });

  describe('Client-Side Resilient Assistant Engine', () => {
    it('generates immediate verified pricing without calling backend', async () => {
      const { generateClientAssistantResponse } = await import('../src/services/assistantEngine');
      const resp = generateClientAssistantResponse('iPhone 16 pro price in amazon');
      expect(resp.text).toContain('iPhone 16 Pro');
      expect(resp.text).toContain('Lowest Estimated Checkout');
      expect(resp.suggestedAction?.actionTab).toBe('shopping');
    });

    it('answers voice queries about TCO calculations and scanning', async () => {
      const { generateClientAssistantResponse } = await import('../src/services/assistantEngine');
      const respTco = generateClientAssistantResponse('How does VeraCost calculate lifetime cost?');
      expect(respTco.text).toContain('Total Cost of Ownership');
      expect(respTco.suggestedAction?.actionTab).toBe('workspace');

      const respBarcode = generateClientAssistantResponse('How to scan a barcode with camera?');
      expect(respBarcode.text).toContain('EAN-13');
      expect(respBarcode.suggestedAction?.actionTab).toBe('shopping');
    });

    it('provides developer contact details for support queries', async () => {
      const { generateClientAssistantResponse } = await import('../src/services/assistantEngine');
      const respSupport = generateClientAssistantResponse('How can I contact the developer?');
      expect(respSupport.text).toContain('Ronak Bairagi');
      expect(respSupport.text).toContain('+91 90519 05871');
      expect(respSupport.text).toContain('ronakbaidya83@gmail.com');
      expect(respSupport.suggestedAction?.actionTab).toBe('support');
    });
  });
});
