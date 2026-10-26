import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  SlidersHorizontal, 
  ShoppingBag, 
  Bookmark, 
  TrendingDown, 
  Sparkles, 
  ArrowRight, 
  PlusCircle, 
  Settings, 
  Bell, 
  ShieldCheck, 
  Clock, 
  Bot,
  ExternalLink,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { ComparisonProject, ComparisonOption, ComparisonAnalysisResult } from '../../types/cost';
import { UserProfileData } from '../../config/firebase';
import { SAMPLE_COMPARISONS } from '../../data/sampleComparisons';
import { calculateComparison } from '../../engine/calculator';

interface UserDashboardProps {
  userProfile: UserProfileData;
  project: ComparisonProject;
  currency: string;
  onNavigateToWorkspace: () => void;
  onNavigateToShopping: () => void;
  onOpenNewComparison: () => void;
  onOpenSavedModal: () => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  onSelectSample: (sample: ComparisonProject) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userProfile,
  project,
  currency,
  onNavigateToWorkspace,
  onNavigateToShopping,
  onOpenNewComparison,
  onOpenSavedModal,
  onOpenSettings,
  onOpenAssistant,
  onSelectSample,
}) => {
  const [analysis, setAnalysis] = useState<ComparisonAnalysisResult | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);

  // Compute live analysis from actual current project
  useEffect(() => {
    if (project && project.options && project.options.length > 0) {
      try {
        const res = calculateComparison(project);
        setAnalysis(res);
      } catch (e) {
        console.warn('Dashboard calculation warning:', e);
      }
    } else {
      setAnalysis(null);
    }
  }, [project]);

  // Read saved comparisons & price alerts from localStorage
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('veracost_saved_comparisons');
      if (savedRaw) {
        const arr = JSON.parse(savedRaw);
        if (Array.isArray(arr)) setSavedCount(arr.length);
      }
      const alertsRaw = localStorage.getItem('price_alerts');
      if (alertsRaw) {
        const arr = JSON.parse(alertsRaw);
        if (Array.isArray(arr)) setAlertCount(arr.length);
      }
    } catch {}
  }, []);

  const displayName = userProfile.displayName || 'VeraCost Explorer';
  const optionsCount = project.options?.length || 0;

  // Currency symbol
  const getSymbol = (c: string) => {
    switch (c) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };
  const sym = getSymbol(currency);

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '28px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            background: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              Intelligence Workspace
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>• {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              color: '#ffffff',
              fontFamily: 'Outfit, Inter, sans-serif',
              letterSpacing: '-0.4px',
            }}
          >
            Welcome back, {displayName}
          </h1>

          <p style={{ fontSize: '14px', color: '#cbd5e1', maxWidth: '680px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Here is your active purchasing intelligence overview. Track true multi-year ownership costs, monitor retailer deals, and make data-driven buying choices.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onNavigateToWorkspace}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <SlidersHorizontal size={15} />
              <span>Go to Simulator Workspace</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToShopping}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={15} style={{ color: 'var(--teal-bright)' }} />
              <span>Smart Price Finder</span>
            </button>

            <button
              type="button"
              onClick={onOpenAssistant}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Bot size={15} style={{ color: '#818cf8' }} />
              <span>Ask Vera Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted, #94a3b8)' }}>Active Options</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
            {optionsCount} <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>products compared</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Project: <strong style={{ color: '#e2e8f0' }}>{project.title}</strong>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted, #94a3b8)' }}>Best Value Pick</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {analysis && analysis.lowestCostOptionId && analysis.results[analysis.lowestCostOptionId]
              ? analysis.results[analysis.lowestCostOptionId].optionName
              : optionsCount > 0
              ? project.options[0].name
              : 'No Options Yet'}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>
            {analysis && analysis.lowestCostOptionId && analysis.results[analysis.lowestCostOptionId]
              ? `Lowest Net TCO: ${sym}${Math.round(analysis.results[analysis.lowestCostOptionId].netTotalCost).toLocaleString()}`
              : 'Add options to compare'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted, #94a3b8)' }}>Saved & Benchmarks</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
              <Bookmark size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
            {savedCount + SAMPLE_COMPARISONS.length} <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>projects ready</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Includes 3 verified presets + your custom saves
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted, #94a3b8)' }}>Active Price Alerts</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <Bell size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
            {alertCount} <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>monitors configured</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Currency: <strong style={{ color: '#e2e8f0' }}>{currency} ({sym})</strong>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Current Comparison + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Active Comparison Details */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#ffffff' }}>
                Active Comparison: {project.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
                {project.description || 'Comparing total multi-year cost of ownership'}
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToWorkspace}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#93c5fd',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Open in Simulator</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Options List */}
          {optionsCount > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.options.map((opt, idx) => {
                const optAnalysis = analysis?.results ? analysis.results[opt.id] : null;
                const upfront = Number(opt.initialPurchasePrice) || 0;
                const totalCost = optAnalysis ? Math.round(optAnalysis.netTotalCost) : upfront;
                const isBest = analysis?.lowestCostOptionId === opt.id;

                return (
                  <div
                    key={opt.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: isBest ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: '180px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#ffffff' }}>{opt.name}</strong>
                        {isBest && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                            }}
                          >
                            Best Value
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        Category: <span style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{opt.category}</span> • Useful Life: {opt.usefulLifeYears || 3} yrs
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Upfront Listed</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                          {sym}{upfront.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ minWidth: '90px' }}>
                        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>3-Year TCO</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: isBest ? '#34d399' : '#ffffff' }}>
                          {sym}{totalCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle, rgba(255, 255, 255, 0.15))',
              }}
            >
              <Layers size={36} style={{ color: 'var(--text-muted, #64748b)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 6px 0', color: '#ffffff' }}>
                No Products Added to Comparison
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', maxWidth: '400px', margin: '0 auto 16px' }}>
                Search for tech, appliances, or vehicle models in Smart Price Finder or create a new custom comparison to start modeling true ownership costs.
              </p>
              <button
                type="button"
                onClick={onOpenNewComparison}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Create Comparison
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Verified Benchmarks & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Action Shortcuts */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 14px 0', color: '#ffffff' }}>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={onOpenNewComparison}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <PlusCircle size={16} style={{ color: '#3b82f6' }} />
                <span>New Custom Comparison</span>
              </button>

              <button
                type="button"
                onClick={onOpenSavedModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Bookmark size={16} style={{ color: '#facc15' }} />
                <span>Saved & Benchmarks</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Settings size={16} style={{ color: '#94a3b8' }} />
                <span>Workspace Settings & Currency</span>
              </button>
            </div>
          </div>

          {/* Benchmark Models */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0', color: '#ffffff' }}>
              Verified Benchmarks
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 14px 0' }}>
              Load pre-calculated reference models
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SAMPLE_COMPARISONS.map((sample) => (
                <div
                  key={sample.id}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>{sample.title}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sample.options.length} options</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                    {(sample.description || '').slice(0, 75)}…
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    style={{
                      width: '100%',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#93c5fd',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Load into Simulator →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
