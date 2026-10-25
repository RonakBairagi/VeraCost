// Server-Side Google Cloud Vision Integration
// Supports Label Detection, Object Localization (multiple objects in photo), Web Detection & OCR
// Note: Google Cloud Vision credentials remain strictly on the server and are never exposed to the client.

export interface GoogleVisionAnalysis {
  success: boolean;
  configured: boolean;
  provider: 'google-vision';
  detectedName?: string;
  brand?: string;
  model?: string;
  category?: string;
  confidence: number;
  attributes: string[];
  candidates: Array<{
    id: string;
    name: string;
    category: string;
    confidence: number;
    brand?: string;
    model?: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    source: 'google-vision';
  }>;
  extractedText?: string;
  detectedPrice?: number;
  detectedRetailer?: string;
}

/**
 * Labels and entities that represent human anatomy, UI artifacts, or non-commercial background elements
 */
export const NON_PRODUCT_LABELS = new Set([
  'hand', 'finger', 'thumb', 'wrist', 'arm', 'skin', 'flesh', 'nail', 'gesture',
  'face', 'head', 'hair', 'person', 'human', 'people', 'man', 'woman', 'child',
  'screenshot', 'font', 'text', 'line', 'parallel', 'slope', 'angle', 'circle',
  'rectangle', 'pattern', 'multimedia', 'software', 'operating system', 'website',
  'web page', 'document', 'paper', 'material property', 'room', 'wall', 'floor',
  'ceiling', 'interior design', 'furniture', 'table', 'desk', 'photography',
  'snapshot', 'monochrome', 'black-and-white', 'lighting', 'shadow', 'wood',
  'unknown product', 'object', 'item'
]);

export function isCommercialProductLabel(label?: string | null): boolean {
  if (!label || typeof label !== 'string') return false;
  const cleaned = label.trim().toLowerCase();
  if (cleaned.length < 2) return false;
  return !NON_PRODUCT_LABELS.has(cleaned);
}

/**
 * Perform server-side Google Cloud Vision analysis on a base64 encoded image
 */
export async function analyzeImageWithGoogleVision(
  imageBase64: string,
  apiKeyOverride?: string
): Promise<GoogleVisionAnalysis | null> {
  const apiKey = (apiKeyOverride && apiKeyOverride.trim() !== '') 
    ? apiKeyOverride.trim() 
    : process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_google_cloud_vision_key')) {
    return null; // Not configured; caller will fallback gracefully
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const payload = {
    requests: [
      {
        image: {
          content: cleanBase64,
        },
        features: [
          { type: 'OBJECT_LOCALIZATION', maxResults: 8 },
          { type: 'WEB_DETECTION', maxResults: 10 },
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 5 },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[GoogleVision] HTTP ${response.status} from Google Cloud Vision API.`);
      return null;
    }

    const data = await response.json();
    const result = data?.responses?.[0];
    if (!result) return null;

    // 1. Extract Localized Objects (Candidate Objects) - filtering out human body parts
    const rawObjects = result.localizedObjectAnnotations || [];
    const candidates: GoogleVisionAnalysis['candidates'] = rawObjects
      .filter((obj: any) => isCommercialProductLabel(obj.name))
      .map((obj: any, idx: number) => {
        const normVerts = obj.boundingPoly?.normalizedVertices || [];
        const x = normVerts[0]?.x || 0;
        const y = normVerts[0]?.y || 0;
        const x2 = normVerts[2]?.x || 1;
        const y2 = normVerts[2]?.y || 1;

        return {
          id: `obj-${idx}-${Date.now()}`,
          name: obj.name || 'Identified Object',
          category: categorizeVisionLabel(obj.name),
          confidence: Math.round((obj.score || 0.8) * 100),
          boundingBox: {
            x,
            y,
            width: Math.max(0.1, x2 - x),
            height: Math.max(0.1, y2 - y),
          },
          source: 'google-vision' as const,
        };
      });

    // 2. Extract Web Detection (Best-guess product title & entities)
    const webDetection = result.webDetection || {};
    const bestGuessLabels = (webDetection.bestGuessLabels?.map((l: any) => l.label) || []).filter(isCommercialProductLabel);
    const webEntities = (webDetection.webEntities?.map((e: any) => e.description).filter(Boolean) || []).filter(isCommercialProductLabel);

    // 3. Extract Label Annotations - filtering non-products
    const labels = (result.labelAnnotations?.map((l: any) => l.description).filter(Boolean) || []).filter(isCommercialProductLabel);

    // 4. Extract OCR Text (packaging text, model numbers, price digits)
    const fullText = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || '';
    const { detectedPrice, detectedRetailer, modelHint } = parseOcrDetails(fullText);
    const detectedBrand = extractBrandFromLabels([...webEntities, ...labels, fullText]);

    // Primary detected product name:
    // Strictly require evidence of an actual commercial product or brand.
    const primaryName = bestGuessLabels[0] || webEntities[0] || candidates[0]?.name || (labels.length > 0 ? labels[0] : '');

    // If no commercial product name, brand, or model hint was found, do NOT invent one
    if (!primaryName && !detectedBrand && !modelHint) {
      return {
        success: false,
        configured: true,
        provider: 'google-vision',
        detectedName: '',
        confidence: 0,
        attributes: labels.slice(0, 5),
        candidates: [],
        extractedText: fullText.slice(0, 500),
        detectedPrice,
        detectedRetailer,
      };
    }

    const effectiveName = primaryName || (detectedBrand ? `${detectedBrand} ${modelHint || 'Product'}` : (modelHint || ''));
    const category = categorizeVisionLabel(effectiveName + ' ' + labels.join(' '));

    return {
      success: true,
      configured: true,
      provider: 'google-vision',
      detectedName: effectiveName,
      brand: detectedBrand,
      model: modelHint || effectiveName,
      category,
      confidence: Math.min(96, Math.max(75, Math.round((result.labelAnnotations?.[0]?.score || 0.88) * 100))),
      attributes: labels.slice(0, 5),
      candidates,
      extractedText: fullText.slice(0, 500),
      detectedPrice,
      detectedRetailer,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[GoogleVision] Error calling Google Cloud Vision API:', err.message);
    return null;
  }
}

/**
 * Heuristic mapper from vision labels to VeraCost product categories
 */
function categorizeVisionLabel(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('iphone') || lower.includes('galaxy') || lower.includes('smartphone')) {
    return 'smartphones';
  }
  if (lower.includes('headphone') || lower.includes('earphone') || lower.includes('audio') || lower.includes('watch') || lower.includes('airpods') || lower.includes('earbuds')) {
    return 'audio-wearables';
  }
  if (lower.includes('playstation') || lower.includes('xbox') || lower.includes('nintendo') || lower.includes('console') || lower.includes('gamepad') || lower.includes('gaming')) {
    return 'gaming';
  }
  if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('computer') || lower.includes('tablet') || lower.includes('ipad') || lower.includes('monitor')) {
    return 'electronics';
  }
  if (lower.includes('refrigerator') || lower.includes('microwave') || lower.includes('washing machine') || lower.includes('vacuum') || lower.includes('oven') || lower.includes('appliance')) {
    return 'appliances';
  }
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('ev')) {
    return 'vehicles';
  }
  return 'other';
}

/**
 * Extract known technology brands from detected labels
 */
function extractBrandFromLabels(strings: string[]): string {
  const BRANDS = [
    'Apple', 'Samsung', 'Sony', 'OnePlus', 'Dell', 'HP', 'Lenovo', 'LG', 
    'Bose', 'Microsoft', 'Nintendo', 'Google', 'Asus', 'Acer', 'Xiaomi', 
    'Realme', 'boAt', 'JBL', 'Canon', 'Nikon', 'Tesla', 'Tata'
  ];

  const joined = strings.join(' ').toLowerCase();
  for (const b of BRANDS) {
    if (joined.includes(b.toLowerCase())) {
      return b;
    }
  }
  return '';
}

/**
 * Helper to parse price numbers and retailer keywords from OCR text
 */
function parseOcrDetails(text: string) {
  let detectedPrice: number | undefined;
  let detectedRetailer: string | undefined;
  let modelHint: string | undefined;

  const lower = text.toLowerCase();

  // Retailer detection
  if (lower.includes('amazon')) detectedRetailer = 'Amazon India';
  else if (lower.includes('flipkart')) detectedRetailer = 'Flipkart';
  else if (lower.includes('croma')) detectedRetailer = 'Croma';
  else if (lower.includes('reliance digital')) detectedRetailer = 'Reliance Digital';
  else if (lower.includes('vijay sales')) detectedRetailer = 'Vijay Sales';

  // Price detection (e.g. ₹ 79,900 or Rs. 49,999 or $999)
  const priceMatch = text.match(/(?:₹|Rs\.?|INR|\$)\s?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/i);
  if (priceMatch) {
    const rawNum = priceMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 50 && parsed < 2000000) {
      detectedPrice = parsed;
    }
  }

  // Model hint
  const modelMatch = text.match(/\b([A-Z0-9]{3,}-[A-Z0-9]{3,})\b/);
  if (modelMatch) {
    modelHint = modelMatch[1];
  }

  return { detectedPrice, detectedRetailer, modelHint };
}
