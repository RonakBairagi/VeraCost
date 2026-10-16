import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Barcode, CheckCircle2, SwitchCamera } from 'lucide-react';
import { BarcodeLookupResult } from '../../types/shopping';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string, lookupData?: BarcodeLookupResult) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Stop camera tracks and reader controls
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch {}
      scannerControlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setIsCameraStarting(false);
  }, []);

  const handleCodeFound = useCallback(
    async (code: string) => {
      stopCamera();
      setDetectedCode(code);
      setIsLoadingLookup(true);

      try {
        const resp = await fetch('/api/search/barcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: code }),
        });

        if (resp.ok) {
          const data: BarcodeLookupResult = await resp.json();
          onBarcodeDetected(code, data);
        } else {
          onBarcodeDetected(code);
        }
      } catch {
        onBarcodeDetected(code);
      } finally {
        setIsLoadingLookup(false);
        onClose();
      }
    },
    [stopCamera, onBarcodeDetected, onClose]
  );

  // Multi-tier camera stream acquisition that works on all laptops & smartphones
  const acquireCameraStream = async (targetFacing: 'environment' | 'user'): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('CAMERA_UNSUPPORTED');
    }

    // Tier 1: Ideal target facing mode with high-definition frame
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (errTier1: any) {
      console.warn(`[BarcodeScanner] Tier 1 constraint failed (${targetFacing}), trying Tier 2:`, errTier1?.name);
    }

    // Tier 2: Simple target facing mode without resolution constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetFacing },
        audio: false,
      });
    } catch (errTier2: any) {
      console.warn(`[BarcodeScanner] Tier 2 constraint failed (${targetFacing}), trying opposite facing:`, errTier2?.name);
    }

    // Tier 3: Try opposite facing mode (e.g. laptop webcam is 'user' when 'environment' was requested)
    const oppositeFacing = targetFacing === 'environment' ? 'user' : 'environment';
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: oppositeFacing },
        audio: false,
      });
    } catch (errTier3: any) {
      console.warn(`[BarcodeScanner] Tier 3 constraint failed (${oppositeFacing}), trying generic video:`, errTier3?.name);
    }

    // Tier 4: Generic video (works with any laptop webcam, USB cam, or virtual camera)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDetectedCode(null);
    setIsCameraStarting(true);

    if (typeof window !== 'undefined' && !window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setIsCameraStarting(false);
      setHasPermission(false);
      setErrorMessage('Camera access requires a secure HTTPS connection. Please enter the barcode number manually below.');
      return;
    }

    try {
      const stream = await acquireCameraStream(facingMode);
      if (!isComponentMounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setHasPermission(true);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[BarcodeScanner] Play error:', playErr);
        }
      }

      setIsScanning(true);
      setIsCameraStarting(false);

      // Barcode detection strategy:
      // A. If native BarcodeDetector API is present (Android Chrome, Chromium):
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });

          const scanLoop = async () => {
            if (!videoRef.current || !streamRef.current || !isComponentMounted.current) return;

            try {
              if (videoRef.current.readyState >= 2) {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleCodeFound(barcodes[0].rawValue);
                  return;
                }
              }
            } catch {
              // Frame dropped or blurry, continue next frame
            }

            animationFrameRef.current = requestAnimationFrame(scanLoop);
          };

          animationFrameRef.current = requestAnimationFrame(scanLoop);
          return;
        } catch (detectorErr) {
          console.warn('[BarcodeScanner] Native detector init failed, using ZXing:', detectorErr);
        }
      }

      // B. Fallback to @zxing/browser (Works on iOS Safari, Firefox, Desktop Chrome):
      if (videoRef.current) {
        const reader = new BrowserMultiFormatReader();
        zxingReaderRef.current = reader;

        try {
          const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result && result.getText()) {
              handleCodeFound(result.getText());
            }
          });
          scannerControlsRef.current = controls;
        } catch (zxingErr) {
          console.warn('[BarcodeScanner] ZXing start error:', zxingErr);
        }
      }
    } catch (err: any) {
      setIsCameraStarting(false);
      setHasPermission(false);

      if (err.message === 'CAMERA_UNSUPPORTED') {
        setErrorMessage('Camera access is not supported by your current browser. You can enter the barcode number manually below.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions in your browser address bar or enter the barcode manually.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was detected on this device. You can enter the barcode number manually below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application or blocked by system permissions. Please close other camera apps and retry.');
      } else {
        setErrorMessage(`Could not open camera (${err.message || 'Unknown device error'}). You can enter the barcode manually below.`);
      }
    }
  }, [facingMode, handleCodeFound, stopCamera]);

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeFound(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--teal-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Barcode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Live Retail Barcode Scanner</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Scan any EAN-13, EAN-8, or UPC packaging barcode with your camera
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close scanner">
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 300,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: '#04070d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.25rem',
          }}
        >
          {/* Always-mounted video element ensures clean ref binding */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isScanning && !errorMessage ? 'block' : 'none',
            }}
          />

          {/* Camera Starting / Spinner */}
          {isCameraStarting && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: 'var(--teal-bright)',
                background: '#04070d',
              }}
            >
              <RefreshCw size={32} className="spin" />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Connecting camera...
              </div>
            </div>
          )}

          {/* Camera Flip / Controls overlay */}
          {isScanning && !errorMessage && (
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch front/back camera"
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <SwitchCamera size={14} />
                <span>{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
              </button>
            </div>
          )}

          {/* Scanning Reticle Overlay */}
          {isScanning && !errorMessage && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '80%',
                  height: 150,
                  border: '2px dashed var(--teal-bright)',
                  borderRadius: 12,
                  boxShadow: '0 0 25px rgba(20, 184, 166, 0.3), inset 0 0 15px rgba(20, 184, 166, 0.2)',
                  position: 'relative',
                }}
              >
                {/* Center scan line animation */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    right: '5%',
                    height: 2,
                    background: 'var(--teal-bright)',
                    boxShadow: '0 0 8px var(--teal-bright)',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.65)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Align product barcode inside frame
              </div>
            </div>
          )}

          {/* Loading lookup overlay */}
          {isLoadingLookup && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.88)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                zIndex: 20,
              }}
            >
              <RefreshCw size={28} className="spin" style={{ color: 'var(--teal-bright)' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Identified Barcode {detectedCode} — Fetching verified details...
              </div>
            </div>
          )}

          {/* Permission / Error / Fallback State */}
          {errorMessage && (
            <div
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                zIndex: 10,
              }}
            >
              <AlertCircle size={32} style={{ color: 'var(--amber-warning)' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 420 }}>
                {errorMessage}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={startCamera}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} />
                Try Camera Again
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Fallback Form */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '0.4rem',
            }}
          >
            Or Enter Barcode Number Manually
          </label>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              type="text"
              className="input-box"
              placeholder="e.g. 0195949791484 or 8806095368948"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ flex: 1, fontFamily: 'monospace' }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualCode.trim()}
              style={{ padding: '0.55rem 1.25rem', whiteSpace: 'nowrap' }}
            >
              Look Up
            </button>
          </form>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Supports EAN-13, EAN-8, UPC-A, and UPC-E codes found on consumer electronics, smartphones, and retail packaging.
          </div>
        </div>
      </div>
    </div>
  );
};
