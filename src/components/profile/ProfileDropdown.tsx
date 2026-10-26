import React, { useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  LayoutDashboard, 
  Settings, 
  Bookmark, 
  SlidersHorizontal, 
  LifeBuoy, 
  LogOut, 
  Sun, 
  Moon, 
  ShieldCheck, 
  ChevronRight,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import { UserProfileData } from '../../config/firebase';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfileData;
  onOpenProfile: () => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onOpenSavedModal: () => void;
  onNavigateToWorkspace: () => void;
  onOpenSupport: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  userProfile,
  onOpenProfile,
  onOpenDashboard,
  onOpenSettings,
  onOpenSavedModal,
  onNavigateToWorkspace,
  onOpenSupport,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = userProfile.displayName || 'VeraCost User';
  const email = userProfile.email || 'user@veracost.app';
  const phone = userProfile.phoneNumber;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const isGuest = userProfile.uid.startsWith('guest');

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="User Account Menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '320px',
        maxWidth: 'calc(100vw - 24px)',
        backgroundColor: 'var(--bg-card, #0f172a)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        borderRadius: '16px',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 1000,
        overflow: 'hidden',
        color: 'var(--text-main, #f8fafc)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: 'fadeInSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Account Info Header */}
      <div
        style={{
          padding: '16px 18px',
          background: 'var(--dropdown-header-bg, linear-gradient(180deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%))',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar */}
          <div
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                {initial}
              </span>
            )}
          </div>

          {/* Details */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontWeight: '700',
                  fontSize: '15px',
                  color: 'var(--text-main, #ffffff)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: isGuest ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isGuest ? '#facc15' : '#10b981',
                  border: isGuest ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  flexShrink: 0,
                }}
              >
                {isGuest ? 'Guest' : 'Member'}
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted, #94a3b8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={email}
            >
              <Mail size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
            </div>

            {phone && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Phone size={12} style={{ flexShrink: 0 }} />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Profile Action Link */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenProfile();
          }}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            color: 'var(--teal-bright, #0284c7)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background 0.15s ease',
          }}
        >
          <span>View Account & Edit Profile</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Primary Navigation Destinations */}
      <div style={{ padding: '8px 6px', borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))' }}>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onOpenDashboard();
          }}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={16} style={{ color: '#38bdf8' }} />
            <span>Dashboard</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Overview</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onNavigateToWorkspace();
          }}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={16} style={{ color: '#818cf8' }} />
            <span>Simulator Workspace</span>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onOpenSavedModal();
          }}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark size={16} style={{ color: '#34d399' }} />
            <span>Saved Comparisons</span>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Settings & Appearance */}
      <div style={{ padding: '8px 6px', borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))' }}>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={16} style={{ color: '#cbd5e1' }} />
            <span>Settings</span>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={onToggleTheme}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'dark' ? (
              <Sun size={16} style={{ color: '#facc15' }} />
            ) : (
              <Moon size={16} style={{ color: '#60a5fa' }} />
            )}
            <span>Theme</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onOpenSupport();
          }}
          className="profile-menu-item"
          style={menuItemStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LifeBuoy size={16} style={{ color: '#38bdf8' }} />
            <span>Help & Support</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Ronak Bairagi</span>
        </button>
      </div>

      {/* Sign Out Action */}
      <div style={{ padding: '8px 6px' }}>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="profile-menu-item"
          style={{
            ...menuItemStyle,
            color: '#f87171',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--text-main, #f1f5f9)',
  fontSize: '13px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  textAlign: 'left',
};
