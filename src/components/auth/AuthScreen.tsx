import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ShieldCheck
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
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
      } catch (err: any) {
        setErrorMessage(getFirebaseErrorMessage(err.code || ''));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      const cleanName = displayName.trim();
      if (!cleanName || cleanName.length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }

      const cleanPhone = phoneNumber.trim();
      if (cleanPhone && !/^[+0-9\s-]{7,15}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid phone number (digits only or +country code).');
        return;
      }
    }

    if (!firebaseReady) {
      // Graceful local development / demo mode if Firebase is not yet wired in .env
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#030712',
        color: '#f9fafb',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #10b981 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: '900',
                color: '#ffffff',
                fontFamily: 'Outfit, Inter, sans-serif',
              }}
            >
              V
            </span>
          </div>

          <h2
            style={{
              fontSize: '24px',
              fontWeight: '800',
              margin: '0 0 6px 0',
              fontFamily: 'Outfit, Inter, sans-serif',
              color: '#ffffff',
              letterSpacing: '-0.3px',
            }}
          >
            {mode === 'register' ? 'Create your VeraCost Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome back to VeraCost'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {mode === 'register'
              ? 'Save custom product comparisons & monitor true lifetime costs.'
              : mode === 'forgot'
              ? 'Enter your verified account email to receive a secure recovery link.'
              : 'Sign in to access your saved comparisons, price alerts, and simulator.'}
          </p>
        </div>

        {/* Tab switch between Login and Register */}
        {mode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'login' ? '#3b82f6' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('register')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'register' ? '#3b82f6' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
              color: '#f87171',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
              color: '#34d399',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  placeholder="e.g. Ronak Bairagi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Phone Number (Register only) */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Phone Number <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="tel"
                  placeholder="+91 90519 05871"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Password (Login and Register) */}
          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>
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
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 38px 10px 38px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <span>Authenticating…</span>
            ) : mode === 'register' ? (
              <>
                Create Account <ArrowRight size={16} />
              </>
            ) : mode === 'forgot' ? (
              <>
                Send Reset Link <ArrowRight size={16} />
              </>
            ) : (
              <>
                Sign In to VeraCost <ArrowRight size={16} />
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
                fontSize: '13px',
                cursor: 'pointer',
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
            margin: '24px 0 16px',
            color: '#475569',
            fontSize: '12px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ padding: '0 12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Guest Explorer Option */}
        <button
          type="button"
          onClick={handleGuestContinue}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#cbd5e1',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.15s ease',
          }}
        >
          <ShieldCheck size={16} color="#10b981" />
          Continue as Guest Explorer
        </button>

        {/* Firebase Connection Status */}
        <div
          style={{
            marginTop: '18px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: firebaseReady ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            border: firebaseReady ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '11px',
            color: firebaseReady ? '#6ee7b7' : '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {firebaseReady ? (
              <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
            ) : (
              <Info size={14} style={{ flexShrink: 0 }} />
            )}
            <span>
              {firebaseReady ? (
                <>
                  Firebase Auth: <strong style={{ color: '#ffffff' }}>veracost-5f3c5</strong>
                </>
              ) : (
                'Firebase Auth: Offline / Guest Mode'
              )}
            </span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: '600',
              backgroundColor: firebaseReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: firebaseReady ? '#a7f3d0' : '#cbd5e1',
            }}
          >
            {firebaseReady ? 'Live Cloud' : 'Local'}
          </span>
        </div>
      </div>
    </div>
  );
};
