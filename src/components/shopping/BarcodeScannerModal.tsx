import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Barcode, CheckCircle2 } from 'lucide-react';
import { BarcodeLookupResult } from '../../types/shopping';

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
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setDetectedCode(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Camera access is not supported by your current browser. You can enter the barcode number manually below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      setHasPermission(true);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check for native BarcodeDetector API (Chromium / Edge / Chrome Android)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });

        const scanLoop = async () => {
          if (!videoRef.current || !streamRef.current || !isScanning) return;

          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                handleCodeFound(code);
                return;
              }
            }
          } catch {
            // Frame detection error, continue next frame
          }

          animationFrameRef.current = requestAnimationFrame(scanLoop);
        };

        animationFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser or type the barcode number manually below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was detected on this device. You can enter the barcode number manually below.');
      } else {
        setErrorMessage(`Could not access camera: ${err.message || 'Unknown device error'}. You can enter the barcode manually.`);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const handleCodeFound = async (code: string) => {
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
                Scan any EAN-13, EAN-8, or UPC retail packaging barcode
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
            height: 280,
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
          {isScanning && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Scanning Reticle Overlay */}
          {isScanning && (
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
                  width: '75%',
                  height: 140,
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
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Align product barcode within frame
              </div>
            </div>
          )}

          {/* Loading lookup overlay */}
          {isLoadingLookup && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
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
              }}
            >
              <AlertCircle size={32} style={{ color: 'var(--amber-warning)' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 400 }}>
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
