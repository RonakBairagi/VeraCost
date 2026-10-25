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
      expect(dev.email).toBe('ronakbairagi83@gmail.com');
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
      expect(resp.text).toContain('ronakbairagi83@gmail.com');
      expect(resp.suggestedAction?.actionTab).toBe('support');
    });

    it('explains supported Indian retailers and checkout cost ranking', () => {
      const resp = generateKnowledgeBaseAnswer('Which retailer has the lowest verified price?');
      expect(resp.text).toContain('Amazon India');
      expect(resp.text).toContain('Flipkart');
      expect(resp.text).toContain('Estimated Checkout Cost');
    });
  });

  describe('Contact & Support Mailto Standards', () => {
    it('creates pre-filled mailto URL addressed to ronakbairagi83@gmail.com with structured template', async () => {
      const { createSupportMailtoUrl } = await import('../src/config/support');
      const mailto = createSupportMailtoUrl();

      expect(mailto).toContain('mailto:ronakbairagi83@gmail.com');
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
      expect(mailto).toContain('mailto:ronakbairagi83@gmail.com');
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
});
