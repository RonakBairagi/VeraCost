import React from 'react';
import { X, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { PriceHistoryPoint } from '../../types/shopping';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  history: PriceHistoryPoint[];
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  productName,
  history,
}) => {
  if (!isOpen) return null;

  const hasData = history && history.length > 0;

  // Chart dimensions
  const svgWidth = 520;
  const svgHeight = 220;
  const padding = { top: 30, right: 30, bottom: 40, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  let minPrice = hasData ? Math.min(...history.map((h) => h.price)) : 0;
  let maxPrice = hasData ? Math.max(...history.map((h) => h.price)) : 0;

  // Headroom
  minPrice = Math.max(0, minPrice * 0.95);
  maxPrice = maxPrice * 1.05;

  const getX = (idx: number) => {
    if (history.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (history.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (maxPrice === minPrice) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((val - minPrice) / (maxPrice - minPrice)) * chartHeight;
  };

  const pointsString = hasData
    ? history.map((h, i) => `${getX(i)},${getY(h.price)}`).join(' ')
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
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
              <TrendingDown size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Verified Price History</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {productName}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close price history">
            <X size={20} />
          </button>
        </div>

        {hasData ? (
          <div>
            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOWEST OBSERVED</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-success)' }}>
                  ₹{Math.min(...history.map((h) => h.price)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HIGHEST OBSERVED</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose-danger)' }}>
                  ₹{Math.max(...history.map((h) => h.price)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OBSERVATION POINTS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan-bright)' }}>
                  {history.length} Verified Checks
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem',
              }}
            >
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Y Axis Guide Lines */}
                {[0, 0.5, 1].map((pct) => {
                  const val = minPrice + pct * (maxPrice - minPrice);
                  const y = getY(val);
                  return (
                    <g key={pct}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="var(--border-subtle)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        fill="var(--text-muted)"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        ₹{Math.round(val).toLocaleString('en-IN')}
                      </text>
                    </g>
                  );
                })}

                {/* Trend line */}
                <polyline
                  fill="none"
                  stroke="var(--teal-bright)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />

                {/* Data dots */}
                {history.map((h, i) => (
                  <g key={i}>
                    <circle
                      cx={getX(i)}
                      cy={getY(h.price)}
                      r={4.5}
                      fill="var(--bg-surface)"
                      stroke="var(--teal-bright)"
                      strokeWidth={2}
                    />
                    <text
                      x={getX(i)}
                      y={svgHeight - 12}
                      fill="var(--text-muted)"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {h.date.slice(5)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Timeline Observation List */}
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={13} />
                    {h.date} • {h.retailerName}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    ₹{h.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <AlertCircle size={36} style={{ color: 'var(--amber-warning)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No Prior Price Tracking History Yet
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
              VeraCost does not manufacture simulated historical prices. Tracking observations begin once this product is monitored across our verified retailer gateways.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
