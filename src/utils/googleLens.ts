/**
 * Google Lens Integration Helper
 * 
 * Supports:
 * 1. Direct Google Lens handoff when a public HTTP/HTTPS image URL is available.
 * 2. Seamless local screenshot handoff: copies image to clipboard and opens Google Lens
 *    so the user can paste (Ctrl+V) directly without re-uploading inside VeraCost.
 * 3. Transparently explains browser and Google server limitations without third-party file leaks.
 * 4. Popup-blocker safe: triggers window.open synchronously within user click gesture.
 */

export interface GoogleLensHandoffResult {
  success: boolean;
  mode: 'direct_url' | 'clipboard_handoff' | 'fallback_opened' | 'popup_blocked' | 'invalid_image';
  message: string;
  targetUrl?: string;
  popupBlocked?: boolean;
}

/**
 * Checks whether an image URL is a publicly accessible internet URL that Google servers can fetch
 */
export function isPublicImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1') || trimmed.includes('0.0.0.0')) {
    return false;
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return false;
  }
  // Basic URL validity check
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Converts a base64 dataUrl string to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binaryStr = atob(parts[1]);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Executes the optimal Google Lens search workflow
 */
export async function executeGoogleLensSearch(imageSource?: string | null): Promise<GoogleLensHandoffResult> {
  if (!imageSource) {
    return {
      success: false,
      mode: 'invalid_image',
      message: 'No image is currently selected for Google Lens search.',
    };
  }

  // Option A — Direct URL handoff for public images
  if (isPublicImageUrl(imageSource)) {
    const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageSource.trim())}`;
    const win = window.open(lensUrl, '_blank', 'noopener,noreferrer');
    const isBlocked = !win || win.closed || typeof win.closed === 'undefined';

    if (isBlocked) {
      return {
        success: false,
        mode: 'popup_blocked',
        targetUrl: lensUrl,
        popupBlocked: true,
        message: 'Popup was blocked by your browser. Click the link to open Google Lens results directly.',
      };
    }

    return {
      success: true,
      mode: 'direct_url',
      targetUrl: lensUrl,
      message: 'Google Lens opened directly with the public product image URL.',
    };
  }

  // Option B — Local screenshot / data URL / blob
  // IMPORTANT: Open window synchronously before any await to preserve the user-gesture token in Chrome/Safari!
  const targetLensUrl = 'https://lens.google.com';
  const lensWindow = window.open(targetLensUrl, '_blank', 'noopener,noreferrer');
  const isBlocked = !lensWindow || lensWindow.closed || typeof lensWindow.closed === 'undefined';

  let copiedToClipboard = false;
  if (imageSource.startsWith('data:image')) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        const blob = dataUrlToBlob(imageSource);
        const pngBlob = blob.type === 'image/png' ? blob : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': pngBlob }),
        ]);
        copiedToClipboard = true;
      }
    } catch (clipErr) {
      console.warn('[GoogleLens] Clipboard write warning:', clipErr);
    }
  }

  if (isBlocked) {
    return {
      success: false,
      mode: 'popup_blocked',
      targetUrl: targetLensUrl,
      popupBlocked: true,
      message: 'Popup was blocked by your browser. Please allow popups or click to open Google Lens.',
    };
  }

  if (copiedToClipboard) {
    return {
      success: true,
      mode: 'clipboard_handoff',
      targetUrl: targetLensUrl,
      message: 'Image copied to clipboard — press Ctrl + V on the Google Lens tab to search immediately.',
    };
  }

  return {
    success: true,
    mode: 'fallback_opened',
    targetUrl: targetLensUrl,
    message: 'Google Lens opened in a new tab. You can paste (Ctrl+V) or drag your screenshot into Google Lens.',
  };
}
