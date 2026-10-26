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
  ShieldAlert, 
  Camera, 
  ArrowRight,
  Sparkles,
  Link2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { ProductCategory } from '../../types/cost';
import { inferProductCategory } from '../../engine/discovery';
import { CATEGORY_OPTIONS } from './ImageSearchModal';
import { BarcodeScannerEngine } from '../../services/barcodeScannerEngine';

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

  // Active view: 'camera' | 'upload'
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  // Decoded QR Payload State
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [parsedDomain, setParsedDomain] = useState<string | null>(null);
  const [isUrl, setIsUrl] = useState(false);
  const [isSuspiciousUrl, setIsSuspiciousUrl] = useState(false);
  const [isRetailerUrl, setIsRetailerUrl] = useState(false);

  // Resolved Product Details
  const [resolvedTitle, setResolvedTitle] = useState<string>('');
  const [resolvedCategory, setResolvedCategory] = useState<ProductCategory>('smartphones');
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch {}
      zxingControlsRef.current = null;
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

  const handleQrPayloadDecoded = useCallback(async (code: string) => {
    stopCamera();
    const raw = code.trim();
    if (!raw) return;

    setDecodedPayload(raw);
    setIsResolving(true);
    setErrorMessage(null);

    const isHttp = raw.startsWith('http://') || raw.startsWith('https://');
    setIsUrl(isHttp);

    let domainName = '';
    let suspicious = false;
    let retailerMatch = false;

    if (isHttp) {
      try {
        const parsed = new URL(raw);
        domainName = parsed.hostname.toLowerCase();
        setParsedDomain(domainName);

        // Security check: Flag non-HTTPS or raw IP destinations as suspicious
        if (parsed.protocol !== 'https:' || /^[0-9.]+$/.test(parsed.hostname)) {
          suspicious = true;
        }

        const SUPPORTED_RETAILERS = [
          'amazon.in',
          'flipkart.com',
          'croma.com',
          'reliancedigital.in',
          'vijaysales.com',
          'tatacliq.com',
          'myntra.com',
          'nykaa.com',
          'apple.com',
          'samsung.com',
        ];

        retailerMatch = SUPPORTED_RETAILERS.some((d) => domainName.includes(d));
        setIsRetailerUrl(retailerMatch);
        setIsSuspiciousUrl(suspicious);

        // If it's a retailer URL, attempt SSRF-safe product name extraction
        if (retailerMatch) {
          try {
            const parseResp = await fetch('/api/search/parse-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: raw }),
            });

            if (parseResp.ok) {
              const data = await parseResp.json();
              if (data && (data.productName || data.extractedQuery)) {
                const extracted = data.productName || data.extractedQuery;
                setResolvedTitle(extracted);
                setResolvedCategory(inferProductCategory(extracted));
                setIsResolving(false);
                return;
              }
            }
          } catch {}
        }

        // URL slug extraction fallback
        const segments = parsed.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || segments[0] || parsed.hostname;
        const cleanedSlug = lastSegment
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\b(dp|p|product|item|itm[a-z0-9]+)\b/gi, '')
          .trim();

        setResolvedTitle(cleanedSlug || domainName);
        setResolvedCategory(inferProductCategory(cleanedSlug || domainName));
      } catch {
        setIsSuspiciousUrl(true);
        setResolvedTitle(raw);
        setResolvedCategory('smartphones');
      }
    } else {
      // Plain text or SKU
      setParsedDomain(null);
      setIsSuspiciousUrl(false);
      setIsRetailerUrl(false);
      setResolvedTitle(raw);
      setResolvedCategory(inferProductCategory(raw));
    }

    setIsResolving(false);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDecodedPayload(null);
    setIsCameraStarting(true);

    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      setIsCameraStarting(false);
      setHasPermission(false);
      setErrorMessage('Camera access requires HTTPS or localhost. Please upload an image of the QR code below.');
      return;
    }

    try {
      const stream = await BarcodeScannerEngine.acquireCamera(facingMode);
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
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[QrScanner] Autoplay warning:', playErr);
        }
      }

      setIsScanning(true);
      setIsCameraStarting(false);

      // 1. Native Google BarcodeDetector API for hardware-accelerated QR decoding
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const loop = async () => {
            if (!videoRef.current || !streamRef.current || !isComponentMounted.current) return;
            try {
              if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
                const codes = await detector.detect(videoRef.current);
                if (codes.length > 0 && codes[0].rawValue) {
                  handleQrPayloadDecoded(codes[0].rawValue);
                  return;
                }
              }
            } catch {}
            animationFrameRef.current = requestAnimationFrame(loop);
          };
          animationFrameRef.current = requestAnimationFrame(loop);
          return;
        } catch (detectorErr) {
          console.warn('[QrScanner] Native BarcodeDetector init failed, using ZXing:', detectorErr);
        }
      }

      // 2. ZXing fallback dedicated to QR Code format
      if (videoRef.current) {
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        try {
          const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result && result.getText()) {
              handleQrPayloadDecoded(result.getText());
            }
          });
          zxingControlsRef.current = controls;
        } catch (zxingErr) {
          console.warn('[QrScanner] ZXing start error:', zxingErr);
        }
      }
    } catch (err: any) {
      setIsCameraStarting(false);
      setHasPermission(false);
      if (err.message === 'CAMERA_NOT_SUPPORTED') {
        setErrorMessage('Camera access is not supported on this browser. Please upload a QR image below.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions or upload an image file.');
      } else {
        setErrorMessage(`Could not access camera (${err.message || 'Device error'}). Please upload a QR image below.`);
      }
    }
  }, [facingMode, handleQrPayloadDecoded, stopCamera]);

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Image Upload QR Decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    const imageUrl = URL.createObjectURL(file);

    reader
      .decodeFromImageUrl(imageUrl)
      .then((res) => {
        URL.revokeObjectURL(imageUrl);
        if (res && res.getText()) {
          handleQrPayloadDecoded(res.getText());
        } else {
          setErrorMessage('No readable QR code found in the uploaded image. Please try a clearer picture.');
        }
      })
      .catch(() => {
        URL.revokeObjectURL(imageUrl);
        setErrorMessage('Could not decode QR code from the uploaded image. Please ensure the QR code is centered and well lit.');
      });
  };

  const handleConfirmSearch = () => {
    if (!resolvedTitle.trim()) return;
    onProductFound(resolvedTitle.trim(), resolvedCategory, isUrl ? decodedPayload || undefined : undefined);
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
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Google-Powered QR Scanner</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Decodes product QR codes, retailer links, and packaging tags with security validation
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close QR scanner">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher: Camera vs Upload */}
        {!decodedPayload && (
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
              marginBottom: '1rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'camera' ? 'var(--teal-bright)' : 'transparent',
                color: activeTab === 'camera' ? '#080c14' : 'var(--text-secondary)',
                fontWeight: activeTab === 'camera' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Camera size={14} /> Scan with Camera
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'upload' ? 'var(--teal-bright)' : 'transparent',
                color: activeTab === 'upload' ? '#080c14' : 'var(--text-secondary)',
                fontWeight: activeTab === 'upload' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Upload size={14} /> Upload QR Image
            </button>
          </div>
        )}

        {/* State A: Decoded QR Code Result & Security Inspection */}
        {decodedPayload && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* Decoded Banner */}
            <div
              style={{
                padding: '0.9rem 1rem',
                background: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid rgba(20, 184, 166, 0.25)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={24} style={{ color: 'var(--teal-bright)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  QR Code Successfully Decoded
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    wordBreak: 'break-all',
                    maxHeight: 80,
                    overflowY: 'auto',
                  }}
                >
                  {decodedPayload}
                </div>
              </div>
            </div>

            {/* URL Security Inspection Card */}
            {isUrl && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: isSuspiciousUrl ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  border: isSuspiciousUrl ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  {isSuspiciousUrl ? (
                    <ShieldAlert size={18} style={{ color: 'var(--coral-danger)' }} />
                  ) : (
                    <ShieldCheck size={18} style={{ color: 'var(--blue-highlight, #3b82f6)' }} />
                  )}
                  <strong style={{ fontSize: '0.85rem', color: isSuspiciousUrl ? 'var(--coral-danger)' : 'var(--text-main)' }}>
                    Destination Domain: {parsedDomain || 'External Link'}
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  {isSuspiciousUrl
                    ? 'Warning: This URL does not use secure HTTPS or points to an unverified IP destination. Never execute unknown scripts.'
                    : 'For your security, VeraCost never automatically navigates to unknown websites. You can review the domain or search the product in VeraCost.'}
                </p>
                <a
                  href={decodedPayload}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: isSuspiciousUrl ? 'var(--coral-danger)' : 'rgba(59, 130, 246, 0.8)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} /> Open Link in New Tab
                </a>
              </div>
            )}

            {/* Resolved Product Details Card */}
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
                Product Information to Search in VeraCost:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Product title or model name..."
                value={resolvedTitle}
                onChange={(e) => setResolvedTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem', marginBottom: '0.75rem' }}
              />

              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.45rem',
                  color: 'var(--text-main)',
                }}
              >
                Product Category:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                {CATEGORY_OPTIONS.slice(0, 6).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setResolvedCategory(opt.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: resolvedCategory === opt.id ? '2px solid var(--teal-bright)' : '1px solid var(--border-subtle)',
                      background: resolvedCategory === opt.id ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-card)',
                      color: resolvedCategory === opt.id ? 'var(--teal-bright)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: resolvedCategory === opt.id ? 700 : 500,
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmSearch}
                disabled={!resolvedTitle.trim()}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Search size={16} />
                <span>Search in VeraCost & Compare Offers</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDecodedPayload(null);
                  if (activeTab === 'camera') startCamera();
                }}
                style={{ padding: '0.7rem 1rem' }}
                title="Scan another QR code"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* State B: Live Camera Scanning Interface */}
        {!decodedPayload && activeTab === 'camera' && (
          <div>
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
                  <p style={{ fontSize: '0.88rem' }}>Starting QR viewfinder...</p>
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

              {/* QR Square Viewfinder Overlay */}
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
                      width: 180,
                      height: 180,
                      border: '2px solid var(--teal-bright)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'rgba(20, 184, 166, 0.85)',
                        boxShadow: '0 0 8px var(--teal-bright)',
                        animation: 'pulse 2s infinite',
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
                    Center QR code inside square
                  </div>
                </div>
              )}

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
                >
                  <SwitchCamera size={13} />
                  <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* State C: File Upload Interface */}
        {!decodedPayload && activeTab === 'upload' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                transition: 'border-color 0.2s',
              }}
            >
              <Upload size={36} style={{ color: 'var(--teal-bright)', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Upload QR Code Image
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                PNG, JPEG, or WebP containing a clear product QR code
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
            {errorMessage && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--amber-warning)' }}>
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
