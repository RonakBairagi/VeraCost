import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ComparisonAnalysisResult, ComparisonOption } from '../types/cost';

interface CostAuditPanelProps {
  analysis: ComparisonAnalysisResult;
  options: ComparisonOption[];
}

export const CostAuditPanel: React.FC<CostAuditPanelProps> = ({ analysis, options }) => {
  const optionIds = Object.keys(analysis.results);

  // Collect external sources across all options
  const externalSources: {
    optionName: string;
    itemName: string;
    sourceName?: string;
    url?: string;
    isVerified?: boolean;
  }[] = [];

  options.forEach((opt) => {
    if (opt.purchaseSource?.sourceName) {
      externalSources.push({
        optionName: opt.name,
        itemName: 'Initial Acquisition Price',
        sourceName: opt.purchaseSource.sourceName,
        url: opt.purchaseSource.url,
        isVerified: opt.purchaseSource.isVerified,
      });
    }
    if (opt.residualSource?.sourceName) {
      externalSources.push({
        optionName: opt.name,
        itemName: 'Residual Resale Estimate',
        sourceName: opt.residualSource.sourceName,
        url: opt.residualSource.url,
        isVerified: opt.residualSource.isVerified,
      });
    }
  });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        backdropFilter: 'var(--glass-blur)',
        marginBottom: '2.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <ShieldCheck size={22} style={{ color: 'var(--teal-bright)' }} />
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>Data Confidence & Evidence Audit Panel</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Transparently distinguishes verified facts from hypothetical estimates and rules-based suggestions.
          </p>
        </div>
      </div>

      {/* Confidence Breakdown Bars for each option */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {optionIds.map((id) => {
          const res = analysis.results[id];
          const cb = res.confidenceBreakdown;
          const totalTracked =
            cb.confirmedTotal + cb.userEstimateTotal + cb.externalSourceTotal + cb.suggestedUnverifiedTotal;

          const pctConfirmed = totalTracked > 0 ? (cb.confirmedTotal / totalTracked) * 100 : 0;
          const pctExternal = totalTracked > 0 ? (cb.externalSourceTotal / totalTracked) * 100 : 0;
          const pctEstimate = totalTracked > 0 ? (cb.userEstimateTotal / totalTracked) * 100 : 0;
          const pctSuggested = totalTracked > 0 ? (cb.suggestedUnverifiedTotal / totalTracked) * 100 : 0;

          return (
            <div
              key={id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {res.optionName}
                </span>
                {cb.missingCount > 0 ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--rose-danger)',
                      background: 'rgba(244, 63, 94, 0.15)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <AlertTriangle size={12} /> {cb.missingCount} Missing Items
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--emerald-success)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCircle2 size={12} /> All Costs Estimated
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: '10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ width: `${pctConfirmed}%`, backgroundColor: '#10b981' }} title={`Confirmed: ${pctConfirmed.toFixed(0)}%`} />
                <div style={{ width: `${pctExternal}%`, backgroundColor: '#6366f1' }} title={`External Citations: ${pctExternal.toFixed(0)}%`} />
                <div style={{ width: `${pctEstimate}%`, backgroundColor: '#38bdf8' }} title={`User Estimates: ${pctEstimate.toFixed(0)}%`} />
                <div style={{ width: `${pctSuggested}%`, backgroundColor: '#f59e0b' }} title={`Suggested Unverified: ${pctSuggested.toFixed(0)}%`} />
              </div>

              {/* Legend stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Confirmed:</span>
                  <strong style={{ color: '#fff' }}>{analysis.currency} {cb.confirmedTotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Benchmarks:</span>
                  <strong style={{ color: '#fff' }}>{analysis.currency} {cb.externalSourceTotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>User Estimates:</span>
                  <strong style={{ color: '#fff' }}>{analysis.currency} {cb.userEstimateTotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Suggested:</span>
                  <strong style={{ color: '#fff' }}>{analysis.currency} {cb.suggestedUnverifiedTotal.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* External Verified Sources List */}
      {externalSources.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileText size={16} style={{ color: 'var(--indigo-accent)' }} />
            Cited Benchmark References
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {externalSources.map((src, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{src.optionName}:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{src.itemName}</span> —{' '}
                  <span style={{ color: 'var(--indigo-accent)', fontWeight: 500 }}>{src.sourceName}</span>
                </div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                  >
                    View Source <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Disclaimer */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.85rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        <strong>Decision Support Audit Notice:</strong> This audit panel separates observed price facts from hypothetical projections. 
        Before making irreversible capital or procurement decisions, verify unverified assumptions and check local tax/utility tariffs.
      </div>
    </div>
  );
};
