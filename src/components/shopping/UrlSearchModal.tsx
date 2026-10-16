import React, { useState } from 'react';
import { Link2, X, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UrlSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlParsed: (extractedQuery: string) => void;
}

export const UrlSearchModal: React.FC<UrlSearchModalProps> = ({
  isOpen,
  onClose,
  onUrlParsed,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/search/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to parse retailer URL');
      }

      if (data.extractedQuery) {
        onUrlParsed(data.extractedQuery);
        onClose();
      } else {
        throw new Error('Could not extract product details from this URL.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid retailer product URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(2, 132, 199, 0.15)',
                color: 'var(--cyan-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Link2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Paste Retailer Product URL</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Compare live prices for an existing listing across Indian retailers
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close URL search">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Direct Retailer Listing URL
            </label>
            <input
              type="url"
              className="input-box"
              placeholder="e.g. https://www.amazon.in/dp/B0DGJDBK6M or https://www.croma.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <strong>Supported Retailers:</strong> Amazon India, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata CLiQ, Myntra, Nykaa, and Official Brand Stores (Apple/Samsung).
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose-danger)', fontSize: '0.82rem' }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !url.trim()}>
              <Search size={15} />
              {isLoading ? 'Extracting...' : 'Compare Offers Across Retailers'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
