import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2,
  Lock
} from 'lucide-react';
import { 
  UserProfileData, 
  updateUserProfileData, 
  compressProfileImage 
} from '../../config/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfileData;
  onProfileUpdated: (updated: UserProfileData) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photoURL || null);
  const [isPhotoChanged, setIsPhotoChanged] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened or userProfile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(userProfile.displayName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setPhotoPreview(userProfile.photoURL || null);
      setIsPhotoChanged(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, userProfile]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initial = (displayName.trim().charAt(0) || userProfile.email.charAt(0) || 'U').toUpperCase();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressProfileImage(file, 320, 0.85);
      setPhotoPreview(compressedDataUrl);
      setIsPhotoChanged(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setIsPhotoChanged(true);
  };

  const handleCopyUid = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(userProfile.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter a display name with at least 2 characters.');
      return;
    }

    const cleanPhone = phoneNumber.trim();
    if (cleanPhone && !/^[+0-9\s-]{7,16}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid phone number (digits and optional country code).');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<UserProfileData> = {
        displayName: cleanName,
        phoneNumber: cleanPhone || undefined,
      };

      if (isPhotoChanged) {
        updates.photoURL = photoPreview || undefined;
      }

      const updated = await updateUserProfileData(userProfile.uid, updates);

      onProfileUpdated(updated);
      setSuccessMessage('Profile details updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('[Profile Update Error]', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format creation date
  let memberSince = 'Recent Member';
  try {
    if (userProfile.createdAt) {
      const date = new Date(userProfile.createdAt);
      memberSince = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  } catch {}

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
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
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--text-main, #f8fafc)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <UserIcon size={18} />
            </div>
            <div>
              <h2 id="profile-modal-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main, #ffffff)' }}>
                Account Profile
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
                Manage your personal information and verified identity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
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

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Notifications */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#ef4444' }} />
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
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                color: '#6ee7b7',
                fontSize: '13px',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#10b981' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px',
              backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff' }}>
                  {initial}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-main, #ffffff)' }}>
                Profile Picture
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: '0 0 10px 0' }}>
                PNG, JPEG, or WEBP. Automatically optimized for fast loading.
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    border: '1px solid rgba(37, 99, 235, 0.4)',
                    color: '#93c5fd',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Camera size={14} />
                  <span>Upload Picture</span>
                </button>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Display Name */}
            <div>
              <label 
                htmlFor="profile-name-input"
                style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #cbd5e1)', marginBottom: '6px' }}
              >
                Full Name / Display Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  id="profile-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="e.g. Ronak Bairagi"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--bg-input, rgba(15, 23, 42, 0.65))',
                    border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                    borderRadius: '10px',
                    color: 'var(--text-main, #ffffff)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #cbd5e1)' }}>
                  Registered Email Address
                </label>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#10b981',
                  }}
                >
                  <ShieldCheck size={13} /> Verified Auth
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  title="Registered email cannot be modified directly"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    color: 'var(--text-muted, #94a3b8)',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label 
                htmlFor="profile-phone-input"
                style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #cbd5e1)', marginBottom: '6px' }}
              >
                Phone Number <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 90519 05871"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--bg-input, rgba(15, 23, 42, 0.65))',
                    border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                    borderRadius: '10px',
                    color: 'var(--text-main, #ffffff)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Account Metadata Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                  <Calendar size={13} />
                  <span>Member Since</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #e2e8f0)', marginTop: '4px' }}>
                  {memberSince}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-elevated, rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} />
                    <span>User ID</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    title="Copy User UID"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedUid ? '#10b981' : 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {copiedUid ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div 
                  style={{ 
                    fontSize: '12px', 
                    fontFamily: "'JetBrains Mono', monospace", 
                    color: 'var(--text-main, #e2e8f0)', 
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={userProfile.uid}
                >
                  {userProfile.uid.slice(0, 16)}…
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-secondary, #cbd5e1)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  opacity: isSaving ? 0.75 : 1,
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
