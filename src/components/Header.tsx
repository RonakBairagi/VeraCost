import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  SlidersHorizontal, 
  Bookmark, 
  Settings2, 
  PlusCircle, 
  Sun, 
  Moon, 
  ShoppingBag, 
  LifeBuoy, 
  MessageSquare, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { BRAND_CONFIG, CurrencyConfig } from '../config/branding';
import { UserProfileData } from '../config/firebase';
import { ProfileDropdown } from './profile/ProfileDropdown';

export type NavTabType = 'landing' | 'shopping' | 'workspace' | 'saved' | 'support' | 'dashboard';

interface HeaderProps {
  currentTab: NavTabType;
  setCurrentTab: (tab: NavTabType) => void;
  currency: string;
  setCurrency: (c: string) => void;
  isAiLive: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSavedModal: () => void;
  onOpenNewComparison: () => void;
  onOpenProfile: () => void;
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
  onOpenProfile,
  onToggleAssistant,
  userProfile,
  onSignOut,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initial = userProfile?.displayName
    ? userProfile.displayName.trim().charAt(0).toUpperCase()
    : userProfile?.email
    ? userProfile.email.charAt(0).toUpperCase()
    : 'U';

  const truncatedName = userProfile?.displayName
    ? userProfile.displayName.split(' ')[0]
    : userProfile?.email
    ? userProfile.email.split('@')[0]
    : 'Account';

  return (
    <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container header-inner" style={{ position: 'relative' }}>
        {/* Left: Brand Identity */}
        <div 
          className="brand-wrapper" 
          onClick={() => {
            setCurrentTab('landing');
            setIsMobileMenuOpen(false);
          }}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <div className="brand-icon-box">
            <Layers size={22} />
          </div>
          <div className="brand-text-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="brand-title">{BRAND_CONFIG.name}</span>
              <span className="brand-badge">TCO Engine</span>
            </div>
            <div className="brand-tagline" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {BRAND_CONFIG.tagline}
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="nav-links desktop-nav">
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'landing' ? 'active' : ''}`}
            onClick={() => setCurrentTab('landing')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setCurrentTab('shopping')}
          >
            <ShoppingBag size={15} />
            <span>Price Finder</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setCurrentTab('workspace')}
          >
            <SlidersHorizontal size={15} />
            <span>Simulator</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'saved' ? 'active' : ''}`}
            onClick={onOpenSavedModal}
          >
            <Bookmark size={15} />
            <span>Saved</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'support' ? 'active' : ''}`}
            onClick={() => setCurrentTab('support')}
          >
            <LifeBuoy size={15} />
            <span>Support</span>
          </button>
        </nav>

        {/* Right: Actions Cluster */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* New Custom Comparison CTA */}
          <button
            type="button"
            className="btn-primary new-comparison-btn"
            onClick={onOpenNewComparison}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            title="Create a custom comparison from scratch"
          >
            <PlusCircle size={15} />
            <span className="btn-label">+ Compare</span>
          </button>

          {/* Currency Switcher */}
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            title="Select Currency"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            {BRAND_CONFIG.currencies.map((curr: CurrencyConfig) => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code}
              </option>
            ))}
          </select>

          {/* User Profile Control & Dropdown */}
          {userProfile && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-label="User Account Menu"
                className="profile-pill-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: isProfileMenuOpen ? '1px solid #3b82f6' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  borderRadius: '24px',
                  padding: '4px 10px 4px 5px',
                  cursor: 'pointer',
                  color: 'var(--text-main, #ffffff)',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                {/* Avatar / Photo */}
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={truncatedName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Truncated Name */}
                <span
                  style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                  }}
                >
                  {truncatedName}
                </span>

                <ChevronDown 
                  size={14} 
                  style={{ 
                    color: 'var(--text-muted, #94a3b8)', 
                    transition: 'transform 0.15s ease',
                    transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none',
                  }} 
                />
              </button>

              {/* Profile Dropdown Component */}
              <ProfileDropdown
                isOpen={isProfileMenuOpen}
                onClose={() => setIsProfileMenuOpen(false)}
                userProfile={userProfile}
                onOpenProfile={onOpenProfile}
                onOpenDashboard={() => setCurrentTab('dashboard')}
                onOpenSettings={onOpenSettings}
                onOpenSavedModal={onOpenSavedModal}
                onNavigateToWorkspace={() => setCurrentTab('workspace')}
                onOpenSupport={() => setCurrentTab('support')}
                onSignOut={() => {
                  if (onSignOut) onSignOut();
                }}
                theme={theme}
                onToggleTheme={onToggleTheme}
              />
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-main, #ffffff)',
              cursor: 'pointer',
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-drawer"
          style={{
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            backgroundColor: 'var(--bg-card, #0f172a)',
            padding: '12px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'landing' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('landing');
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'shopping' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('shopping');
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <ShoppingBag size={16} />
            <span>Smart Price Finder</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('workspace');
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <SlidersHorizontal size={16} />
            <span>Simulator Workspace</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('dashboard');
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              onOpenSavedModal();
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <Bookmark size={16} />
            <span>Saved & Benchmarks</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'support' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('support');
              setIsMobileMenuOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <LifeBuoy size={16} />
            <span>Contact & Support</span>
          </button>
        </div>
      )}
    </header>
  );
};
