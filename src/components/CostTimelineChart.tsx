import React, { useState } from 'react';
import { ComparisonAnalysisResult } from '../types/cost';

interface CostTimelineChartProps {
  analysis: ComparisonAnalysisResult;
}

const OPTION_COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#38bdf8'];

export const CostTimelineChart: React.FC<CostTimelineChartProps> = ({ analysis }) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const horizonMonths = Math.max(1, Math.round(analysis.horizonYears * 12));
  const optionIds = Object.keys(analysis.results);

  if (optionIds.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No data to chart</div>;
  }

  // Find max cumulative cost across all options to scale Y axis
  let maxCost = 0;
  optionIds.forEach((id) => {
    const res = analysis.results[id];
    res.timeline.forEach((pt) => {
      if (pt.cumulativeCost > maxCost) maxCost = pt.cumulativeCost;
    });
  });

  // Add 10% headroom
  maxCost = maxCost > 0 ? maxCost * 1.12 : 1000;

  // Chart Dimensions
  const svgWidth = 850;
  const svgHeight = 340;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Coordinate conversion helpers
  const getX = (month: number) => paddingLeft + (month / horizonMonths) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - (val / maxCost) * chartHeight;

  // Generate Y axis tick marks (5 steps)
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((frac) => Math.round(maxCost * frac));

  // Generate X axis tick months (e.g. Month 0, 12, 24, 36...)
  const xStepMonths = horizonMonths <= 12 ? 3 : horizonMonths <= 36 ? 6 : 12;
  const xTicks: number[] = [];
  for (let m = 0; m <= horizonMonths; m += xStepMonths) {
    xTicks.push(m);
  }
  if (!xTicks.includes(horizonMonths)) {
    xTicks.push(horizonMonths);
  }

  // Active hover data point
  const hoverPoint = hoveredMonth !== null ? analysis.monthlyCashflows[hoveredMonth] : null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Cumulative Ownership Cost Trajectory</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Month-by-month cash outflows across {analysis.horizonYears} years ({horizonMonths} months). Step jumps indicate hardware replacements.
          </p>
        </div>

        {/* Legend */}
        <div className="chart-legend">
          {optionIds.map((id, idx) => {
            const opt = analysis.results[id];
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div key={id} className="legend-item">
                <span className="legend-line" style={{ backgroundColor: color }} />
                <span style={{ color: 'var(--text-main)' }}>{opt.optionName}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="svg-chart"
          onMouseLeave={() => setHoveredMonth(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normalizedX = (mouseX / rect.width) * svgWidth;
            if (normalizedX >= paddingLeft && normalizedX <= svgWidth - paddingRight) {
              const monthFrac = ((normalizedX - paddingLeft) / chartWidth) * horizonMonths;
              const nearestMonth = Math.min(horizonMonths, Math.max(0, Math.round(monthFrac)));
              setHoveredMonth(nearestMonth);
            }
          }}
        >
          {/* Horizontal Grid lines and Y labels */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className="chart-grid-line"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-axis-text"
                >
                  {analysis.currency} {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines and X labels */}
          {xTicks.map((m, idx) => {
            const x = getX(m);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  className="chart-grid-line"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  className="chart-axis-text"
                >
                  {m === 0 ? 'M0' : `M${m} (${(m / 12).toFixed(1)}y)`}
                </text>
              </g>
            );
          })}

          {/* Render Curve Paths for each option */}
          {optionIds.map((id, idx) => {
            const opt = analysis.results[id];
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];
            const timeline = opt.timeline;

            if (timeline.length === 0) return null;

            // Build SVG path d attribute
            let pathD = `M ${getX(timeline[0].month)} ${getY(timeline[0].cumulativeCost)}`;
            for (let i = 1; i < timeline.length; i++) {
              pathD += ` L ${getX(timeline[i].month)} ${getY(timeline[i].cumulativeCost)}`;
            }

            return (
              <g key={id}>
                {/* Glow layer */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeOpacity="0.15"
                />
                {/* Main line */}
                <path
                  d={pathD}
                  className="chart-path"
                  stroke={color}
                />
                {/* Replacement milestone dots */}
                {opt.replacementsOccurred > 0 &&
                  timeline
                    .filter((pt) => pt.month > 0 && pt.month < horizonMonths && pt.periodicExpense > (opt.netTotalCost / horizonMonths) * 2)
                    .map((pt, pIdx) => (
                      <circle
                        key={pIdx}
                        cx={getX(pt.month)}
                        cy={getY(pt.cumulativeCost)}
                        r="5.5"
                        fill={color}
                        className="chart-milestone-dot"
                      />
                    ))}
              </g>
            );
          })}

          {/* Active Hover Crosshair Line */}
          {hoveredMonth !== null && (
            <g>
              <line
                x1={getX(hoveredMonth)}
                y1={paddingTop}
                x2={getX(hoveredMonth)}
                y2={paddingTop + chartHeight}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              {optionIds.map((id, idx) => {
                const opt = analysis.results[id];
                const pt = opt.timeline.find((t) => t.month === hoveredMonth);
                if (!pt) return null;
                const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                return (
                  <circle
                    key={id}
                    cx={getX(hoveredMonth)}
                    cy={getY(pt.cumulativeCost)}
                    r="6"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredMonth !== null && hoverPoint && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '20px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              minWidth: '220px',
              backdropFilter: 'var(--glass-blur)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {hoverPoint.dateLabel}
            </div>
            {optionIds.map((id, idx) => {
              const opt = analysis.results[id];
              const pt = opt.timeline.find((t) => t.month === hoveredMonth);
              const color = OPTION_COLORS[idx % OPTION_COLORS.length];
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span style={{ color, fontWeight: 600 }}>{opt.optionName}:</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                    {analysis.currency} {pt?.cumulativeCost.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
