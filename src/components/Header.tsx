import React from 'react';
import { Layers, Sparkles, SlidersHorizontal, Bookmark, Settings2, PlusCircle, Sun, Moon } from 'lucide-react';
import { BRAND_CONFIG, CurrencyConfig } from '../config/branding';

interface HeaderProps {
  currentTab: 'landing' | 'workspace' | 'saved';
  setCurrentTab: (tab: 'landing' | 'workspace' | 'saved') => void;
  currency: string;
  setCurrency: (c: string) => void;
  isAiLive: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSavedModal: () => void;
  onOpenNewComparison: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currency,
  setCurrency,
  isAiLive,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenSavedModal,
  onOpenNewComparison,
}) => {
  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand identity */}
        <div className="brand-wrapper" onClick={() => setCurrentTab('landing')}>
          <div className="brand-icon-box">
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">{BRAND_CONFIG.name}</span>
              <span className="brand-badge">TCO Engine</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {BRAND_CONFIG.tagline}
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="nav-links">
          <button
            className={`nav-tab-btn ${currentTab === 'landing' ? 'active' : ''}`}
            onClick={() => setCurrentTab('landing')}
          >
            Overview
          </button>
          <button
            className={`nav-tab-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setCurrentTab('workspace')}
          >
            <SlidersHorizontal size={15} />
            Simulator Workspace
          </button>
          <button
            className={`nav-tab-btn ${currentTab === 'saved' ? 'active' : ''}`}
            onClick={onOpenSavedModal}
          >
            <Bookmark size={15} />
            Saved & Benchmarks
          </button>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* New Custom Comparison Button */}
          <button
            className="btn-primary"
            onClick={onOpenNewComparison}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            title="Create a custom comparison from scratch without preloaded data"
          >
            <PlusCircle size={14} />
            New Custom Comparison
          </button>

          {/* Currency Switcher */}
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            title="Select Base Currency"
          >
            {BRAND_CONFIG.currencies.map((curr: CurrencyConfig) => (
              <option key={curr.code} value={curr.code}>
                {curr.label}
              </option>
            ))}
          </select>

          {/* AI Status Pill */}
          <button
            className="ai-status-pill"
            onClick={onOpenSettings}
            title="Configure NVIDIA Nemotron / Nebius Token Factory connection"
          >
            <span className={`status-dot ${isAiLive ? 'live' : 'mock'}`} />
            <Sparkles size={13} style={{ color: isAiLive ? 'var(--teal-bright)' : 'var(--amber-warning)' }} />
            <span>{isAiLive ? 'Nebius Nemotron (Live)' : 'Nemotron (Mock)'}</span>
            <Settings2 size={13} style={{ marginLeft: 2, color: 'var(--text-muted)' }} />
          </button>

          {/* Theme Switcher (Dark / Light Mode) */}
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="theme-icon sun" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} className="theme-icon moon" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
