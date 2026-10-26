import React from 'react';
import { Sparkles } from 'lucide-react';

interface StartupScreenProps {
  statusMessage?: string;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ statusMessage = 'Initializing VeraCost platform…' }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#030712',
        color: '#f9fafb',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
        userSelect: 'none',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Brand Logo Emblem */}
        <div
          style={{
            position: 'relative',
            width: '76px',
            height: '76px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '38px',
              fontWeight: '900',
              color: '#ffffff',
              letterSpacing: '-1.5px',
              fontFamily: 'Outfit, Inter, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            V
          </span>
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              padding: '4px',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
            }}
          >
            <Sparkles size={12} color="#ffffff" />
          </div>
        </div>

        {/* Brand Wordmark */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: '0 0 8px 0',
            background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Outfit, Inter, sans-serif',
          }}
        >
          VeraCost
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#94a3b8',
            lineHeight: 1.5,
            margin: '0 0 32px 0',
            maxWidth: '340px',
          }}
        >
          Making Smarter Product Decisions
          <br />
          <span style={{ color: '#64748b', fontSize: '13px' }}>
            Uncovering True Lifetime Ownership Cost
          </span>
        </p>

        {/* Subtle Loading Progress Bar */}
        <div
          style={{
            width: '180px',
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              borderRadius: '999px',
              animation: 'veracost-pulse-slide 1.4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Status Text */}
        <span
          style={{
            fontSize: '12px',
            color: '#64748b',
            letterSpacing: '0.2px',
          }}
        >
          {statusMessage}
        </span>
      </div>

      <style>{`
        @keyframes veracost-pulse-slide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(300%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="veracost-pulse-slide"] {
            animation: none !important;
            width: 100% !important;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};
