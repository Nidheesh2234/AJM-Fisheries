import React from 'react';

/**
 * MarineMotion Component
 * Renders subtle, lightweight SVG fish silhouettes and gentle rising bubble particles.
 * Degrades gracefully via CSS @media (prefers-reduced-motion: reduce).
 */
export default function MarineMotion({ type = 'hero' }) {
  if (type === 'bubbles') {
    return (
      <div className="marine-bubbles-container" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <span 
            key={i} 
            className="marine-bubble" 
            style={{
              left: `${(i * 8.5) + 4}%`,
              animationDelay: `${(i * 0.7) % 5}s`,
              animationDuration: `${6 + ((i % 4) * 2)}s`,
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className="marine-motion-overlay" aria-hidden="true">
        {/* Subtle swimming fish 1 */}
        <div className="fish-silhouette fish-swim-right" style={{ top: '25%', animationDelay: '0s', animationDuration: '28s' }}>
          <svg width="48" height="24" viewBox="0 0 100 50" fill="currentColor">
            <path d="M90 25 C70 5, 30 10, 10 25 C30 40, 70 45, 90 25 Z M10 25 L0 12 L0 38 Z M65 20 C60 15, 45 15, 40 20 C45 25, 60 25, 65 20 Z" opacity="0.12" />
          </svg>
        </div>

        {/* Subtle swimming fish 2 (deeper level, smaller, reversed direction) */}
        <div className="fish-silhouette fish-swim-left" style={{ top: '65%', animationDelay: '12s', animationDuration: '34s' }}>
          <svg width="36" height="18" viewBox="0 0 100 50" fill="currentColor">
            <path d="M10 25 C30 5, 70 10, 90 25 C70 40, 30 45, 10 25 Z M90 25 L100 12 L100 38 Z M35 20 C40 15, 55 15, 60 20 C55 25, 40 25, 35 20 Z" opacity="0.08" />
          </svg>
        </div>

        {/* Bubble particles */}
        <div className="marine-bubbles-container">
          {[...Array(10)].map((_, i) => (
            <span 
              key={i} 
              className="marine-bubble" 
              style={{
                left: `${(i * 10) + 2}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${7 + (i % 3) * 2.5}s`,
                width: `${5 + (i % 3) * 2}px`,
                height: `${5 + (i % 3) * 2}px`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'closing-cta') {
    return (
      <div className="marine-motion-overlay" aria-hidden="true">
        <div className="fish-silhouette fish-swim-right" style={{ top: '35%', animationDelay: '3s', animationDuration: '30s' }}>
          <svg width="40" height="20" viewBox="0 0 100 50" fill="currentColor">
            <path d="M90 25 C70 5, 30 10, 10 25 C30 40, 70 45, 90 25 Z M10 25 L0 12 L0 38 Z" opacity="0.09" />
          </svg>
        </div>
        <div className="marine-bubbles-container">
          {[...Array(8)].map((_, i) => (
            <span 
              key={i} 
              className="marine-bubble" 
              style={{
                left: `${(i * 12) + 5}%`,
                animationDelay: `${i * 1.1}s`,
                animationDuration: `${8 + (i % 3) * 2}s`,
                width: `${4 + (i % 2) * 3}px`,
                height: `${4 + (i % 2) * 3}px`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
