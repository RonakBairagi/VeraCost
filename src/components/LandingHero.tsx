import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Cpu, 
  Laptop, 
  Car, 
  Coffee, 
  Cloud, 
  TrendingDown, 
  Calculator, 
  HelpCircle,
  PlusCircle,
  Smartphone,
  Headphones,
  Gamepad2,
  Package
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';
import { SAMPLE_COMPARISONS } from '../data/sampleComparisons';
import { ComparisonProject } from '../types/cost';

interface LandingHeroProps {
  onStartComparison: () => void;
  onOpenNewComparison: () => void;
  onSelectSample: (project: ComparisonProject) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartComparison,
  onOpenNewComparison,
  onSelectSample,
}) => {
  return (
    <div className="landing-page">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-pill">
          <Cpu size={14} />
          <span>Powered by NVIDIA Nemotron & Nebius Token Factory</span>
        </div>

        <h1 className="hero-title">
          Stop Buying Based on <span>Sticker Price</span> Alone.
        </h1>

        <p className="hero-subtitle">
          Over 60% of product lifecycle expenses occur <em>after</em> the purchase checkout. 
          {BRAND_CONFIG.name} is a transparent, deterministic Total Cost of Ownership (TCO) simulator 
          that models subscriptions, repairs, energy, replacements, and residual value over time for 
          <strong> any product you can buy on the internet</strong>.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary" onClick={onOpenNewComparison}>
            <PlusCircle size={18} />
            Create Custom Comparison
          </button>
          <button className="btn-secondary" onClick={onStartComparison}>
            Open Simulator Workspace
            <ArrowRight size={16} />
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => onSelectSample(SAMPLE_COMPARISONS[0])}
          >
            <Smartphone size={16} />
            Phone Benchmark (iPhone vs. Galaxy)
          </button>
        </div>

        {/* Quick Launch Preloaded Benchmarks */}
        <div className="sample-bar">
          <span className="sample-label">Or explore verified benchmarks:</span>
          <button 
            className="sample-chip" 
            onClick={() => onSelectSample(SAMPLE_COMPARISONS[0])}
          >
            <Smartphone size={14} style={{ color: 'var(--teal-bright)' }} />
            iPhone 16 Pro vs. Galaxy S24 Ultra
          </button>
          <button 
            className="sample-chip" 
            onClick={() => onSelectSample(SAMPLE_COMPARISONS[1])}
          >
            <Laptop size={14} style={{ color: 'var(--cyan-bright)' }} />
            MacBook Pro M3 vs. ThinkPad P14s
          </button>
          <button 
            className="sample-chip" 
            onClick={() => onSelectSample(SAMPLE_COMPARISONS[2])}
          >
            <Coffee size={14} style={{ color: 'var(--amber-warning)' }} />
            Espresso Setup vs. Pod Machine (Consumable Trap)
          </button>
          <button 
            className="sample-chip" 
            onClick={() => onSelectSample(SAMPLE_COMPARISONS[3])}
          >
            <Car size={14} style={{ color: 'var(--indigo-accent)' }} />
            EV vs. Hybrid 5-Year Ownership
          </button>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="container">
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon">
              <Calculator size={22} />
            </div>
            <h3>100% Deterministic Engine</h3>
            <p>
              Zero financial hallucinations. All calculations follow strict arithmetic rules:
              upfront outlays, normalized multi-frequency recurring fees, wear maintenance, 
              longevity replacement milestones, and residual recovery.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--indigo-accent)' }}>
              <Search size={22} />
            </div>
            <h3>Rules-Based Cost Discovery</h3>
            <p>
              Proactively surfaces category-specific blind spots: proprietary dongles, 
              battery wear thresholds, scheduled fluid flushes, standby energy draw, and 
              mandatory cloud subscriptions.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber-warning)' }}>
              <ShieldCheck size={22} />
            </div>
            <h3>Audit Trail & Confidence</h3>
            <p>
              Every assumption is tagged by data provenance: confirmed receipts, user estimates, 
              verified benchmarks, or suggested checklists. Clear alerts highlight unverified items.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald-success)' }}>
              <Cpu size={22} />
            </div>
            <h3>NVIDIA Nemotron Auditing</h3>
            <p>
              Server-side intelligence via Nebius Token Factory synthesizes plain-language tradeoffs, 
              flags missing assumptions, stress-tests sensitivities, and suggests overlooked costs.
            </p>
          </div>
        </div>
      </section>

      {/* How the Deterministic Formula Works */}
      <section className="container" style={{ margin: '3.5rem auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          backdropFilter: 'var(--glass-blur)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--teal-bright)' }} />
            <h2 style={{ fontSize: '1.45rem' }}>How Total Ownership Cost is Calculated</h2>
          </div>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Traditional purchasing focuses on the initial invoice. {BRAND_CONFIG.name} models your true cash outflow over a synchronized time horizon using the standardized formula:
          </p>

          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.95rem',
            color: 'var(--teal-bright)',
            lineHeight: 1.8,
            marginBottom: '1.5rem',
            overflowX: 'auto'
          }}>
            <strong>Net Total Cost</strong> = (Initial Purchase + Sales Tax) <br/>
            &nbsp;&nbsp;+ Setup & Accessories <br/>
            &nbsp;&nbsp;+ (Normalized Periodic Recurring Fees × Horizon Months) <br/>
            &nbsp;&nbsp;+ Scheduled Maintenance & Repair Outlays <br/>
            &nbsp;&nbsp;+ Operating Utilities & Consumables <br/>
            &nbsp;&nbsp;+ (Replacement Cycles × Unit Replacement Cost) <br/>
            &nbsp;&nbsp;<strong>− Estimated Residual / Resale Recovery Value</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>1. Frequency Normalization</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Daily, weekly, monthly, and annual fees are mathematically converted to uniform monthly rates to prevent distortion.
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>2. Longevity Replacement</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                If a device has a 3-year lifespan and you model 5 years, exactly 1 replacement is triggered at month 36.
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>3. Scenario Multipliers</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Instant stress-testing across Typical, Lower-Cost (optimistic reliability), and Higher-Cost (unexpected repairs) scenarios.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Categories Grid */}
      <section className="container" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Supported Decision Categories</h2>
        <p style={{ textAlign: 'center', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
          Select any domain to model tailored hidden expense checklists and lifecycle assumptions.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}>
          {[
            { icon: Smartphone, title: 'Smartphones & Mobile', sub: 'Flagships, chargers, cases, 5G data plans, insurance, battery' },
            { icon: Laptop, title: 'Laptops & Computers', sub: 'Docks, AppleCare, battery life, cloud storage, software' },
            { icon: Headphones, title: 'Audio & Wearables', sub: 'Noise canceling headphones, earbuds, smartwatches, tips' },
            { icon: Gamepad2, title: 'Gaming & Consoles', sub: 'Consoles, controllers, NVMe SSDs, online subscriptions' },
            { icon: Coffee, title: 'Household Appliances', sub: 'Coffee machines, ACs, vacuums, filters, descalers, energy' },
            { icon: Car, title: 'Vehicles & Mobility', sub: 'EVs, hybrids, gas cars, home charging, insurance, tires' },
            { icon: Cloud, title: 'Cloud & SaaS Tools', sub: 'Software subscriptions, team seats, egress, hosting' },
            { icon: Package, title: 'Any Custom Product', sub: 'Model after-costs for anything you can buy on the internet' },
          ].map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={onOpenNewComparison}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(20, 184, 166, 0.1)',
                  color: 'var(--teal-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={19} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{cat.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cat.sub}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
