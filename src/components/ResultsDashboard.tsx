import React from 'react';
import { 
  Trophy, 
  TrendingDown, 
  Calendar, 
  HelpCircle, 
  Layers, 
  Percent, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ComparisonAnalysisResult, ScenarioType } from '../types/cost';
import { BRAND_CONFIG } from '../config/branding';
import { CostTimelineChart } from './CostTimelineChart';

interface ResultsDashboardProps {
  analysis: ComparisonAnalysisResult;
  scenario: ScenarioType;
  setScenario: (sc: ScenarioType) => void;
  horizonYears: number;
  setHorizonYears: (y: number) => void;
  discountRatePct: number;
  setDiscountRatePct: (rate: number) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  scenario,
  setScenario,
  horizonYears,
  setHorizonYears,
  discountRatePct,
  setDiscountRatePct,
}) => {
  const lowestOption = analysis.results[analysis.lowestCostOptionId];
  const highestOption = analysis.results[analysis.highestCostOptionId];
  const optionIds = Object.keys(analysis.results);

  if (!lowestOption || !highestOption) return null;

  return (
    <div className="results-dashboard">
      {/* Simulation Controls: Horizon & Scenario Switcher */}
      <div className="control-bar">
        {/* Horizon selector */}
        <div className="control-group">
          <span className="control-label">Evaluation Horizon:</span>
          <div className="pill-group">
            {BRAND_CONFIG.supportedHorizons.map((h) => (
              <button
                key={h.years}
                className={`pill-btn ${horizonYears === h.years ? 'active' : ''}`}
                onClick={() => setHorizonYears(h.years)}
              >
                {h.years} {h.years === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario simulation selector */}
        <div className="control-group">
          <span className="control-label">Scenario Model:</span>
          <div className="pill-group">
            {BRAND_CONFIG.scenarios.map((sc) => (
              <button
                key={sc.id}
                className={`pill-btn ${scenario === sc.id ? 'active' : ''}`}
                onClick={() => setScenario(sc.id as ScenarioType)}
                title={sc.description}
              >
                {sc.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Discount Rate (NPV) input */}
        <div className="control-group">
          <span className="control-label" title="Annual discount rate for Net Present Value calculations">
            Discount Rate (NPV):
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              style={{
                width: '60px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.3rem 0.5rem',
                fontSize: '0.85rem',
                color: '#fff',
                textAlign: 'center',
              }}
              value={discountRatePct}
              onChange={(e) => setDiscountRatePct(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>% / yr</span>
          </div>
        </div>
      </div>

      {/* Champion TCO Banner */}
      <div className="champion-banner">
        <div className="champion-info">
          <div className="champion-trophy">
            <Trophy size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--teal-bright)', fontWeight: 700, textTransform: 'uppercase' }}>
              Lowest Total Cost of Ownership Leader
            </div>
            <div className="champion-heading">
              {lowestOption.optionName}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Total projected {horizonYears}-year ownership cost is{' '}
              <strong style={{ color: '#ffffff' }}>
                {analysis.currency} {lowestOption.netTotalCost.toLocaleString()}
              </strong>{' '}
              ({analysis.currency} {lowestOption.monthlyEquivalentCost.toLocaleString()} / month).
            </div>
          </div>
        </div>

        {analysis.netSavings > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Estimated Lifecycle Advantage
            </div>
            <div className="savings-highlight">
              Save {analysis.currency} {analysis.netSavings.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--emerald-success)', fontWeight: 600 }}>
              ↓ {analysis.percentageSavings}% cheaper than {highestOption.optionName}
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-header">
            <span>Lowest Net TCO</span>
            <Trophy size={16} style={{ color: 'var(--teal-bright)' }} />
          </div>
          <div className="metric-value">
            {analysis.currency} {lowestOption.netTotalCost.toLocaleString()}
          </div>
          <div className="metric-sub">
            Over {horizonYears} years ({horizonYears * 12} months)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Monthly Equivalent</span>
            <Calendar size={16} style={{ color: 'var(--cyan-bright)' }} />
          </div>
          <div className="metric-value">
            {analysis.currency} {lowestOption.monthlyEquivalentCost.toLocaleString()}
          </div>
          <div className="metric-sub">
            True normalized cost per month
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Initial vs Ongoing Ratio</span>
            <Percent size={16} style={{ color: 'var(--indigo-accent)' }} />
          </div>
          <div className="metric-value">
            {lowestOption.grossTotalCost > 0
              ? `${Math.round((lowestOption.initialAcquisitionTotal / lowestOption.grossTotalCost) * 100)}% / ${Math.round(
                  ((lowestOption.grossTotalCost - lowestOption.initialAcquisitionTotal) / lowestOption.grossTotalCost) * 100
                )}%`
              : '0% / 0%'}
          </div>
          <div className="metric-sub">
            Upfront purchase vs. lifecycle expenses
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Residual Recovery</span>
            <TrendingDown size={16} style={{ color: 'var(--amber-warning)' }} />
          </div>
          <div className="metric-value">
            {analysis.currency} {lowestOption.residualRecoveryTotal.toLocaleString()}
          </div>
          <div className="metric-sub">
            Recovered equity at end of horizon
          </div>
        </div>
      </div>

      {/* Interactive Time Series Chart */}
      <CostTimelineChart analysis={analysis} />

      {/* Comprehensive Disaggregated Comparison Matrix */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          backdropFilter: 'var(--glass-blur)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Layers size={18} style={{ color: 'var(--teal-bright)' }} />
          <h3 style={{ fontSize: '1.2rem' }}>Disaggregated Cost Breakdown Matrix</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
              <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                Cost Component
              </th>
              {optionIds.map((id) => (
                <th
                  key={id}
                  style={{
                    padding: '0.75rem 1rem',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                >
                  {analysis.results[id].optionName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Initial Purchase & Taxes
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                  {analysis.currency} {analysis.results[id].initialAcquisitionTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Setup & Accessories
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem' }}>
                  {analysis.currency} {analysis.results[id].setupAccessoriesTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Recurring Subscriptions ({horizonYears} Years)
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem' }}>
                  {analysis.currency} {analysis.results[id].recurringTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Maintenance & Repairs
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem' }}>
                  {analysis.currency} {analysis.results[id].maintenanceTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Operating Energy & Consumables
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem' }}>
                  {analysis.currency} {analysis.results[id].operatingTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Equipment Replacement Cycles
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem' }}>
                  {analysis.currency} {analysis.results[id].replacementTotal.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({analysis.results[id].replacementsOccurred} replacements)
                  </span>
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Residual Resale Recovery
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem', color: 'var(--emerald-success)' }}>
                  − {analysis.currency} {analysis.results[id].residualRecoveryTotal.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Net Total Row */}
            <tr style={{ borderTop: '2px solid var(--border-medium)', background: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>
                Net Total Cost of Ownership (TCO)
              </td>
              {optionIds.map((id) => {
                const isWin = id === analysis.lowestCostOptionId;
                return (
                  <td
                    key={id}
                    style={{
                      padding: '0.9rem 1rem',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      color: isWin ? 'var(--teal-bright)' : 'var(--text-main)',
                    }}
                  >
                    {analysis.currency} {analysis.results[id].netTotalCost.toLocaleString()}
                    {isWin && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.7rem',
                          background: 'rgba(20, 184, 166, 0.2)',
                          color: 'var(--teal-bright)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        LEADER
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Monthly Equivalent Row */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Monthly Equivalent Cost (MEC)
              </td>
              {optionIds.map((id) => (
                <td key={id} style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                  {analysis.currency} {analysis.results[id].monthlyEquivalentCost.toLocaleString()} / mo
                </td>
              ))}
            </tr>

            {/* Present Value (NPV) Row */}
            {discountRatePct > 0 && (
              <tr>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Net Present Value (NPV @ {discountRatePct}%)
                </td>
                {optionIds.map((id) => (
                  <td key={id} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--indigo-accent)' }}>
                    {analysis.currency} {analysis.results[id].presentValueNetTotal.toLocaleString()}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Key Cost Drivers Section */}
      {analysis.keyDrivers.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            backdropFilter: 'var(--glass-blur)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingDown size={18} style={{ color: 'var(--teal-bright)' }} />
            <h3 style={{ fontSize: '1.2rem' }}>Primary Decision Differentiators</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {analysis.keyDrivers.map((driver, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {driver.title}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--teal-bright)',
                      background: 'rgba(20, 184, 166, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    Δ {analysis.currency} {driver.impactAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {driver.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
