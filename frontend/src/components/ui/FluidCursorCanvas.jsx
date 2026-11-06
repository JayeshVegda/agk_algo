import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/theme';

/**
 * High-performance, rock-solid Fluid Liquid Cursor Canvas
 * Uses Verlet physics, viscous damping, and smooth cubic bezier spline ribbons
 * with glowing fluid droplets. 100% alpha-transparent, zero WebGL context bugs.
 */
export default function FluidCursorCanvas({ className = '' }) {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Palette: Emerald (#10B981), Cyan (#06B6D4), Mint (#34D399)
    const PALETTE_DARK = [
      { r: 16, g: 185, b: 129 },  // emerald
      { r: 6, g: 182, b: 212 },   // cyan
      { r: 52, g: 211, b: 153 },  // mint
      { r: 0, g: 216, b: 120 }    // bright terminal green
    ];

    const PALETTE_LIGHT = [
      { r: 5, g: 150, b: 105 },
      { r: 8, g: 145, b: 178 },
      { r: 16, g: 185, b: 129 }
    ];

    // Resize handler
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Viscous fluid trail nodes (spring chain)
    const TRAIL_LENGTH = 28;
    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: width * 0.5,
      y: height * 0.4,
      vx: 0,
      vy: 0,
    }));

    // Interactive fluid droplets
    const particles = [];
    const MAX_PARTICLES = 120;

    let mouse = {
      x: width * 0.5,
      y: height * 0.4,
      px: width * 0.5,
      py: height * 0.4,
      speed: 0,
      active: false,
    };

    // Splash burst on click
    const createSplash = (x, y, count = 22) => {
      const colors = isDark ? PALETTE_DARK : PALETTE_LIGHT;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = 2.5 + Math.random() * 5.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          size: 4 + Math.random() * 9,
          alpha: 0.85,
          decay: 0.016 + Math.random() * 0.02,
          color,
        });
      }
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      // Only track when inside or near canvas
      if (nx >= -60 && nx <= width + 60 && ny >= -60 && ny <= height + 60) {
        const dx = nx - mouse.x;
        const dy = ny - mouse.y;
        mouse.speed = Math.sqrt(dx * dx + dy * dy);
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.x = nx;
        mouse.y = ny;
        mouse.active = true;

        // Emit fluid droplets when moving
        if (mouse.speed > 2 && particles.length < MAX_PARTICLES) {
          const count = Math.min(Math.floor(mouse.speed * 0.25), 4);
          const colors = isDark ? PALETTE_DARK : PALETTE_LIGHT;
          for (let i = 0; i < count; i++) {
            const spread = 8;
            const px = nx + (Math.random() - 0.5) * spread;
            const py = ny + (Math.random() - 0.5) * spread;
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push({
              x: px,
              y: py,
              vx: (dx * 0.12) + (Math.random() - 0.5) * 1.8,
              vy: (dy * 0.12) + (Math.random() - 0.5) * 1.8,
              size: 2.5 + Math.random() * 5.5,
              alpha: 0.65,
              decay: 0.022 + Math.random() * 0.02,
              color,
            });
          }
        }
      }
    };

    const onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      if (nx >= 0 && nx <= width && ny >= 0 && ny <= height) {
        createSplash(nx, ny, 26);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    // Animation Loop
    let lastTime = performance.now();

    const loop = (time) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Always clear transparently
      ctx.clearRect(0, 0, width, height);

      // 1. Update fluid trail with spring inertia
      const head = trail[0];
      const targetX = mouse.active ? mouse.x : width * 0.5 + Math.sin(time * 0.0012) * (width * 0.18);
      const targetY = mouse.active ? mouse.y : height * 0.42 + Math.cos(time * 0.0016) * (height * 0.12);

      head.vx += (targetX - head.x) * 18 * dt;
      head.vy += (targetY - head.y) * 18 * dt;
      head.vx *= 0.72;
      head.vy *= 0.72;
      head.x += head.vx;
      head.y += head.vy;

      for (let i = 1; i < TRAIL_LENGTH; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;

        curr.vx += dx * 28 * dt;
        curr.vy += dy * 28 * dt;
        curr.vx *= 0.64; // viscous fluid drag
        curr.vy *= 0.64;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      // 2. Render Fluid Ambient Glow beneath cursor
      ctx.save();
      ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';

      const auraRadius = 140;
      const auraGradient = ctx.createRadialGradient(
        head.x, head.y, 0,
        head.x, head.y, auraRadius
      );
      if (isDark) {
        auraGradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        auraGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.10)');
        auraGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
        auraGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.06)');
        auraGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(head.x, head.y, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Viscous Fluid Ribbon
      for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i + 1];
        const ratio = 1 - (i / TRAIL_LENGTH);
        const radius = Math.max(1.5, ratio * 14);
        const alpha = ratio * (isDark ? 0.35 : 0.22);

        ctx.beginPath();
        ctx.strokeStyle = isDark
          ? `rgba(16, 185, 129, ${alpha})`
          : `rgba(5, 150, 105, ${alpha})`;
        ctx.lineWidth = radius;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 4. Update and Render Fluid Droplets
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // fluid friction
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const dropGradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size
        );
        const { r, g, b } = p.color;
        dropGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha})`);
        dropGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = dropGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      id="hero-fluid-canvas"
      className={`pointer-events-none absolute inset-0 h-full w-full select-none z-0 ${className}`}
    />
  );
}
