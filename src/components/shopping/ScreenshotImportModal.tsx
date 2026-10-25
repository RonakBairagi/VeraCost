import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Scissors, 
  X, 
  Upload, 
  Clipboard, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Store, 
  Tag, 
  ArrowRight,
  Info,
  ExternalLink,
  Sparkles,
  Download,
  HelpCircle,
  FileImage
} from 'lucide-react';
import { ImageRecognitionResult } from '../../types/shopping';
import { ProductCategory } from '../../types/cost';
import { CATEGORY_OPTIONS } from './ImageSearchModal';
import { inferProductCategory } from '../../engine/discovery';
import { executeGoogleLensSearch, dataUrlToBlob } from '../../utils/googleLens';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductImported: (productName: string, category: ProductCategory, initialPriceEstimate?: number) => void;
  initialImage?: string | null;
  onClearInitialImage?: () => void;
}

type ModalStage = 'empty' | 'prompt' | 'analyzing' | 'result';

export const ScreenshotImportModal: React.FC<ScreenshotImportModalProps> = ({
  isOpen,
  onClose,
  onProductImported,
  initialImage,
  onClearInitialImage,
}) => {
  const [stage, setStage] = useState<ModalStage>('empty');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width?: number; height?: number; sizeKb?: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lensNotice, setLensNotice] = useState<string | null>(null);

  // Evidence-based extracted details
  const [isConfident, setIsConfident] = useState(false);
  const [detectedTitle, setDetectedTitle] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<ProductCategory>('other');
  const [detectedPrice, setDetectedPrice] = useState<string>('');
  const [detectedRetailer, setDetectedRetailer] = useState<string>('');
  const [extractedOcrSnippet, setExtractedOcrSnippet] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Deduplication tracker
  const lastProcessedTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset or initialize state when isOpen or initialImage changes
  useEffect(() => {
    if (!isOpen) {
      setStage('empty');
      setSelectedImage(null);
      setImageMeta(null);
      setErrorMessage(null);
      setLensNotice(null);
      setIsConfident(false);
      setDetectedTitle('');
      setDetectedCategory('other');
      setDetectedPrice('');
      setDetectedRetailer('');
      setExtractedOcrSnippet('');
      setIsDragOver(false);
      if (onClearInitialImage) onClearInitialImage();
    } else if (initialImage) {
      setSelectedImage(initialImage);
      calculateImageMetadata(initialImage);
      setStage('prompt');
    }
  }, [isOpen, initialImage, onClearInitialImage]);

  // Compute image metadata (dimensions and byte size estimate)
  const calculateImageMetadata = (dataUrl: string) => {
    try {
      const img = new Image();
      img.onload = () => {
        const approxBytes = Math.round((dataUrl.length * 3) / 4);
        setImageMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeKb: Math.round(approxBytes / 1024),
        });
      };
      img.src = dataUrl;
    } catch {
      setImageMeta(null);
    }
  };

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle image reception via file, paste, or drop
  const receiveImageFile = useCallback((file: File) => {
    // Deduplicate rapid duplicate events (< 1200ms)
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 1200) {
      return;
    }
    lastProcessedTimeRef.current = now;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setErrorMessage('Unsupported file format. Please provide a PNG, JPEG, or WebP screenshot.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Screenshot exceeds maximum allowed size of 15MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      calculateImageMetadata(dataUrl);
      // Show contextual Adobe Acrobat style prompt: "Screenshot detected"
      setStage('prompt');
    };
    reader.onerror = () => {
      setErrorMessage('Could not read the screenshot file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  // Modal-level clipboard paste listener (Ctrl+V)
  const handleModalPasteEvent = useCallback((e: ClipboardEvent) => {
    if (!isOpen) return;

    // If focus is in a text input, let user paste text normally
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          receiveImageFile(file);
          break;
        }
      }
    }
  }, [isOpen, receiveImageFile]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('paste', handleModalPasteEvent);
    }
    return () => {
      window.removeEventListener('paste', handleModalPasteEvent);
    };
  }, [isOpen, handleModalPasteEvent]);

  // Evidence-based screenshot analysis execution
  const handleAnalyseScreenshot = async () => {
    if (!selectedImage) return;

    setErrorMessage(null);
    setLensNotice(null);
    setStage('analyzing');

    const base64Clean = selectedImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const customKey = sessionStorage.getItem('nebius_custom_api_key') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customKey) {
      headers['x-nebius-api-key'] = customKey;
    }

    try {
      const resp = await fetch('/api/search/recognize-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64Clean,
          mimeType: 'image/png',
          apiKey: customKey || undefined,
        }),
      });

      if (resp.ok) {
        const result: ImageRecognitionResult = await resp.json();
        
        // Strict evidence check:
        const hasEvidence = Boolean(result.success && result.detectedName && result.detectedName.trim() !== '');
        
        if (hasEvidence) {
          const title = (result.detectedName || '').trim();
          setIsConfident(true);
          setDetectedTitle(title);
          setDetectedCategory(inferProductCategory(title, result.brand, result.category));
          if (result.extractedPrice) {
            setDetectedPrice(String(result.extractedPrice));
          } else {
            setDetectedPrice('');
          }
          if (result.detectedRetailer) {
            setDetectedRetailer(result.detectedRetailer);
          } else {
            setDetectedRetailer('');
          }
          if (result.extractedText) {
            setExtractedOcrSnippet(result.extractedText.slice(0, 200));
          } else {
            setExtractedOcrSnippet('');
          }
        } else {
          // Visual identification inconclusive — DO NOT invent smartphones or accessories
          setIsConfident(false);
          setDetectedTitle('');
          setDetectedCategory('other');
          setDetectedPrice('');
          setDetectedRetailer('');
          if (result.extractedText) {
            setExtractedOcrSnippet(result.extractedText.slice(0, 200));
          } else {
            setExtractedOcrSnippet('');
          }
        }
      } else {
        // HTTP error or server unavailable
        setIsConfident(false);
        setDetectedTitle('');
        setDetectedCategory('other');
      }
    } catch {
      setIsConfident(false);
      setDetectedTitle('');
      setDetectedCategory('other');
    } finally {
      setStage('result');
    }
  };

  // Google Lens workflow integration
  const handleGoogleLens = async () => {
    if (!selectedImage) return;
    try {
      const res = await executeGoogleLensSearch(selectedImage);
      setLensNotice(res.message);
      setTimeout(() => setLensNotice(null), 8000);
    } catch {
      window.open('https://lens.google.com', '_blank', 'noopener,noreferrer');
    }
  };

  // Download screenshot file fallback
  const handleDownloadImage = () => {
    if (!selectedImage) return;
    try {
      const blob = dataUrlToBlob(selectedImage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veracost-screenshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Could not download image:', e);
    }
  };

  // Clipboard read API button (for mobile / explicit user click)
  const handleReadClipboard = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setErrorMessage('Direct clipboard read is not supported in this browser. Please press Ctrl + V (or Cmd + V) to paste.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard_screenshot.png', { type: imageType });
          receiveImageFile(file);
          return;
        }
      }
      setErrorMessage('No image was found on your clipboard. Take a screenshot (Win + Shift + S or Cmd + Shift + 4) and try again.');
    } catch {
      setErrorMessage('Clipboard permission was denied or unavailable. Simply press Ctrl + V anywhere on this page to paste.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      receiveImageFile(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!detectedTitle.trim()) return;
    const priceNum = detectedPrice ? parseFloat(detectedPrice) : undefined;
    onProductImported(detectedTitle.trim(), detectedCategory, priceNum);
    handleDismiss();
  };

  const handleDismiss = () => {
    setSelectedImage(null);
    setStage('empty');
    if (onClearInitialImage) onClearInitialImage();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleDismiss} role="dialog" aria-modal="true" aria-labelledby="screenshot-modal-title">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 620, borderRadius: 'var(--radius-xl)' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: stage === 'prompt' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                color: stage === 'prompt' ? 'var(--blue-highlight, #3b82f6)' : 'var(--teal-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scissors size={20} />
            </div>
            <div>
              <h3 id="screenshot-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {stage === 'prompt' ? 'Screenshot detected' : 'Screenshot & Image Import'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {stage === 'prompt' 
                  ? 'Would you like VeraCost to identify the product and compare its price?'
                  : 'Contextual image import via browser paste (Ctrl+V) or drag-and-drop'}
              </p>
            </div>
          </div>
          <button 
            className="close-btn" 
            onClick={handleDismiss} 
            aria-label="Close screenshot modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Browser Limitation Transparency Banner */}
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.4,
          }}
        >
          <Info size={15} style={{ color: 'var(--blue-highlight, #3b82f6)', flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Browser security notice:</strong> Web pages cannot detect OS-level screenshot shortcuts (e.g. Win+Shift+S or Snipping Tool) until you paste (<kbd style={{ padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>Ctrl+V</kbd>) or drop an image into the browser.
          </span>
        </div>

        {/* =========================================================================
            STAGE 1: Contextual Prompt (Adobe Acrobat Style)
            Appears only when an image has actually been received through a supported action
           ========================================================================= */}
        {stage === 'prompt' && selectedImage && (
          <div style={{ padding: '0.25rem 0' }}>
            {/* Screenshot Thumbnail Preview */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.85rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
              }}
            >
              <img
                src={selectedImage}
                alt="Captured Screenshot"
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--teal-bright)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Image Received & Ready
                  </span>
                </div>
                {imageMeta && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Resolution: {imageMeta.width} × {imageMeta.height} px • Est. Size: {imageMeta.sizeKb} KB
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Would you like VeraCost to inspect visible text, brand, model, and prices from this screenshot?
                </div>
              </div>
            </div>

            {/* Prompt Action Buttons: Analyse, Search with Google Lens, Cancel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnalyseScreenshot}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                >
                  <Search size={16} />
                  <span>Analyse screenshot</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleGoogleLens}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.88rem',
                  }}
                  title="Search this screenshot with Google Lens without re-uploading"
                >
                  <ExternalLink size={15} style={{ color: 'var(--blue-highlight, #3b82f6)' }} />
                  <span>Search with Google Lens</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDismiss}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  alignSelf: 'center',
                  background: 'transparent',
                  border: 'none',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 2: Analyzing Screenshot (Evidence Processing)
           ========================================================================= */}
        {stage === 'analyzing' && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <RefreshCw
              size={36}
              className="spin"
              style={{ color: 'var(--teal-bright)', margin: '0 auto 1rem', display: 'block' }}
            />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Analyzing screenshot evidence...
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
              Extracting visible product titles, brands, model numbers, retailers, and prices from the screenshot.
            </p>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: Analysis Results (Evidence-Based, No Fake Products)
           ========================================================================= */}
        {stage === 'result' && selectedImage && (
          <div style={{ padding: '0.25rem 0' }}>
            {/* Visual Thumbnail Preview */}
            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1rem',
              }}
            >
              <img
                src={selectedImage}
                alt="Imported Screenshot"
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {isConfident ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--teal-bright)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-bright)' }}>
                      Product Evidence Detected
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--amber-warning, #f59e0b)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber-warning, #f59e0b)' }}>
                      Could not confidently identify this product
                    </span>
                  </div>
                )}

                {detectedRetailer && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Visible Retailer: <strong>{detectedRetailer}</strong>
                  </div>
                )}
                {extractedOcrSnippet && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    OCR: "{extractedOcrSnippet}"
                  </div>
                )}
              </div>
            </div>

            {/* Inconclusive Warning Banner */}
            {!isConfident && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                VeraCost strictly avoids guessing or inventing smartphones, accessories, or prices when visible evidence is inconclusive. Please confirm or enter the product name manually below, or search with Google Lens.
              </div>
            )}

            {/* OCR Suggested Query Button (if snippet detected) */}
            {!isConfident && extractedOcrSnippet && (
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Visible text found in screenshot:
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDetectedTitle(extractedOcrSnippet.slice(0, 60))}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.76rem',
                    textAlign: 'left',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title="Use extracted OCR text as product title"
                >
                  <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Use text: "{extractedOcrSnippet.slice(0, 60)}..."
                </button>
              </div>
            )}

            {/* Product Name Input */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                  color: 'var(--text-main)',
                }}
              >
                {isConfident ? 'Product Identified in Screenshot:' : 'Confirm or Enter Product Name Manually:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sony WH-1000XM5, Dell XPS 15, Apple AirPods..."
                value={detectedTitle}
                onChange={(e) => setDetectedTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.88rem' }}
                autoFocus={!isConfident}
              />
            </div>

            {/* Price & Category Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    color: 'var(--text-main)',
                  }}
                >
                  Visible Price (Optional):
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 24990"
                  value={detectedPrice}
                  onChange={(e) => setDetectedPrice(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    color: 'var(--text-main)',
                  }}
                >
                  Product Category:
                </label>
                <select
                  className="form-input"
                  value={detectedCategory}
                  onChange={(e) => setDetectedCategory(e.target.value as ProductCategory)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={!detectedTitle.trim()}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                }}
              >
                <Search size={16} />
                <span>Search in VeraCost & Compare</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleGoogleLens}
                style={{
                  padding: '0.7rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                }}
                title="Search this screenshot with Google Lens"
              >
                <ExternalLink size={14} style={{ color: 'var(--blue-highlight, #3b82f6)' }} />
                <span>Google Lens</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedImage(null);
                  setStage('empty');
                  setDetectedTitle('');
                  setDetectedPrice('');
                  setDetectedRetailer('');
                }}
                style={{ padding: '0.7rem 0.85rem' }}
                title="Import or paste another screenshot"
                aria-label="Import another screenshot"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 4: Empty Initial Drop / Paste Zone (When opened manually)
           ========================================================================= */}
        {stage === 'empty' && (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragOver ? '2px dashed var(--teal-bright)' : '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragOver ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-card)',
                transition: 'all 0.2s',
                marginBottom: '1rem',
              }}
            >
              <Clipboard size={40} style={{ color: 'var(--teal-bright)', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Press <kbd style={{ padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', fontFamily: 'monospace' }}>Ctrl + V</kbd> to Paste Screenshot
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Or drag and drop your screenshot file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) receiveImageFile(f);
                }}
              />
            </div>

            {/* Direct Paste from Clipboard for mobile/tablets */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReadClipboard}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Clipboard size={14} /> Paste from Device Clipboard
              </button>
            </div>
          </div>
        )}

        {/* Global Google Lens Notice Feedback */}
        {lensNotice && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.7rem 0.9rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--blue-highlight, #3b82f6)', flexShrink: 0 }} />
              <span>{lensNotice}</span>
            </div>
            {selectedImage && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadImage}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Save image to disk"
              >
                <Download size={12} /> Save
              </button>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--amber-warning, #f59e0b)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
