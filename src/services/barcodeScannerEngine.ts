// VeraCost Unified Barcode Scanner Engine
// Orchestrates Google's native Barcode Detection API (where available in Chromium/Android)
// and ZXing (@zxing/browser) multi-format decoding fallback for desktop/iOS browsers.
// Modular architecture allows straightforward replacement with a native Android ML Kit bridge if a native APK is built.

import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export interface DecodedBarcode {
  rawValue: string;
  format: string; // e.g. 'EAN-13', 'UPC-A', 'Code 128', 'QR Code'
  rawFormat?: string;
  timestamp: string;
  engine: 'google-barcode-detector' | 'zxing-browser';
}

export interface ScannerEngineCallbacks {
  onDetected: (result: DecodedBarcode) => void;
  onError?: (err: Error) => void;
}

export class BarcodeScannerEngine {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private zxingControls: IScannerControls | null = null;
  private zxingReader: BrowserMultiFormatReader | null = null;
  private isScanning = false;
  private isDestroyed = false;

  /**
   * Acquire camera stream with progressive fallbacks for laptops and mobile devices
   */
  public static async acquireCamera(facingMode: 'environment' | 'user' = 'environment'): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('CAMERA_NOT_SUPPORTED');
    }

    // Tier 1: Target facing mode with standard HD resolution
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1: any) {
      console.warn(`[ScannerEngine] Tier 1 (${facingMode}) constraint failed:`, e1?.name);
    }

    // Tier 2: Target facing mode with no resolution constraint
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
    } catch (e2: any) {
      console.warn(`[ScannerEngine] Tier 2 (${facingMode}) constraint failed:`, e2?.name);
    }

    // Tier 3: Opposite facing mode (laptop webcams default to 'user')
    const opposite = facingMode === 'environment' ? 'user' : 'environment';
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: opposite },
        audio: false,
      });
    } catch (e3: any) {
      console.warn(`[ScannerEngine] Tier 3 (${opposite}) constraint failed:`, e3?.name);
    }

    // Tier 4: Generic video track (any available webcam, USB cam, or virtual camera)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }

  /**
   * Start decoding on a live video element
   */
  public async start(
    videoElement: HTMLVideoElement,
    mediaStream: MediaStream,
    callbacks: ScannerEngineCallbacks
  ): Promise<'google-barcode-detector' | 'zxing-browser'> {
    this.stop();
    this.isDestroyed = false;
    this.videoElement = videoElement;
    this.mediaStream = mediaStream;

    // Ensure video is properly configured for inline autoplay
    this.videoElement.srcObject = mediaStream;
    this.videoElement.setAttribute('playsinline', 'true');
    this.videoElement.setAttribute('autoplay', 'true');
    this.videoElement.muted = true;

    try {
      await this.videoElement.play();
    } catch (playErr) {
      console.warn('[ScannerEngine] Video autoplay warning:', playErr);
    }

    this.isScanning = true;

    // 1. Try Google's native Barcode Detection API first (supported in Chrome/Edge/Android)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const supportedFormats = [
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'code_128',
          'code_39',
          'qr_code',
        ];

        const detector = new (window as any).BarcodeDetector({
          formats: supportedFormats,
        });

        const scanLoop = async () => {
          if (!this.isScanning || this.isDestroyed || !this.videoElement) return;

          try {
            if (this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0) {
              const barcodes = await detector.detect(this.videoElement);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const code = barcodes[0];
                this.stop();
                callbacks.onDetected({
                  rawValue: code.rawValue.trim(),
                  format: normalizeFormatName(code.format),
                  rawFormat: code.format,
                  timestamp: new Date().toISOString(),
                  engine: 'google-barcode-detector',
                });
                return;
              }
            }
          } catch {
            // Frame dropped or blurry, continue next frame
          }

          if (this.isScanning && !this.isDestroyed) {
            this.animationFrameId = requestAnimationFrame(scanLoop);
          }
        };

        this.animationFrameId = requestAnimationFrame(scanLoop);
        return 'google-barcode-detector';
      } catch (detectorErr) {
        console.warn('[ScannerEngine] Native BarcodeDetector init failed, using ZXing:', detectorErr);
      }
    }

    // 2. ZXing MultiFormat Reader Fallback (iOS Safari, Firefox, Desktop Webcams)
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    this.zxingReader = reader;

    try {
      this.zxingControls = await reader.decodeFromVideoElement(this.videoElement, (result, err) => {
        if (result && result.getText()) {
          const text = result.getText().trim();
          const format = result.getBarcodeFormat() !== undefined 
            ? BarcodeFormat[result.getBarcodeFormat()] 
            : 'BARCODE';

          this.stop();
          callbacks.onDetected({
            rawValue: text,
            format: normalizeFormatName(format),
            rawFormat: format,
            timestamp: new Date().toISOString(),
            engine: 'zxing-browser',
          });
        }
      });
      return 'zxing-browser';
    } catch (zxingErr: any) {
      if (callbacks.onError) callbacks.onError(zxingErr);
      throw zxingErr;
    }
  }

  /**
   * Stop scanning, clear loops, and release hardware cameras
   */
  public stop() {
    this.isScanning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.zxingControls) {
      try {
        this.zxingControls.stop();
      } catch {}
      this.zxingControls = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stop();
  }
}

/**
 * Format normalizer helper to present user-friendly labels (e.g. EAN-13, UPC-A)
 */
export function normalizeFormatName(rawFormat?: string): string {
  if (!rawFormat) return 'Retail Barcode';
  const clean = rawFormat.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean.includes('ean13')) return 'EAN-13';
  if (clean.includes('ean8')) return 'EAN-8';
  if (clean.includes('upca')) return 'UPC-A';
  if (clean.includes('upce')) return 'UPC-E';
  if (clean.includes('code128')) return 'Code 128';
  if (clean.includes('code39')) return 'Code 39';
  if (clean.includes('qr')) return 'QR Code';
  return rawFormat.toUpperCase();
}
