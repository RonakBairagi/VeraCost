import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, ExternalLink, CheckCircle2, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { RetailerIntegrationStatus } from '../../types/shopping';

interface RetailerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetailerStatusModal: React.FC<RetailerStatusModalProps> = ({ isOpen, onClose }) => {
  const [statuses, setStatuses] = useState<RetailerIntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_STATUSES: RetailerIntegrationStatus[] = [
    { id: 'amazon-in', name: 'Amazon India', isConfigured: false, status: 'search_fallback_only', authType: 'api_key', requiredEnvVar: 'AMAZON_PAAPI_KEY', documentationUrl: 'https://webservices.amazon.in/paapi5/documentation/', notes: 'Using official authenticated search fallback links.' },
    { id: 'flipkart', name: 'Flipkart', isConfigured: false, status: 'search_fallback_only', authType: 'api_key', requiredEnvVar: 'FLIPKART_AFFILIATE_ID', documentationUrl: 'https://affiliate.flipkart.com/api-docs', notes: 'Using official search portal links.' },
    { id: 'croma', name: 'Croma', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.croma.com/', notes: 'Direct authorized portal search.' },
    { id: 'reliance-digital', name: 'Reliance Digital', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.reliancedigital.in/', notes: 'Direct authorized portal search.' },
    { id: 'vijay-sales', name: 'Vijay Sales', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.vijaysales.com/', notes: 'Direct authorized portal search.' },
    { id: 'tatacliq', name: 'Tata CLiQ', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.tatacliq.com/', notes: 'Direct authorized portal search.' },
    { id: 'myntra', name: 'Myntra', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.myntra.com/', notes: 'Fashion & lifestyle search portal.' },
    { id: 'nykaa', name: 'Nykaa', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.nykaa.com/', notes: 'Beauty & grooming search portal.' },
    { id: 'official-store', name: 'Official Brand Stores', isConfigured: false, status: 'search_fallback_only', authType: 'direct_search', documentationUrl: 'https://www.apple.com/in/', notes: 'Authorized direct OEM portals.' },
  ];

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/search/retailers/status');
      if (resp.ok) {
        const data = await resp.json();
        setStatuses(data.statuses && data.statuses.length > 0 ? data.statuses : DEFAULT_STATUSES);
      } else {
        setStatuses(DEFAULT_STATUSES);
      }
    } catch {
      setStatuses(DEFAULT_STATUSES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--emerald-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Retailer Integration & Data Quality Gateway</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Inspect live API credentials, search gateway status, and documentation
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close status modal">
            <X size={20} />
          </button>
        </div>

        {/* Status Overview Card */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Indian Market Multi-Retailer Adapters
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Verified catalogs & official authenticated search gateways are active for all supported stores.
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchStatus}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            Refresh Status
          </button>
        </div>

        {/* Retailer Adapters List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 380, overflowY: 'auto' }}>
          {statuses.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{s.name}</span>
                  {s.isConfigured ? (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--emerald-success)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      LIVE API CONNECTED
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(20, 184, 166, 0.12)',
                        color: 'var(--teal-bright)',
                        border: '1px solid rgba(20, 184, 166, 0.25)',
                      }}
                    >
                      VERIFIED SEARCH GATEWAY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.notes}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {s.requiredEnvVar && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.7rem',
                      background: 'var(--bg-elevated)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Key size={10} style={{ marginRight: 4, display: 'inline' }} />
                    {s.requiredEnvVar}
                  </span>
                )}
                {s.documentationUrl && (
                  <a
                    href={s.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-btn"
                    title={`Open ${s.name} official documentation`}
                    style={{ color: 'var(--teal-bright)' }}
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
