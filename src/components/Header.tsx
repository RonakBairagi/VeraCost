import React from 'react';
import { Layers, Sparkles, SlidersHorizontal, Bookmark, Settings2, PlusCircle, Sun, Moon, ShoppingBag, LifeBuoy, Scissors, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import { BRAND_CONFIG, CurrencyConfig } from '../config/branding';
import { UserProfileData } from '../config/firebase';

interface HeaderProps {
  currentTab: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support';
  setCurrentTab: (tab: 'landing' | 'shopping' | 'workspace' | 'saved' | 'support') => void;
  currency: string;
  setCurrency: (c: string) => void;
  isAiLive: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSavedModal: () => void;
  onOpenNewComparison: () => void;
  onOpenScreenshotImport?: () => void;
  onToggleAssistant?: () => void;
  userProfile?: UserProfileData | null;
  onSignOut?: () => void;
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
  onOpenScreenshotImport,
  onToggleAssistant,
  userProfile,
  onSignOut,
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
            className={`nav-tab-btn ${currentTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setCurrentTab('shopping')}
          >
            <ShoppingBag size={15} />
            Smart Price Finder
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
          <button
            className={`nav-tab-btn ${currentTab === 'support' ? 'active' : ''}`}
            onClick={() => setCurrentTab('support')}
          >
            <LifeBuoy size={15} />
            Contact & Support
          </button>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Screenshot Import Action */}
          {onOpenScreenshotImport && (
            <button
              className="btn-secondary"
              onClick={onOpenScreenshotImport}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Import product screenshot via clipboard paste (Ctrl+V) or upload"
            >
              <Scissors size={14} />
              <span>Screenshot Import</span>
            </button>
          )}

          {/* Vera Assistant Chat Trigger */}
          {onToggleAssistant && (
            <button
              className="btn-secondary"
              onClick={onToggleAssistant}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Chat with Vera Assistant"
            >
              <MessageSquare size={14} style={{ color: 'var(--teal-bright)' }} />
              <span>Vera Assistant</span>
            </button>
          )}

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

          {/* User Profile & Sign Out */}
          {userProfile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '6px',
                borderLeft: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
                title={userProfile.email}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                </div>
                <span
                  style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userProfile.displayName || userProfile.email.split('@')[0]}
                </span>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign out of VeraCost"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'color 0.15s ease',
                  }}
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
