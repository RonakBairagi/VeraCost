/**
 * Google Lens Integration Helper
 * 
 * Supports:
 * 1. Direct Google Lens handoff when a public HTTP/HTTPS image URL is available.
 * 2. Seamless local screenshot handoff: copies image to clipboard and opens Google Lens
 *    so the user can paste (Ctrl+V) directly without re-uploading inside VeraCost.
 * 3. Transparently explains browser and Google server limitations without third-party file leaks.
 */

export interface GoogleLensHandoffResult {
  success: boolean;
  mode: 'direct_url' | 'clipboard_handoff' | 'fallback_opened';
  message: string;
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
  return true;
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
  // Option A — Direct URL handoff for public images
  if (imageSource && isPublicImageUrl(imageSource)) {
    const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageSource.trim())}`;
    window.open(lensUrl, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      mode: 'direct_url',
      message: 'Google Lens opened directly with the public product image URL.',
    };
  }

  // Option B — Local screenshot / data URL / blob
  let copiedToClipboard = false;
  if (imageSource && imageSource.startsWith('data:image')) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        const blob = dataUrlToBlob(imageSource);
        // Ensure PNG format for clipboard API compatibility across Chrome/Safari
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

  // Open official Google Lens home page
  window.open('https://lens.google.com', '_blank', 'noopener,noreferrer');

  if (copiedToClipboard) {
    return {
      success: true,
      mode: 'clipboard_handoff',
      message: 'Screenshot copied to clipboard! Simply press Ctrl + V on the Google Lens tab to search immediately.',
    };
  }

  return {
    success: true,
    mode: 'fallback_opened',
    message: 'Google Lens opened in a new tab. You can paste (Ctrl+V) or drag your screenshot into Google Lens.',
  };
}
