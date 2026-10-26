import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, TrendingDown, ShieldCheck, Cpu } from 'lucide-react';

interface StartupScreenProps {
  statusMessage?: string;
}

const PHASES = [
  'Verifying secure session & environment…',
  'Loading verified retailer intelligence & pricing models…',
  'Calibrating Total Cost of Ownership (TCO) mathematical engine…',
  'Initializing NVIDIA Nemotron AI reasoning…',
  'VeraCost platform ready.',
];

export const StartupScreen: React.FC<StartupScreenProps> = ({ statusMessage }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = statusMessage || PHASES[phaseIndex];

  return (
    <div
      className="veracost-startup-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070b13',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '24px 16px',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic ambient background depth */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 550px)',
          height: 'min(90vw, 550px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.16) 0%, rgba(99, 102, 241, 0.12) 35%, rgba(6, 182, 212, 0.05) 55%, transparent 75%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'startup-orb-pulse 4s ease-in-out infinite alternate',
        }}
      />

      {/* Subtle background tech grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        {/* Brand Emblem */}
        <div
          style={{
            position: 'relative',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 50%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 45px -10px rgba(13, 148, 136, 0.5), 0 0 25px rgba(37, 99, 235, 0.35)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              animation: 'startup-logo-float 3s ease-in-out infinite alternate',
            }}
          >
            {/* Gloss reflection shine */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '20px 20px 0 0',
              }}
            />
            <span
              style={{
                fontSize: '38px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-1.5px',
                fontFamily: "'Outfit', sans-serif",
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              V
            </span>
          </div>

          {/* Sparkle badge */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              padding: '5px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.8)',
              border: '2px solid #070b13',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="#ffffff" />
          </div>
        </div>

        {/* Wordmark and Title */}
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: '800',
            letterSpacing: '-0.8px',
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.15,
          }}
        >
          VeraCost
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--teal-bright, #14b8a6)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Transparent Total Cost of Ownership
        </p>

        <p
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            lineHeight: 1.5,
            margin: '0 0 24px 0',
            maxWidth: '360px',
          }}
        >
          Look beyond misleading sticker prices to discover the true lifetime cost of tech, appliances, and vehicles.
        </p>

        {/* Micro-Visual: TCO Analysis Simulation Preview */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '26px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            <span>Live TCO Engine</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                  animation: 'startup-dot-blink 1.2s infinite',
                }}
              />
              Active
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Sticker</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>₹1,19,900</div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '10px',
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#fda4af', marginBottom: '2px' }}>+ Setup & Maint</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f43f5e' }}>+₹14,500</div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#6ee7b7', marginBottom: '2px' }}>- Resale Value</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>-₹38,000</div>
            </div>
          </div>
        </div>

        {/* High-Precision Progress Bar */}
        <div
          style={{
            width: '240px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '14px',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (phaseIndex + 1) * 25)}%`,
              background: 'linear-gradient(90deg, #0d9488, #2563eb, #10b981)',
              borderRadius: '999px',
              transition: 'width 0.4s ease-out',
              boxShadow: '0 0 12px rgba(20, 184, 166, 0.8)',
            }}
          />
        </div>

        {/* Live Loading Phase Label */}
        <span
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            letterSpacing: '0.2px',
            minHeight: '18px',
          }}
        >
          {currentMessage}
        </span>
      </div>

      <style>{`
        @keyframes startup-orb-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 1;
          }
        }
        @keyframes startup-logo-float {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-4px);
          }
        }
        @keyframes startup-dot-blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .veracost-startup-root * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
