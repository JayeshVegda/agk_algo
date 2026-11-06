import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(16, 185, 129, 0.12)',
  borderColor = 'rgba(16, 185, 129, 0.35)',
  ...props
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-akg-hairline bg-akg-card transition-all duration-300 card-depth',
        className
      )}
      {...props}
    >
      {/* Specular Radial Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />
      {/* Interactive Border Rim Glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity,
          boxShadow: `inset 0 0 0 1px ${borderColor}`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
