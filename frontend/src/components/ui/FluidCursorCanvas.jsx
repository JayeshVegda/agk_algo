import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../lib/theme';

/**
 * High-performance, luminous Fluid Liquid Cursor Canvas
 * Features an expansive glowing pointer, viscous fluid ribbons, and dynamic droplet physics.
 * 100% alpha-transparent, zero WebGL context crashes.
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

    // Palette: Emerald (#10b981), Cyan (#06b6d4), Mint (#34d399), Neon Green (#00d878)
    const PALETTE_DARK = [
      { r: 16, g: 185, b: 129 },
      { r: 6, g: 182, b: 212 },
      { r: 52, g: 211, b: 153 },
      { r: 0, g: 216, b: 120 },
    ];

    const PALETTE_LIGHT = [
      { r: 5, g: 150, b: 105 },
      { r: 2, g: 132, b: 199 },
      { r: 16, g: 185, b: 129 },
      { r: 14, g: 165, b: 233 },
    ];

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
    const TRAIL_LENGTH = 32;
    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: width * 0.5,
      y: height * 0.38,
      vx: 0,
      vy: 0,
    }));

    // Interactive fluid droplets
    const particles = [];
    const MAX_PARTICLES = 160;

    let mouse = {
      x: width * 0.5,
      y: height * 0.38,
      px: width * 0.5,
      py: height * 0.38,
      speed: 0,
      active: false,
    };

    // Splash burst on pointer press
    const createSplash = (x, y, count = 38) => {
      const colors = isDark ? PALETTE_DARK : PALETTE_LIGHT;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = 3.5 + Math.random() * 8.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          size: 8 + Math.random() * 18,
          alpha: 0.95,
          decay: 0.015 + Math.random() * 0.018,
          color,
        });
      }
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      if (nx >= -100 && nx <= width + 100 && ny >= -100 && ny <= height + 100) {
        const dx = nx - mouse.x;
        const dy = ny - mouse.y;
        mouse.speed = Math.sqrt(dx * dx + dy * dy);
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.x = nx;
        mouse.y = ny;
        mouse.active = true;

        // Emit richer, bigger fluid droplets when moving
        if (mouse.speed > 2 && particles.length < MAX_PARTICLES) {
          const count = Math.min(Math.floor(mouse.speed * 0.35), 5);
          const colors = isDark ? PALETTE_DARK : PALETTE_LIGHT;
          for (let i = 0; i < count; i++) {
            const spread = 16;
            const px = nx + (Math.random() - 0.5) * spread;
            const py = ny + (Math.random() - 0.5) * spread;
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push({
              x: px,
              y: py,
              vx: (dx * 0.16) + (Math.random() - 0.5) * 3,
              vy: (dy * 0.16) + (Math.random() - 0.5) * 3,
              size: 6 + Math.random() * 12,
              alpha: 0.8,
              decay: 0.02 + Math.random() * 0.02,
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
        createSplash(nx, ny, 42);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    let lastTime = performance.now();

    const loop = (time) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Update fluid trail with spring inertia
      const head = trail[0];
      const targetX = mouse.active ? mouse.x : width * 0.5 + Math.sin(time * 0.0014) * (width * 0.22);
      const targetY = mouse.active ? mouse.y : height * 0.40 + Math.cos(time * 0.0018) * (height * 0.14);

      head.vx += (targetX - head.x) * 22 * dt;
      head.vy += (targetY - head.y) * 22 * dt;
      head.vx *= 0.74;
      head.vy *= 0.74;
      head.x += head.vx;
      head.y += head.vy;

      for (let i = 1; i < TRAIL_LENGTH; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;

        curr.vx += dx * 32 * dt;
        curr.vy += dy * 32 * dt;
        curr.vx *= 0.66;
        curr.vy *= 0.66;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      ctx.save();
      ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';

      // 2. Wide ambient fluid aura
      const auraRadius = 260;
      const auraGradient = ctx.createRadialGradient(
        head.x, head.y, 0,
        head.x, head.y, auraRadius
      );
      if (isDark) {
        auraGradient.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
        auraGradient.addColorStop(0.35, 'rgba(6, 182, 212, 0.18)');
        auraGradient.addColorStop(0.7, 'rgba(0, 216, 120, 0.08)');
        auraGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        auraGradient.addColorStop(0.35, 'rgba(2, 132, 199, 0.12)');
        auraGradient.addColorStop(0.7, 'rgba(5, 150, 105, 0.05)');
        auraGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(head.x, head.y, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Thick viscous fluid ribbon
      for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i + 1];
        const ratio = 1 - (i / TRAIL_LENGTH);
        const radius = Math.max(3.5, ratio * 34);
        const alpha = ratio * (isDark ? 0.45 : 0.30);

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

      // 4. Glowing pointer head orb
      const headRadius = 45;
      const headGlow = ctx.createRadialGradient(
        head.x, head.y, 0,
        head.x, head.y, headRadius
      );
      if (isDark) {
        headGlow.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
        headGlow.addColorStop(0.3, 'rgba(16, 185, 129, 0.55)');
        headGlow.addColorStop(0.7, 'rgba(6, 182, 212, 0.25)');
        headGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else {
        headGlow.addColorStop(0, 'rgba(16, 185, 129, 0.75)');
        headGlow.addColorStop(0.3, 'rgba(5, 150, 105, 0.45)');
        headGlow.addColorStop(0.7, 'rgba(2, 132, 199, 0.20)');
        headGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      }
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner brilliant core
      ctx.fillStyle = isDark ? '#FFFFFF' : '#10B981';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Update and Render Fluid Droplets
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.93;
        p.vy *= 0.93;
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
