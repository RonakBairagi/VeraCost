// VeraCost Support and Lead Developer Configuration
// Configurable contact details, FAQ repository, and troubleshooting knowledge

export interface LeadDeveloperContact {
  name: string;
  phone: string;
  formattedPhone: string;
  email: string;
  role: string;
  location: string;
  portfolioOrGithub?: string;
  availability: string;
}

export interface FaqItem {
  id: string;
  category: 'general' | 'scanning' | 'pricing' | 'tco' | 'troubleshooting';
  question: string;
  answer: string;
  suggestedAction?: {
    label: string;
    actionKey: string;
  };
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  device: 'all' | 'desktop' | 'mobile';
  problem: string;
  steps: string[];
}

export const SUPPORT_CONFIG: {
  leadDeveloper: LeadDeveloperContact;
  faqs: FaqItem[];
  troubleshootingGuides: TroubleshootingGuide[];
} = {
  leadDeveloper: {
    name: 'Ronak Bairagi',
    phone: '+919051905871',
    formattedPhone: '+91 90519 05871',
    email: 'ronakbairagi83@gmail.com',
    role: 'Lead Architect & Full-Stack Developer',
    location: 'India',
    availability: 'Monday – Saturday, 9:00 AM – 7:00 PM IST',
  },
  faqs: [
    {
      id: 'faq-tco',
      category: 'tco',
      question: 'How does Total Cost of Ownership (TCO) calculation work in VeraCost?',
      answer:
        'VeraCost looks beyond the initial sticker price. Our mathematical engine models upfront retail purchase cost, required setup and accessories (cables, adapters, cases), recurring expenses (subscriptions, batteries), routine maintenance, operating energy, and estimated salvage/resale value over the product’s expected lifespan.',
    },
    {
      id: 'faq-retailers',
      category: 'pricing',
      question: 'Which retailer prices are verified and how are they compared?',
      answer:
        'VeraCost queries top verified Indian e-commerce platforms (Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Apple Store, and Samsung India). It compares listed upfront prices against estimated checkout costs (taxes, standard shipping, and discounts) to find the true lowest deal.',
    },
    {
      id: 'faq-barcode-fail',
      category: 'scanning',
      question: 'Why was my barcode detected but the product name not automatically found?',
      answer:
        'Decoding a barcode (reading the raw numbers) and identifying a product are two separate steps. If a barcode is not yet registered in public open databases (such as Open Products Facts or our verified Indian retail database), VeraCost displays the decoded barcode and allows you to search Indian retailer offers directly by that barcode or confirm the product model manually.',
    },
    {
      id: 'faq-camera-laptop',
      category: 'troubleshooting',
      question: 'Why is the camera preview not opening on my laptop or mobile browser?',
      answer:
        'Browsers strictly require a secure context (HTTPS or localhost) to access webcams. Also check if camera permissions are blocked in your browser address bar (lock/tune icon). If another video conferencing app (Zoom, Teams, Meet) is using the webcam, close it and refresh.',
    },
    {
      id: 'faq-image-accuracy',
      category: 'scanning',
      question: 'How does Google-powered visual search identify products from photos?',
      answer:
        'When you capture or upload a photo, VeraCost processes it through Google Cloud Vision or multimodal AI vision to detect packaging text, brand logos, object categories, and distinct visible items. When multiple objects are visible in one photograph, candidate cards allow you to select the exact item to compare.',
    },
    {
      id: 'faq-screenshot-privacy',
      category: 'general',
      question: 'Can VeraCost automatically detect screenshots on my operating system?',
      answer:
        'No. Standard browser security prevents any website from monitoring operating system screenshot shortcuts (such as Win+Shift+S or Command+Shift+4). VeraCost provides a dedicated Screenshot Import tool where you can paste images from your clipboard (Ctrl+V) or drag-and-drop a screenshot file with complete user privacy.',
    },
    {
      id: 'faq-ai-nemotron',
      category: 'general',
      question: 'What is NVIDIA Nemotron via Nebius Token Factory?',
      answer:
        'VeraCost is powered by NVIDIA’s Llama-3.1-Nemotron-70B model hosted on Nebius Token Factory high-performance inference cloud. It acts as an unbiased decision advisor, auditing trade-offs, hidden costs, and optimal replacement schedules.',
    },
  ],
  troubleshootingGuides: [
    {
      id: 'guide-camera-perms',
      title: 'Fixing Browser Camera Permissions',
      device: 'all',
      problem: 'Camera permission denied or camera not starting',
      steps: [
        'Click the tune or lock icon on the left side of your browser address bar.',
        'Ensure the "Camera" toggle or permission is set to "Allow".',
        'If on a laptop with an external webcam, ensure the device is plugged in.',
        'Ensure no other application (Zoom, Teams, Windows Camera app) is currently holding the camera stream.',
        'Reload the VeraCost webpage and click "Scan Barcode" or "Camera" again.',
      ],
    },
    {
      id: 'guide-barcode-lighting',
      title: 'Improving Barcode Scanning Recognition',
      device: 'all',
      problem: 'Scanner open but barcode lines not triggering a read',
      steps: [
        'Hold the barcode 15 to 25 cm (6 to 10 inches) away from the lens.',
        'Ensure direct light is shining on the barcode; avoid deep shadows or shiny plastic glare.',
        'Align the barcode horizontally across the green scanning guidelines.',
        'If using a phone, tap "Switch Camera" to toggle between back and macro lenses.',
        'If the packaging is crumpled or damaged, type the barcode numbers into the manual entry box.',
      ],
    },
    {
      id: 'guide-screenshot-paste',
      title: 'Pasting Screenshots Directly via Clipboard',
      device: 'desktop',
      problem: 'How to import a product screenshot in 1 second',
      steps: [
        'Take a screenshot of any product page using Win + Shift + S (Windows) or Cmd + Ctrl + Shift + 4 (Mac).',
        'Open VeraCost and click "Screenshot Import" in the header or shopping tab.',
        'Simply press Ctrl + V (or Cmd + V on Mac) anywhere inside the import modal.',
        'VeraCost will immediately extract visible text, model numbers, and price estimates.',
      ],
    },
  ],
};

/**
 * Generates a pre-filled mailto URL conforming to VeraCost Support Request standards
 */
export function createSupportMailtoUrl(customSubject?: string, customDescription?: string): string {
  const recipient = SUPPORT_CONFIG.leadDeveloper.email;
  const subject = customSubject?.trim() || 'VeraCost Support Request';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  const body = `Hello VeraCost Support Team,

I need assistance with VeraCost.

Issue description:
${customDescription && customDescription.trim() ? customDescription.trim() : '[Please describe your question or issue here]'}

Steps to reproduce:
1. 
2. 
3. 

Expected result:


Actual result:


Browser/device:
${userAgent}

Thank you.`;

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

