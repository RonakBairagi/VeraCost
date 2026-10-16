import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, Sparkles, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { ImageRecognitionResult } from '../../types/shopping';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRecognized: (confirmedName: string, brand?: string, model?: string) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onProductRecognized,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<ImageRecognitionResult | null>(null);
  const [confirmedName, setConfirmedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file exceeds the 5MB size limit.');
      return;
    }

    setError(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setRecognitionResult(null);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Full: string, type: string) => {
    setIsProcessing(true);
    setError(null);

    const base64Clean = base64Full.replace(/^data:image\/[a-z]+;base64,/, '');

    try {
      const resp = await fetch('/api/search/recognize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Clean, mimeType: type }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const result: ImageRecognitionResult = await resp.json();
      setRecognitionResult(result);
      setConfirmedName(result.detectedName || '');
    } catch (err: any) {
      setError(`Image recognition failed: ${err.message || 'Network error'}. You can type the product name manually.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSearch = () => {
    if (!confirmedName.trim()) return;
    onProductRecognized(confirmedName.trim(), recognitionResult?.brand, recognitionResult?.model);
    onClose();
  };

  const handleReset = () => {
    setSelectedImage(null);
    setRecognitionResult(null);
    setConfirmedName('');
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--indigo-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Visual Product Discovery</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Upload or take a photo of a device or packaging
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close image search">
            <X size={20} />
          </button>
        </div>

        {/* Upload Drop Zone / Camera Action */}
        {!selectedImage ? (
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
              <Upload size={36} style={{ color: 'var(--indigo-accent)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Click to browse product photograph
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Supports JPEG, PNG, or WebP up to 5MB
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => cameraInputRef.current?.click()}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Camera size={16} />
                Snap Photo with Camera
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div>
            {/* Image Preview & Processing State */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img
                src={selectedImage}
                alt="Product Preview"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Captured Image Loaded
                </div>
                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--teal-bright)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <RefreshCw size={14} className="spin" />
                    Multimodal AI is identifying product features...
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Analysis complete. Verify details below.
                  </div>
                )}
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={handleReset}
                title="Choose different image"
                style={{ color: 'var(--text-muted)' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Recognition Results & Confirmation */}
            {recognitionResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recognitionResult.confidence && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.85rem',
                      background: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--teal-bright)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} />
                      Match Confidence: {recognitionResult.confidence}%
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Category: {recognitionResult.category || 'General'}
                    </span>
                  </div>
                )}

                {recognitionResult.message && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--amber-warning)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={14} />
                    {recognitionResult.message}
                  </div>
                )}

                {/* Edit / Confirm Name Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Confirm Detected Product Name & Model
                  </label>
                  <input
                    type="text"
                    className="input-box"
                    value={confirmedName}
                    onChange={(e) => setConfirmedName(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 or iPhone 16 Pro"
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    You can edit the model name above before initiating multi-retailer search to ensure an exact match.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={handleReset}>
                    Upload Another
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!confirmedName.trim()}
                    onClick={handleConfirmAndSearch}
                  >
                    <Check size={16} />
                    Confirm & Search Retailers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose-danger)', fontSize: '0.82rem', marginTop: '1rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
