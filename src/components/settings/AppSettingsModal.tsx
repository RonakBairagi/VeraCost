import React, { useState } from 'react';
import { 
  X, 
  User, 
  Moon, 
  Sun, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  LifeBuoy, 
  Key, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Mail,
  Loader2
} from 'lucide-react';
import { UserProfileData, sendPasswordReset, getFirebaseErrorMessage } from '../../config/firebase';
import { BRAND_CONFIG, CurrencyConfig } from '../../config/branding';
import { SUPPORT_CONFIG, openSupportEmailWorkflow } from '../../config/support';
import { ComparisonProject } from '../../types/cost';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfileData | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  isAiLive: boolean;
  onAiConfigChanged?: () => void;
  onOpenProfileModal: () => void;
  onSignOut?: () => void;
  project?: ComparisonProject;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  theme,
  onToggleTheme,
  currency,
  onCurrencyChange,
  isAiLive,
  onAiConfigChanged,
  onOpenProfileModal,
  onSignOut,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'preferences' | 'ai' | 'support'>('account');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Nebius AI state
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('nebius_custom_api_key') || '');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSendReset = async () => {
    if (!userProfile?.email) return;
    setResetLoading(true);
    setResetError(null);
    setResetSent(false);

    try {
      await sendPasswordReset(userProfile.email);
      setResetSent(true);
    } catch (err: any) {
      setResetError(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setResetLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);

    try {
      const resp = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await resp.json();
      if (resp.ok && data.valid) {
        setTestResult({ success: true, message: data.message || 'Nebius Token Factory connection verified!' });
        if (apiKey.trim()) {
          sessionStorage.setItem('nebius_custom_api_key', apiKey.trim());
          if (onAiConfigChanged) onAiConfigChanged();
        }
      } else {
        setTestResult({ success: false, message: data.message || 'Verification failed. Check your API key.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: `Connection error: ${e.message}` });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleExportProject = () => {
    if (!project) return;
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veracost-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--text-main, #f8fafc)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, transparent 100%)',
          }}
        >
          <div>
            <h2 id="settings-modal-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main, #ffffff)' }}>
              Workspace Settings & Preferences
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
              Customize your VeraCost experience, currency, and AI integrations
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.02))',
            padding: '0 16px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            style={tabButtonStyle(activeTab === 'account')}
          >
            <User size={14} />
            <span>Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            style={tabButtonStyle(activeTab === 'appearance')}
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            style={tabButtonStyle(activeTab === 'preferences')}
          >
            <DollarSign size={14} />
            <span>Currency & Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            style={tabButtonStyle(activeTab === 'ai')}
          >
            <Sparkles size={14} style={{ color: isAiLive ? '#10b981' : '#facc15' }} />
            <span>Nemotron AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            style={tabButtonStyle(activeTab === 'support')}
          >
            <LifeBuoy size={14} />
            <span>Support</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* 1. Account Tab */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-main, #ffffff)' }}>
                    {userProfile?.displayName || 'VeraCost User'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
                    {userProfile?.email || 'user@veracost.app'}
                  </div>
                  {userProfile?.phoneNumber && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                      Phone: {userProfile.phoneNumber}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileModal();
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Edit Profile & Avatar
                </button>
              </div>

              {/* Password Reset Section */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: 'var(--text-main, #ffffff)' }}>
                  Account Security & Password
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                  Need to change your password? We will send an official password reset link directly to your registered email address.
                </p>

                {resetSent && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#6ee7b7',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Password reset email has been sent. Please check your inbox.</span>
                  </div>
                )}

                {resetError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{resetError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendReset}
                  disabled={resetLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: resetLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {resetLoading ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
                  <span>Send Password Reset Email</span>
                </button>
              </div>

              {/* Sign Out */}
              {onSignOut && (
                <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out of VeraCost</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Appearance Tab */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main, #ffffff)' }}>
                  Color Theme
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0' }}>
                  Select your interface theme. Your choice is automatically saved across sessions.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'dark') onToggleTheme();
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: theme === 'dark' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                      border: theme === 'dark' ? '2px solid #3b82f6' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-main, #ffffff)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Moon size={18} style={{ color: '#60a5fa' }} />
                      <strong style={{ fontSize: '14px' }}>Dark Theme</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                      Sleek high-contrast fintech aesthetic for low-light comfort.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'light') onToggleTheme();
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: theme === 'light' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                      border: theme === 'light' ? '2px solid #3b82f6' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-main, #ffffff)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sun size={18} style={{ color: '#facc15' }} />
                      <strong style={{ fontSize: '14px' }}>Light Theme</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                      Clean, high-legibility interface for bright ambient environments.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Currency & Preferences Tab */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main, #ffffff)' }}>
                  Base Currency
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 14px 0' }}>
                  Sets the default denomination for TCO calculations and retailer quotes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {BRAND_CONFIG.currencies.map((curr: CurrencyConfig) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => onCurrencyChange(curr.code)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: currency === curr.code ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                        border: currency === curr.code ? '2px solid #3b82f6' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                        color: 'var(--text-main, #ffffff)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '800', color: currency === curr.code ? '#2563eb' : 'var(--text-main, #cbd5e1)' }}>
                        {curr.symbol} {curr.code}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        {curr.label.split('(')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Export */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-main, #ffffff)' }}>
                  Data Management
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                  Export your active comparison model as JSON for backup or external analysis.
                </p>

                <button
                  type="button"
                  onClick={handleExportProject}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={14} />
                  <span>Export Active Project (JSON)</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Nemotron AI Tab */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-main, #ffffff)' }}>
                    NVIDIA Nemotron via Nebius Token Factory
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontWeight: '700',
                      backgroundColor: isAiLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: isAiLive ? '#10b981' : '#facc15',
                      border: isAiLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                    }}
                  >
                    {isAiLive ? 'Live Cloud Connected' : 'Resilient Local Fallback'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  VeraCost uses NVIDIA Llama-3.1-Nemotron-70B for autonomous decision synthesis and cost audits. When cloud credentials are not supplied, our high-speed client assistant engine handles queries offline.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #cbd5e1)', marginBottom: '6px' }}>
                    Custom Nebius API Key (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="e.g. nbs-..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-input, rgba(15, 23, 42, 0.65))',
                        border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                        borderRadius: '10px',
                        color: 'var(--text-main, #ffffff)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleTestApiKey}
                      disabled={isTestingKey}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#3b82f6',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: isTestingKey ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isTestingKey ? 'Verifying…' : 'Test Key'}
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: testResult.success ? '#10b981' : '#fca5a5',
                      fontSize: '13px',
                      marginTop: '12px',
                    }}
                  >
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Support Tab */}
          {activeTab === 'support' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main, #ffffff)' }}>
                  Official Lead Architect Support
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Need assistance with calculations, retailer integrations, or features? You can contact Lead Developer Ronak Bairagi directly.
                </p>

                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                        fontWeight: 'bold',
                        fontSize: '16px',
                      }}
                    >
                      RB
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main, #ffffff)' }}>
                        {SUPPORT_CONFIG.leadDeveloper.name}
                      </strong>
                      <div style={{ fontSize: '12px', color: 'var(--teal-bright, #0284c7)' }}>
                        {SUPPORT_CONFIG.leadDeveloper.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)' }}>
                    <div>
                      Email:{' '}
                      <a 
                        href={`mailto:${SUPPORT_CONFIG.leadDeveloper.email}`} 
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        {SUPPORT_CONFIG.leadDeveloper.email}
                      </a>
                    </div>
                    <div>
                      Phone:{' '}
                      <a 
                        href={`tel:${SUPPORT_CONFIG.leadDeveloper.phone}`} 
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        {SUPPORT_CONFIG.leadDeveloper.formattedPhone}
                      </a>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                      Availability: {SUPPORT_CONFIG.leadDeveloper.availability}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openSupportEmailWorkflow('VeraCost Help & Inquiry')}
                    className="btn-primary"
                    style={{ marginTop: '16px', padding: '9px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Mail size={14} />
                    <span>Send Support Email via Gmail</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '12px 16px',
  background: 'none',
  border: 'none',
  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
  color: isActive ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
  fontSize: '13px',
  fontWeight: isActive ? '600' : '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
});
