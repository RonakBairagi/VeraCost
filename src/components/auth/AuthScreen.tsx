import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  registerWithEmailAndPassword, 
  loginWithEmailAndPassword, 
  sendPasswordReset, 
  getFirebaseErrorMessage, 
  isFirebaseConfigured,
  UserProfileData 
} from '../../config/firebase';
import { User } from 'firebase/auth';

interface AuthScreenProps {
  onAuthenticated: (user: User | null, profile?: UserProfileData, isGuest?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

  const handleToggleMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMessage('Password reset instructions sent. Please check your inbox.');
      } catch (err: any) {
        setErrorMessage(getFirebaseErrorMessage(err.code || ''));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      const cleanName = displayName.trim();
      if (!cleanName || cleanName.length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }

      const cleanPhone = phoneNumber.trim();
      if (cleanPhone && !/^[+0-9\s-]{7,16}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid phone number (digits and optional country code).');
        return;
      }
    }

    if (!firebaseReady) {
      // Offline / guest mode fallback
      const mockProfile: UserProfileData = {
        uid: `guest-${Date.now()}`,
        email: cleanEmail,
        displayName: displayName.trim() || cleanEmail.split('@')[0],
        phoneNumber: phoneNumber.trim() || undefined,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      onAuthenticated(null, mockProfile, true);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const { user, profile } = await registerWithEmailAndPassword(
          cleanEmail,
          password,
          displayName,
          phoneNumber
        );
        onAuthenticated(user, profile, false);
      } else {
        const { user, profile } = await loginWithEmailAndPassword(cleanEmail, password);
        onAuthenticated(user, profile, false);
      }
    } catch (err: any) {
      console.warn('[VeraCost Auth Error]', err.code, err.message);
      setErrorMessage(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    if (isLoading) return;
    const demoProfile: UserProfileData = {
      uid: 'guest-session',
      email: 'guest@veracost.app',
      displayName: 'Guest Explorer',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    onAuthenticated(null, demoProfile, true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050814',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 58, 138, 0.22) 0%, rgba(5, 8, 20, 0.98) 100%)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(640px, 90vw)',
          height: '240px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: '460px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.04)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              position: 'relative',
              width: '58px',
              height: '58px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(16, 185, 129, 0.5))',
                filter: 'blur(8px)',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.45)',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#ffffff',
                  fontFamily: 'Outfit, Inter, sans-serif',
                  letterSpacing: '-1px',
                }}
              >
                V
              </span>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '800',
                margin: 0,
                fontFamily: 'Outfit, Inter, sans-serif',
                color: '#ffffff',
                letterSpacing: '-0.3px',
              }}
            >
              VeraCost
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontWeight: '700',
                background: 'rgba(59, 130, 246, 0.16)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              PRO
            </span>
          </div>

          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#e2e8f0',
              margin: '4px 0 6px 0',
            }}
          >
            {mode === 'register'
              ? 'Create your VeraCost Account'
              : mode === 'forgot'
              ? 'Reset Account Password'
              : 'Sign In to Your Workspace'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {mode === 'register'
              ? 'Save your product comparisons and uncover true lifetime ownership costs.'
              : mode === 'forgot'
              ? 'Enter your account email to receive a password reset link.'
              : 'Access your saved products, cost models, and decision intelligence.'}
          </p>
        </div>

        {/* Tab switch between Login and Register */}
        {mode !== 'forgot' && (
          <div
            role="tablist"
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => handleToggleMode('login')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'login' ? '#2563eb' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'login' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => handleToggleMode('register')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'register' ? '#2563eb' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'register' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#6ee7b7',
              fontSize: '13px',
              lineHeight: 1.45,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <div>
              <label 
                htmlFor="auth-fullname"
                style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}
              >
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="auth-fullname"
                  type="text"
                  placeholder="e.g. Ronak Bairagi"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label 
              htmlFor="auth-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              />
            </div>
          </div>

          {/* Phone Number (Register only) */}
          {mode === 'register' && (
            <div>
              <label 
                htmlFor="auth-phone"
                style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}
              >
                Phone Number <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="auth-phone"
                  type="tel"
                  placeholder="+91 90519 05871"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Password (Login and Register) */}
          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label 
                  htmlFor="auth-password"
                  style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}
                >
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleToggleMode('forgot')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#60a5fa',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 44px 12px 42px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '6px',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.45)',
              transition: 'all 0.15s ease',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing…</span>
              </>
            ) : mode === 'register' ? (
              <>
                Create VeraCost Account <ArrowRight size={18} />
              </>
            ) : mode === 'forgot' ? (
              <>
                Send Password Reset Email <ArrowRight size={18} />
              </>
            ) : (
              <>
                Sign In to VeraCost <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Forgot password back link */}
        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '22px 0 16px',
            color: '#64748b',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ padding: '0 12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Guest Explorer Option */}
        <button
          type="button"
          onClick={handleGuestContinue}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#cbd5e1',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.15s ease',
          }}
        >
          <ShieldCheck size={18} color="#10b981" />
          Continue as Guest Explorer
        </button>

        {/* Feature summary / Trust footer */}
        <div
          style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ display: 'block', color: '#38bdf8', fontWeight: '700' }}>TCO</span>
            True Cost Analysis
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ display: 'block', color: '#34d399', fontWeight: '700' }}>Live</span>
            Verified Pricing
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ display: 'block', color: '#a78bfa', fontWeight: '700' }}>AI</span>
            Smart Shopping
          </div>
        </div>
      </div>
    </div>
  );
};
