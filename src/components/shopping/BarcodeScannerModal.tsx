import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Barcode, CheckCircle2, SwitchCamera, Sparkles, Search, HelpCircle, ArrowRight } from 'lucide-react';
import { BarcodeLookupResult } from '../../types/shopping';
import { ProductCategory } from '../../types/cost';
import { CATEGORY_OPTIONS } from './ImageSearchModal';
import { inferProductCategory } from '../../engine/discovery';
import { BarcodeScannerEngine, DecodedBarcode } from '../../services/barcodeScannerEngine';

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
  const [scannerEngineType, setScannerEngineType] = useState<string>('google-barcode-detector');

  // Distinct Decoded State
  const [decodedBarcode, setDecodedBarcode] = useState<DecodedBarcode | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);

  // Unresolved barcode resolution state (when barcode is decoded but not found in open catalog)
  const [isUnresolved, setIsUnresolved] = useState(false);
  const [unresolvedName, setUnresolvedName] = useState<string>('');
  const [unresolvedCategory, setUnresolvedCategory] = useState<ProductCategory>('smartphones');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerEngineRef = useRef<BarcodeScannerEngine | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Stop camera tracks and reader controls
  const stopCamera = useCallback(() => {
    if (scannerEngineRef.current) {
      scannerEngineRef.current.stop();
    }
    setIsScanning(false);
    setIsCameraStarting(false);
  }, []);

  const handleBarcodeDecoded = useCallback(
    async (decoded: DecodedBarcode) => {
      stopCamera();
      setDecodedBarcode(decoded);
      setIsLoadingLookup(true);
      setIsUnresolved(false);

      try {
        const resp = await fetch('/api/search/barcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: decoded.rawValue }),
        });

        if (resp.ok) {
          const data: BarcodeLookupResult = await resp.json();
          if (data && data.found && data.productName) {
            data.format = decoded.format;
            onBarcodeDetected(decoded.rawValue, data);
            onClose();
            return;
          }
        }
      } catch (lookupErr) {
        console.warn('[BarcodeScanner] Catalog lookup error:', lookupErr);
      } finally {
        setIsLoadingLookup(false);
      }

      // If barcode was successfully read but product was not found in catalog,
      // allow user to search by barcode number directly or confirm model & category
      setIsUnresolved(true);
      setUnresolvedName('');
      setUnresolvedCategory(inferProductCategory(decoded.rawValue));
    },
    [stopCamera, onBarcodeDetected, onClose]
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDecodedBarcode(null);
    setIsUnresolved(false);
    setIsCameraStarting(true);

    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      setIsCameraStarting(false);
      setHasPermission(false);
      setErrorMessage('Camera access requires HTTPS or localhost. Please enter the barcode number manually below.');
      return;
    }

    try {
      const stream = await BarcodeScannerEngine.acquireCamera(facingMode);
      if (!isComponentMounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setHasPermission(true);

      if (videoRef.current) {
        if (!scannerEngineRef.current) {
          scannerEngineRef.current = new BarcodeScannerEngine();
        }

        const engineUsed = await scannerEngineRef.current.start(videoRef.current, stream, {
          onDetected: (res) => handleBarcodeDecoded(res),
          onError: (err) => {
            console.warn('[BarcodeScanner] Decoder warning:', err.message);
          },
        });

        setScannerEngineType(
          engineUsed === 'google-barcode-detector' ? 'Google Barcode Detection API' : 'ZXing MultiFormat Engine'
        );
      }

      setIsScanning(true);
      setIsCameraStarting(false);
    } catch (err: any) {
      setIsCameraStarting(false);
      setHasPermission(false);

      if (err.message === 'CAMERA_NOT_SUPPORTED') {
        setErrorMessage('Camera access is not supported by your browser. Please enter the barcode manually below.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions in your address bar or enter the barcode manually.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was detected on this device. You can enter the barcode number manually below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application. Please close other camera apps and retry.');
      } else {
        setErrorMessage(`Could not access camera (${err.message || 'Device error'}). You can enter the barcode manually.`);
      }
    }
  }, [facingMode, handleBarcodeDecoded, stopCamera]);

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isComponentMounted.current = false;
      if (scannerEngineRef.current) {
        scannerEngineRef.current.destroy();
        scannerEngineRef.current = null;
      }
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDecoded({
        rawValue: manualCode.trim(),
        format: 'Manual Entry',
        timestamp: new Date().toISOString(),
        engine: 'zxing-browser',
      });
    }
  };

  const handleConfirmUnresolvedSearch = () => {
    if (!decodedBarcode) return;
    const finalName = unresolvedName.trim() || `Product Barcode ${decodedBarcode.rawValue}`;
    const syntheticLookup: BarcodeLookupResult = {
      found: true,
      barcode: decodedBarcode.rawValue,
      format: decodedBarcode.format,
      productName: finalName,
      category: unresolvedCategory,
      source: 'User Confirmed Retail Barcode',
      message: `Barcode ${decodedBarcode.rawValue} resolved with category ${unresolvedCategory}`,
    };
    onBarcodeDetected(decodedBarcode.rawValue, syntheticLookup);
    onClose();
  };

  const handleDirectBarcodeRetailerSearch = () => {
    if (!decodedBarcode) return;
    const syntheticLookup: BarcodeLookupResult = {
      found: true,
      barcode: decodedBarcode.rawValue,
      format: decodedBarcode.format,
      productName: decodedBarcode.rawValue,
      category: unresolvedCategory,
      source: 'Direct Retailer Barcode Query',
    };
    onBarcodeDetected(decodedBarcode.rawValue, syntheticLookup);
    onClose();
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
              <h3 style={{ fontSize: '1.25rem' }}>Retail Barcode Scanner</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Powered by Google Barcode Detection & ZXing multi-format decoding
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close scanner">
            <X size={20} />
          </button>
        </div>

        {/* State A: Loading Lookup */}
        {isLoadingLookup && decodedBarcode && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <RefreshCw
              size={36}
              className="spin"
              style={{ color: 'var(--teal-bright)', margin: '0 auto 1rem', display: 'block' }}
            />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Barcode Decoded: {decodedBarcode.rawValue}
            </h4>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--teal-bright)',
                marginBottom: '0.75rem',
              }}
            >
              Format: {decodedBarcode.format}
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Searching product database & verified Indian retail catalog...
            </p>
          </div>
        )}

        {/* State B: Barcode Decoded but Not Found in Database */}
        {!isLoadingLookup && isUnresolved && decodedBarcode && (
          <div style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                padding: '0.9rem 1rem',
                background: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.25)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={24} style={{ color: 'var(--teal-bright)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Barcode Read Successfully:{' '}
                  <span style={{ fontFamily: 'monospace', color: 'var(--teal-bright)' }}>
                    {decodedBarcode.rawValue}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Format: <strong>{decodedBarcode.format}</strong> • Decoded via {decodedBarcode.engine === 'google-barcode-detector' ? 'Google Barcode API' : 'ZXing Engine'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '0.8rem 1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                color: 'var(--amber-warning)',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                This specific barcode is not yet indexed in global open databases. You can search directly across Indian retailers or confirm the product model below:
              </div>
            </div>

            {/* Category Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--text-main)',
                }}
              >
                1. Select Product Category (for accurate TCO accessories)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                {CATEGORY_OPTIONS.slice(0, 6).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUnresolvedCategory(opt.id)}
                    style={{
                      padding: '0.55rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: unresolvedCategory === opt.id ? '2px solid var(--teal-bright)' : '1px solid var(--border-subtle)',
                      background: unresolvedCategory === opt.id ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-card)',
                      color: unresolvedCategory === opt.id ? 'var(--teal-bright)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: unresolvedCategory === opt.id ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Name Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.45rem',
                  color: 'var(--text-main)',
                }}
              >
                2. Product Name or Model (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sony WH-1000XM5, iPhone 16 Pro..."
                value={unresolvedName}
                onChange={(e) => setUnresolvedName(e.target.value)}
                style={{ width: '100%', fontSize: '0.88rem' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmUnresolvedSearch}
                style={{ flex: 1, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Search size={16} />
                <span>Search Product & Compare</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDirectBarcodeRetailerSearch}
                style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}
                title="Search retailers using the raw barcode digits"
              >
                <span>Search by Barcode</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDecodedBarcode(null);
                  setIsUnresolved(false);
                  startCamera();
                }}
                style={{ padding: '0.7rem 1rem' }}
                title="Scan another barcode"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* State C: Live Camera Scanning Interface */}
        {!isLoadingLookup && !isUnresolved && (
          <div>
            {/* Camera Viewfinder */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 280,
                background: '#0a0d14',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isScanning ? 'block' : 'none',
                }}
                playsInline
                muted
                autoPlay
              />

              {isCameraStarting && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={32} className="spin" style={{ color: 'var(--teal-bright)', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.88rem' }}>Starting camera preview...</p>
                </div>
              )}

              {errorMessage && !isCameraStarting && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--amber-warning)', maxWidth: 380 }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.45, marginBottom: '1rem' }}>{errorMessage}</p>
                  <button
                    className="btn-secondary"
                    onClick={startCamera}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} /> Retry Camera
                  </button>
                </div>
              )}

              {/* Viewfinder Target Overlay */}
              {isScanning && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 250,
                      height: 120,
                      border: '2px dashed var(--teal-bright)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'rgba(20, 184, 166, 0.85)',
                        boxShadow: '0 0 8px var(--teal-bright)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(0, 0, 0, 0.75)',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.74rem',
                      color: 'var(--teal-bright)',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    Align EAN-13, EAN-8, or UPC barcode horizontally
                  </div>
                </div>
              )}

              {/* Switch Camera Button */}
              {isScanning && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                  title="Switch between front/back or laptop cameras"
                >
                  <SwitchCamera size={13} />
                  <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>
              )}
            </div>

            {/* Engine indicator */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                padding: '0 0.25rem',
              }}
            >
              <span>Formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39</span>
              <span style={{ color: 'var(--teal-bright)', fontWeight: 600 }}>{scannerEngineType}</span>
            </div>

            {/* Manual Entry Fallback */}
            <form onSubmit={handleManualSubmit} style={{ marginTop: '0.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.45rem',
                  color: 'var(--text-main)',
                }}
              >
                Or Enter Barcode Digits Manually:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 8901030384729"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{ flex: 1, fontSize: '0.88rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!manualCode.trim()}
                  style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Search size={15} /> Look Up
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
