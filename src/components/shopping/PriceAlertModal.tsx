import React, { useState } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';
import { PriceAlert } from '../../types/shopping';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentLowest: number;
  currency: string;
  retailer: string;
  onAlertCreated: (alert: PriceAlert) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentLowest,
  currency,
  retailer,
  onAlertCreated,
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(Math.round(currentLowest * 0.9));
  const [email, setEmail] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      productId,
      productName,
      currentLowest,
      targetPrice,
      currency,
      retailer,
      email: email.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    onAlertCreated(newAlert);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Set Price Drop Alert</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Track this item in your personal Watchlist
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close price alert">
            <X size={20} />
          </button>
        </div>

        {/* Product Summary */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {productName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Current Best Price: <strong style={{ color: 'var(--teal-bright)' }}>₹{currentLowest.toLocaleString('en-IN')}</strong> on {retailer}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Target Alert Price (₹)
            </label>
            <input
              type="number"
              className="input-box"
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              min={1}
              required
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Suggested: ₹{Math.round(currentLowest * 0.9).toLocaleString('en-IN')} (10% discount from current best)
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Notification Email (Optional)
            </label>
            <input
              type="email"
              className="input-box"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Honest Service Transparency Notice */}
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <Info size={16} style={{ color: 'var(--amber-warning)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Watchlist Transparency:</strong> This alert is saved in your local browser Watchlist. Automatic background email dispatch requires an authenticated backend notification service (such as Resend or SendGrid) configured in your environment.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaved}>
              {isSaved ? (
                <>
                  <Check size={16} />
                  Alert Saved to Watchlist!
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Add to Price Watchlist
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
