import React, { useEffect, useRef } from 'react';

interface DynamicBackgroundProps {
  theme: 'dark' | 'light';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas particle constellation simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive repulsion
    let mouse = { x: -1000, y: -1000, radius: 130 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    // Palette per theme
    const darkPalette = [
      '#14b8a6', // Teal
      '#06b6d4', // Cyan
      '#6366f1', // Indigo
      '#10b981', // Emerald
      '#38bdf8', // Sky
    ];

    const lightPalette = [
      '#0d9488', // Teal
      '#0284c7', // Cyan
      '#4f46e5', // Indigo
      '#059669', // Emerald
      '#0284c7', // Sky
    ];

    const palette = theme === 'dark' ? darkPalette : lightPalette;

    // Create 42 particles
    const particleCount = Math.min(48, Math.max(24, Math.floor(width / 35)));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1.2,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.4 + 0.35,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby particles
      const connectionDist = 125;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * (theme === 'dark' ? 0.18 : 0.13);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = theme === 'dark' ? `rgba(20, 184, 166, ${alpha})` : `rgba(13, 148, 136, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < mouse.radius && mdist > 0) {
          const force = (1 - mdist / mouse.radius) * 1.5;
          p.x += (mdx / mdist) * force;
          p.y += (mdy / mdist) * force;
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div
      className="dynamic-bg-container"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Ambient Aurora Glow Spheres */}
      <div className="bg-aurora-orb bg-aurora-1" />
      <div className="bg-aurora-orb bg-aurora-2" />
      <div className="bg-aurora-orb bg-aurora-3" />
      <div className="bg-aurora-orb bg-aurora-4" />

      {/* Subtle Technical Grid Matrix Lines */}
      <div className="bg-grid-matrix" />

      {/* HTML5 Canvas interactive constellation network */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: isDark ? 0.85 : 0.65,
        }}
      />

      {/* ========================================================
          MOVING FLOATING GEOMETRIC & UI/UX DESIGNS
          ======================================================== */}

      {/* Floating Design 1: Technical Gyroscope Radar Compass (Top Right) */}
      <div className="floating-design float-radar-compass">
        <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
          <circle cx="140" cy="140" r="130" stroke={isDark ? 'rgba(20, 184, 166, 0.22)' : 'rgba(13, 148, 136, 0.2)'} strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="140" cy="140" r="95" stroke={isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(2, 132, 199, 0.22)'} strokeWidth="1.2" />
          <circle cx="140" cy="140" r="55" stroke={isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.25)'} strokeWidth="1" strokeDasharray="6 4" />
          <circle cx="140" cy="140" r="16" stroke={isDark ? '#14b8a6' : '#0d9488'} strokeWidth="1.5" />
          <line x1="140" y1="5" x2="140" y2="275" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="5" y1="140" x2="275" y2="140" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="140" cy="45" r="3.5" fill={isDark ? '#14b8a6' : '#0d9488'} />
          <circle cx="235" cy="140" r="3.5" fill={isDark ? '#06b6d4' : '#0284c7'} />
          <circle cx="140" cy="235" r="3.5" fill={isDark ? '#6366f1' : '#4f46e5'} />
          <circle cx="45" cy="140" r="3.5" fill={isDark ? '#10b981' : '#059669'} />
        </svg>
      </div>

      {/* Floating Design 2: 3D Isometric Wireframe Data Cube (Top Left) */}
      <div className="floating-design float-isometric-cube-1">
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
          <polygon points="50,15 85,35 50,55 15,35" stroke={isDark ? '#14b8a6' : '#0d9488'} strokeWidth="1.2" fill={isDark ? 'rgba(20, 184, 166, 0.05)' : 'rgba(13, 148, 136, 0.04)'} />
          <polygon points="15,35 50,55 50,90 15,70" stroke={isDark ? '#06b6d4' : '#0284c7'} strokeWidth="1.2" fill={isDark ? 'rgba(6, 182, 212, 0.05)' : 'rgba(2, 132, 199, 0.04)'} />
          <polygon points="85,35 50,55 50,90 85,70" stroke={isDark ? '#6366f1' : '#4f46e5'} strokeWidth="1.2" fill={isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(79, 70, 229, 0.04)'} />
          <circle cx="50" cy="55" r="2.5" fill={isDark ? '#14b8a6' : '#0d9488'} />
          <circle cx="85" cy="35" r="2" fill={isDark ? '#06b6d4' : '#0284c7'} />
          <circle cx="15" cy="35" r="2" fill={isDark ? '#6366f1' : '#4f46e5'} />
        </svg>
      </div>

      {/* Floating Design 3: Dynamic TCO Sparkline Telemetry Badge (Mid Left) */}
      <div className="floating-design float-badge-tco">
        <div className="telemetry-badge">
          <div className="telemetry-header">
            <span className="telemetry-dot" />
            <span className="telemetry-title">∑ TCO DECISION MATRIX</span>
          </div>
          <div className="telemetry-body">
            <svg width="100" height="26" viewBox="0 0 100 26" fill="none">
              <path d="M2 20 L25 15 L45 18 L68 7 L98 4" stroke={isDark ? '#14b8a6' : '#0d9488'} strokeWidth="2" strokeLinecap="round" />
              <path d="M2 20 L25 15 L45 18 L68 7 L98 4 L98 26 L2 26 Z" fill={isDark ? 'rgba(20, 184, 166, 0.12)' : 'rgba(13, 148, 136, 0.1)'} />
              <circle cx="98" cy="4" r="3" fill={isDark ? '#06b6d4' : '#0284c7'} />
            </svg>
            <span className="telemetry-stat">+18.4% SAVINGS</span>
          </div>
        </div>
      </div>

      {/* Floating Design 4: Circular Residual Gauge Telemetry Badge (Bottom Right) */}
      <div className="floating-design float-badge-residual">
        <div className="telemetry-badge">
          <div className="telemetry-header">
            <span className="telemetry-dot residual" />
            <span className="telemetry-title">◈ RESIDUAL HORIZON 5Y</span>
          </div>
          <div className="telemetry-body">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="13" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth="3" />
              <circle cx="17" cy="17" r="13" stroke={isDark ? '#f59e0b' : '#d97706'} strokeWidth="3" strokeDasharray="81.6" strokeDashoffset="28" strokeLinecap="round" />
            </svg>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isDark ? '#f59e0b' : '#d97706' }}>65.8% RECOVERED</div>
              <div style={{ fontSize: '0.62rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>OPTIMAL RESALE EXIT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Design 5: Nemotron AI Engine Synthesis Badge (Bottom Left) */}
      <div className="floating-design float-badge-ai">
        <div className="telemetry-badge">
          <div className="telemetry-header">
            <span className="telemetry-dot ai" />
            <span className="telemetry-title">⚡ NEMOTRON AI SYNTHESIS</span>
          </div>
          <div className="telemetry-body" style={{ gap: '0.6rem' }}>
            <span className="telemetry-code">NVIDIA Nemotron-4-340B</span>
            <span className="telemetry-confidence">FIDELITY: 99.4%</span>
          </div>
        </div>
      </div>

      {/* Floating Design 6: Flowing Cyber Circuit Wave Streams (Center) */}
      <div className="floating-design float-cyber-wave">
        <svg width="680" height="140" viewBox="0 0 680 140" fill="none">
          <path
            d="M 0,70 Q 170,10 340,70 T 680,70"
            stroke={isDark ? 'rgba(20, 184, 166, 0.16)' : 'rgba(13, 148, 136, 0.14)'}
            strokeWidth="1.5"
            strokeDasharray="8 12"
            className="circuit-wave-pulse"
          />
          <path
            d="M 0,85 Q 170,140 340,85 T 680,85"
            stroke={isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(79, 70, 229, 0.14)'}
            strokeWidth="1.2"
            strokeDasharray="6 10"
            className="circuit-wave-pulse-reverse"
          />
        </svg>
      </div>

      {/* Floating Design 7: Hexagonal Tech Cluster & Nodes (Top Center / Mid) */}
      <div className="floating-design float-hex-cluster">
        <svg width="180" height="180" viewBox="0 0 120 120" fill="none">
          <polygon points="60,10 100,32 100,78 60,100 20,78 20,32" stroke={isDark ? 'rgba(6, 182, 212, 0.28)' : 'rgba(2, 132, 199, 0.22)'} strokeWidth="1" strokeDasharray="4 4" />
          <polygon points="60,25 90,42 90,78 60,95 30,78 30,42" stroke={isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(13, 148, 136, 0.25)'} strokeWidth="1" />
          <circle cx="60" cy="60" r="14" fill={isDark ? 'rgba(20, 184, 166, 0.08)' : 'rgba(13, 148, 136, 0.06)'} stroke={isDark ? '#14b8a6' : '#0d9488'} strokeWidth="1" />
          <circle cx="60" cy="10" r="3" fill={isDark ? '#06b6d4' : '#0284c7'} />
          <circle cx="100" cy="78" r="3" fill={isDark ? '#6366f1' : '#4f46e5'} />
          <circle cx="20" cy="78" r="3" fill={isDark ? '#10b981' : '#059669'} />
        </svg>
      </div>

      {/* Floating Design 8: Isometric Secondary Diamond Wireframe (Mid Right) */}
      <div className="floating-design float-diamond-prism">
        <svg width="110" height="110" viewBox="0 0 80 80" fill="none">
          <path d="M40 5 L75 40 L40 75 L5 40 Z" stroke={isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(219, 39, 119, 0.25)'} strokeWidth="1" strokeDasharray="5 3" />
          <path d="M40 18 L62 40 L40 62 L18 40 Z" stroke={isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.28)'} strokeWidth="1.2" />
          <circle cx="40" cy="40" r="4" fill={isDark ? '#f59e0b' : '#d97706'} />
        </svg>
      </div>

      {/* Floating Coordinate HUD Markers */}
      <div className="floating-design float-hud-coord-1">
        <span className="hud-code">[VeraCost :: TCO_MATRIX_ONLINE]</span>
      </div>
      <div className="floating-design float-hud-coord-2">
        <span className="hud-code">[NEBIUS_TOKEN_STREAM • 120Hz]</span>
      </div>
      <div className="floating-design float-hud-crosshair-1">+</div>
      <div className="floating-design float-hud-crosshair-2">+</div>
      <div className="floating-design float-hud-crosshair-3">+</div>
    </div>
  );
};
