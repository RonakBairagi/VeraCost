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
  Info
} from 'lucide-react';
import { ImageRecognitionResult } from '../../types/shopping';
import { ProductCategory } from '../../types/cost';
import { CATEGORY_OPTIONS } from './ImageSearchModal';
import { inferProductCategory } from '../../engine/discovery';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductImported: (productName: string, category: ProductCategory, initialPriceEstimate?: number) => void;
}

export const ScreenshotImportModal: React.FC<ScreenshotImportModalProps> = ({
  isOpen,
  onClose,
  onProductImported,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted Details
  const [detectedTitle, setDetectedTitle] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<ProductCategory>('smartphones');
  const [detectedPrice, setDetectedPrice] = useState<string>('');
  const [detectedRetailer, setDetectedRetailer] = useState<string>('');
  const [extractedOcrSnippet, setExtractedOcrSnippet] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setIsProcessing(false);
      setErrorMessage(null);
      setDetectedTitle('');
      setDetectedPrice('');
      setDetectedRetailer('');
      setExtractedOcrSnippet('');
      setIsDragOver(false);
    }
  }, [isOpen]);

  // Global & modal clipboard paste listener (Ctrl+V)
  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    if (!isOpen) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processScreenshotFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('paste', handlePasteEvent);
    }
    return () => {
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, [isOpen, handlePasteEvent]);

  // Process file (from drop, upload, or paste)
  const processScreenshotFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please provide a PNG, JPEG, or WebP screenshot.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Screenshot exceeds maximum allowed size of 15MB.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);

      // Clean base64
      const base64Clean = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
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
            mimeType: file.type,
            apiKey: customKey || undefined,
          }),
        });

        if (resp.ok) {
          const result: ImageRecognitionResult = await resp.json();
          const title = result.detectedName || '';
          setDetectedTitle(title);
          setDetectedCategory(inferProductCategory(title, result.brand, result.category));
          if (result.extractedPrice) {
            setDetectedPrice(String(result.extractedPrice));
          }
          if (result.detectedRetailer) {
            setDetectedRetailer(result.detectedRetailer);
          }
          if (result.extractedText) {
            setExtractedOcrSnippet(result.extractedText.slice(0, 160));
          }
        } else {
          // Heuristic fallback
          setDetectedTitle('Imported Product Screenshot');
          setDetectedCategory('smartphones');
        }
      } catch (err: any) {
        setDetectedTitle('Imported Product Screenshot');
        setDetectedCategory('smartphones');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clipboard read API button
  const handleReadClipboard = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setErrorMessage('Clipboard direct read not supported in this browser. Please use Ctrl + V (or Cmd + V) to paste.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard_screenshot.png', { type: imageType });
          processScreenshotFile(file);
          return;
        }
      }
      setErrorMessage('No image found in clipboard. Take a screenshot (Win + Shift + S or Cmd + Shift + 4) and try again.');
    } catch (err: any) {
      setErrorMessage('Clipboard access was blocked. Simply press Ctrl + V on your keyboard to paste the screenshot.');
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
      processScreenshotFile(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!detectedTitle.trim()) return;
    const priceNum = detectedPrice ? parseFloat(detectedPrice) : undefined;
    onProductImported(detectedTitle.trim(), detectedCategory, priceNum);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
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
              <Scissors size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Screenshot & Image Import</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Import product screenshots via clipboard paste (Ctrl+V), drag-and-drop, or file upload
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close screenshot modal">
            <X size={20} />
          </button>
        </div>

        {/* Technical Transparency Note */}
        <div
          style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Info size={16} style={{ color: 'var(--blue-highlight, #3b82f6)', flexShrink: 0 }} />
          <span>
            Standard browser security prevents websites from spying on OS screenshot shortcuts. Simply paste (Ctrl+V) or drop your screenshot here.
          </span>
        </div>

        {/* State A: Processing State */}
        {isProcessing && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <RefreshCw
              size={36}
              className="spin"
              style={{ color: 'var(--teal-bright)', margin: '0 auto 1rem', display: 'block' }}
            />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Analyzing Screenshot...
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Detecting product title, model number, retailer layout, and visible prices...
            </p>
          </div>
        )}

        {/* State B: Screenshot Imported & Details Extracted */}
        {!isProcessing && selectedImage && (
          <div style={{ padding: '0.25rem 0' }}>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
              }}
            >
              <img
                src={selectedImage}
                alt="Imported Screenshot"
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--teal-bright)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Screenshot Imported
                  </span>
                </div>
                {detectedRetailer && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Retailer Source: <strong>{detectedRetailer}</strong>
                  </div>
                )}
                {extractedOcrSnippet && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    OCR Snippet: "{extractedOcrSnippet}..."
                  </div>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.45rem',
                  color: 'var(--text-main)',
                }}
              >
                Product Detected in Screenshot:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Product name or model..."
                value={detectedTitle}
                onChange={(e) => setDetectedTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '0.45rem',
                    color: 'var(--text-main)',
                  }}
                >
                  Detected Price (Optional):
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 79900"
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
                    marginBottom: '0.45rem',
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={!detectedTitle.trim()}
                style={{ flex: 1, padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Search size={16} />
                <span>Search in VeraCost & Compare</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedImage(null);
                  setDetectedTitle('');
                  setDetectedPrice('');
                  setDetectedRetailer('');
                }}
                style={{ padding: '0.7rem 1rem' }}
                title="Paste or import another screenshot"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        )}

        {/* State C: Initial Drop / Paste Zone */}
        {!isProcessing && !selectedImage && (
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
              <Clipboard size={38} style={{ color: 'var(--teal-bright)', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Press <kbd style={{ padding: '0.2rem 0.5rem', borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', fontFamily: 'monospace' }}>Ctrl + V</kbd> to Paste Screenshot
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Or drag and drop your screenshot file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processScreenshotFile(f);
                }}
              />
            </div>

            {/* Direct Paste Button for Mobile/Touch */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReadClipboard}
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Clipboard size={14} /> Paste from Device Clipboard
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--amber-warning)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
