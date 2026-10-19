import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  QrCode, 
  X, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  SwitchCamera, 
  Upload, 
  Search, 
  ExternalLink, 
  Camera, 
  ArrowRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ProductCategory } from '../../types/cost';
import { inferProductCategory } from '../../engine/discovery';
import { CATEGORY_OPTIONS } from './ImageSearchModal';

interface ProductQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (productName: string, category: ProductCategory, sourceUrl?: string) => void;
}

export const ProductQrScannerModal: React.FC<ProductQrScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Detection & Resolution State
  const [rawPayload, setRawPayload] = useState<string | null>(null);
  const [detectedTitle, setDetectedTitle] = useState<string>('');
  const [detectedCategory, setDetectedCategory] = useState<ProductCategory>('smartphones');
  const [isResolving, setIsResolving] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Tab: 'camera' | 'upload'
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Multi-tier camera stream acquisition that works on all laptops & smartphones
  const acquireCameraStream = async (targetFacing: 'environment' | 'user'): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('CAMERA_UNSUPPORTED');
    }

    // Tier 1: Target facing with high resolution for sharp QR lines
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1: any) {
      console.warn(`[QrScanner] Tier 1 (${targetFacing}) failed:`, e1?.name);
    }

    // Tier 2: Simple target facing mode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetFacing },
        audio: false,
      });
    } catch (e2: any) {
      console.warn(`[QrScanner] Tier 2 (${targetFacing}) failed:`, e2?.name);
    }

    // Tier 3: Opposite facing mode (laptop webcams default to 'user')
    const opposite = targetFacing === 'environment' ? 'user' : 'environment';
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: opposite },
        audio: false,
      });
    } catch (e3: any) {
      console.warn(`[QrScanner] Tier 3 (${opposite}) failed:`, e3?.name);
    }

    // Tier 4: Generic video (laptop webcams & USB cameras)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  // Process decoded QR text (URL, SKU, or Product Name)
  const handleQrDecoded = useCallback(async (code: string) => {
    stopCamera();
    const trimmed = code.trim();
    if (!trimmed) return;

    setRawPayload(trimmed);
    setIsResolving(true);
    setErrorMessage(null);

    let resolvedName = '';
    let resolvedCat: ProductCategory = 'electronics';

    // A. Check if the QR payload is a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        // Attempt SSRF-safe URL parsing endpoint
        const parseResp = await fetch('/api/search/parse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });

        if (parseResp.ok) {
          const data = await parseResp.json();
          if (data && (data.productName || data.extractedQuery)) {
            resolvedName = data.productName || data.extractedQuery;
          }
        }
      } catch {
        // Fallback to URL path extraction
      }

      // If backend didn't extract name, heuristically parse the URL slug
      if (!resolvedName) {
        try {
          const urlObj = new URL(trimmed);
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          const slug = pathSegments[pathSegments.length - 1] || pathSegments[0] || urlObj.hostname;
          resolvedName = slug
            .replace(/\.[a-z0-9]+$/i, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b(dp|p|product|item|itm[a-z0-9]+)\b/gi, '')
            .trim();
        } catch {
          resolvedName = trimmed;
        }
      }
    } else {
      // B. QR code contains a plain product SKU, barcode number, or model name
      resolvedName = trimmed;
    }

    // Infer product category based on resolved text
    resolvedCat = inferProductCategory(resolvedName);

    setDetectedTitle(resolvedName || trimmed);
    setDetectedCategory(resolvedCat);
    setIsResolving(false);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setRawPayload(null);
    setIsCameraStarting(true);

    if (typeof window !== 'undefined' && !window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setIsCameraStarting(false);
      setHasPermission(false);
      setErrorMessage('Camera access requires HTTPS or localhost. Please enter or upload the QR code below.');
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[QrScanner] Play error:', playErr);
        }
      }

      setIsScanning(true);
      setIsCameraStarting(false);

      // 1. Native BarcodeDetector API for hardware-accelerated QR decoding
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const loop = async () => {
            if (!videoRef.current || !streamRef.current || !isComponentMounted.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleQrDecoded(barcodes[0].rawValue);
                  return;
                }
              }
            } catch {}
            animationFrameRef.current = requestAnimationFrame(loop);
          };
          animationFrameRef.current = requestAnimationFrame(loop);
          return;
        } catch (detErr) {
          console.warn('[QrScanner] Native BarcodeDetector init failed, using ZXing:', detErr);
        }
      }

      // 2. ZXing BrowserMultiFormatReader fallback
      if (videoRef.current) {
        const reader = new BrowserMultiFormatReader();
        zxingReaderRef.current = reader;
        try {
          const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result && result.getText()) {
              handleQrDecoded(result.getText());
            }
          });
          scannerControlsRef.current = controls;
        } catch (zxingErr) {
          console.warn('[QrScanner] ZXing start error:', zxingErr);
        }
      }
    } catch (err: any) {
      setIsCameraStarting(false);
      setHasPermission(false);
      if (err.message === 'CAMERA_UNSUPPORTED') {
        setErrorMessage('Camera access is not supported by your current browser. You can upload an image or enter the code manually.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied in your browser settings. Please allow camera permissions or upload an image.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was detected on this device. You can upload an image file of the QR code below.');
      } else {
        setErrorMessage(`Could not access camera (${err.message || 'Device error'}). You can upload a photo instead.`);
      }
    }
  }, [facingMode, handleQrDecoded, stopCamera]);

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen && activeTab === 'camera') {
      startCamera();
    }
    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Decode QR from uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const zxing = new BrowserMultiFormatReader();
        const result = await zxing.decodeFromImageUrl(dataUrl);
        if (result && result.getText()) {
          handleQrDecoded(result.getText());
        } else {
          setErrorMessage('Could not find a valid QR code in the uploaded image. Please ensure the QR code is clearly visible and well-lit.');
        }
      } catch (decodeErr: any) {
        setErrorMessage('No readable QR code found in this photo. Try snapping a closer, sharper photograph.');
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  const handleConfirmAndSearch = () => {
    if (!detectedTitle.trim()) return;
    const url = rawPayload?.startsWith('http') ? rawPayload : undefined;
    onProductFound(detectedTitle.trim(), detectedCategory, url);
    onClose();
  };

  const handleReset = () => {
    setRawPayload(null);
    setDetectedTitle('');
    setDetectedCategory('smartphones');
    setErrorMessage(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--cyan-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Scan Product QR Code</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Point camera at the QR code on the product packaging, manual, or retail tag
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close QR scanner">
            <X size={20} />
          </button>
        </div>

        {/* View Switcher Tabs (Camera vs Upload Photo) */}
        {!rawPayload && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem',
              background: 'var(--bg-elevated)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'camera' ? 600 : 400,
                background: activeTab === 'camera' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'camera' ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                border: activeTab === 'camera' ? '1px solid var(--border-medium)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Camera size={14} />
              <span>Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('upload');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'upload' ? 600 : 400,
                background: activeTab === 'upload' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'upload' ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                border: activeTab === 'upload' ? '1px solid var(--border-medium)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Upload size={14} />
              <span>Upload QR Photo</span>
            </button>
          </div>
        )}

        {/* View 1: Active Camera Scanning */}
        {!rawPayload && activeTab === 'camera' && (
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 290,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: '#04070d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-medium)',
                marginBottom: '1rem',
              }}
            >
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
                    color: 'var(--cyan-primary)',
                    background: '#04070d',
                  }}
                >
                  <RefreshCw size={32} className="spin" />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Initializing high-speed QR sensor...
                  </div>
                </div>
              )}

              {/* Camera Switcher */}
              {isScanning && !errorMessage && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Switch front/back camera"
                    style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.35rem 0.75rem',
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

              {/* High-Tech QR Reticle Overlay */}
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
                  {/* Square target box */}
                  <div
                    style={{
                      width: 190,
                      height: 190,
                      border: '2px solid rgba(6, 182, 212, 0.6)',
                      borderRadius: 16,
                      boxShadow: '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.15)',
                      position: 'relative',
                    }}
                  >
                    {/* Corner accents */}
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 22, height: 22, borderTop: '4px solid var(--cyan-primary)', borderLeft: '4px solid var(--cyan-primary)', borderTopLeftRadius: 16 }} />
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderTop: '4px solid var(--cyan-primary)', borderRight: '4px solid var(--cyan-primary)', borderTopRightRadius: 16 }} />
                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: 22, height: 22, borderBottom: '4px solid var(--cyan-primary)', borderLeft: '4px solid var(--cyan-primary)', borderBottomLeftRadius: 16 }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottom: '4px solid var(--cyan-primary)', borderRight: '4px solid var(--cyan-primary)', borderBottomRightRadius: 16 }} />
                    
                    {/* Sweep bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '8%',
                        right: '8%',
                        height: 2,
                        background: 'var(--cyan-primary)',
                        boxShadow: '0 0 10px var(--cyan-primary)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '0.85rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    Align QR code inside box
                  </div>
                </div>
              )}
            </div>

            {/* Manual entry fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  handleQrDecoded(manualCode.trim());
                }
              }}
              style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <input
                type="text"
                className="input-box"
                placeholder="Or paste QR link or SKU directly..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{ flex: 1, fontSize: '0.82rem' }}
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={!manualCode.trim()}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                Decode
              </button>
            </form>
          </div>
        )}

        {/* View 2: Upload QR Photo */}
        {!rawPayload && activeTab === 'upload' && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                transition: 'border-color var(--transition-fast)',
                marginBottom: '1rem',
              }}
            >
              <QrCode size={36} style={{ color: 'var(--cyan-primary)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Click to browse photo with QR code
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Upload packaging or invoice photo (JPEG, PNG, or WebP)
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* View 3: Decoded Result & Product Confirmation Screen */}
        {rawPayload && (
          <div>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cyan-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>Product QR Code Successfully Decoded</span>
              </div>
              
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'monospace', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
                {rawPayload}
              </div>

              {isResolving && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--teal-bright)' }}>
                  <RefreshCw size={13} className="spin" />
                  Resolving product catalog details...
                </div>
              )}
            </div>

            {/* Editable Product Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Product Name / Model
              </label>
              <input
                type="text"
                className="input-box"
                value={detectedTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setDetectedTitle(val);
                  if (val.trim()) {
                    setDetectedCategory(inferProductCategory(val));
                  }
                }}
                placeholder="Product name or model"
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Verify product name before searching live prices across retailers
              </div>
            </div>

            {/* Product Category Selector for Accurate TCO Accessories */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Product Category (determines TCO accessory recommendations)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '0.4rem' }}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isCatSelected = detectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDetectedCategory(cat.id)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem',
                        fontWeight: isCatSelected ? 600 : 400,
                        background: isCatSelected ? 'rgba(6, 182, 212, 0.16)' : 'var(--bg-elevated)',
                        color: isCatSelected ? 'var(--cyan-primary)' : 'var(--text-main)',
                        border: `1.5px solid ${isCatSelected ? 'var(--cyan-primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textAlign: 'left',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Selected: <strong style={{ color: 'var(--cyan-primary)' }}>{CATEGORY_OPTIONS.find((c) => c.id === detectedCategory)?.label || detectedCategory}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                Scan Another QR
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!detectedTitle.trim()}
                onClick={handleConfirmAndSearch}
                style={{
                  background: 'linear-gradient(135deg, var(--teal-primary), var(--cyan-primary))',
                  fontWeight: 600,
                }}
              >
                <Search size={15} />
                Compare Retailer Prices
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--amber-warning)',
              fontSize: '0.82rem',
              marginTop: '1rem',
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
