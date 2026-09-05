import React, { useState, useEffect } from 'react';

/**
 * MarineMotion Component
 * Renders subtle, lightweight SVG fish silhouettes and gentle rising bubble particles.
 * Dynamically scales down element count on mobile devices for peak rendering performance.
 * Degrades gracefully via CSS @media (prefers-reduced-motion: reduce).
 */
export default function MarineMotion({ type = 'hero' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const bubbleCount = isMobile 
    ? (type === 'bubbles' ? 6 : type === 'hero' ? 5 : 4)
    : (type === 'bubbles' ? 12 : type === 'hero' ? 10 : 8);

  if (type === 'bubbles') {
    return (
      <div className="marine-bubbles-container" aria-hidden="true">
        {[...Array(bubbleCount)].map((_, i) => (
          <span 
            key={i} 
            className="marine-bubble" 
            style={{
              left: `${(i * (isMobile ? 16 : 8.5)) + 4}%`,
              animationDelay: `${(i * 0.7) % 5}s`,
              animationDuration: `${6 + ((i % 4) * 2)}s`,
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className="marine-motion-overlay" aria-hidden="true">
        {/* Primary swimming fish */}
        <div className="fish-silhouette fish-swim-right" style={{ top: '25%', animationDelay: '0s', animationDuration: '28s', willChange: 'transform' }}>
          <svg width="48" height="24" viewBox="0 0 100 50" fill="currentColor">
            <path d="M90 25 C70 5, 30 10, 10 25 C30 40, 70 45, 90 25 Z M10 25 L0 12 L0 38 Z M65 20 C60 15, 45 15, 40 20 C45 25, 60 25, 65 20 Z" opacity="0.12" />
          </svg>
        </div>

        {/* Secondary deeper level swimming fish (rendered on desktop/tablet) */}
        {!isMobile && (
          <div className="fish-silhouette fish-swim-left" style={{ top: '65%', animationDelay: '12s', animationDuration: '34s', willChange: 'transform' }}>
            <svg width="36" height="18" viewBox="0 0 100 50" fill="currentColor">
              <path d="M10 25 C30 5, 70 10, 90 25 C70 40, 30 45, 10 25 Z M90 25 L100 12 L100 38 Z M35 20 C40 15, 55 15, 60 20 C55 25, 40 25, 35 20 Z" opacity="0.08" />
            </svg>
          </div>
        )}

        {/* Bubble particles */}
        <div className="marine-bubbles-container">
          {[...Array(bubbleCount)].map((_, i) => (
            <span 
              key={i} 
              className="marine-bubble" 
              style={{
                left: `${(i * (isMobile ? 18 : 10)) + 4}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${7 + (i % 3) * 2.5}s`,
                width: `${5 + (i % 3) * 2}px`,
                height: `${5 + (i % 3) * 2}px`,
                willChange: 'transform, opacity',
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
        <div className="fish-silhouette fish-swim-right" style={{ top: '35%', animationDelay: '3s', animationDuration: '30s', willChange: 'transform' }}>
          <svg width="40" height="20" viewBox="0 0 100 50" fill="currentColor">
            <path d="M90 25 C70 5, 30 10, 10 25 C30 40, 70 45, 90 25 Z M10 25 L0 12 L0 38 Z" opacity="0.09" />
          </svg>
        </div>
        <div className="marine-bubbles-container">
          {[...Array(bubbleCount)].map((_, i) => (
            <span 
              key={i} 
              className="marine-bubble" 
              style={{
                left: `${(i * (isMobile ? 22 : 12)) + 5}%`,
                animationDelay: `${i * 1.1}s`,
                animationDuration: `${8 + (i % 3) * 2}s`,
                width: `${4 + (i % 2) * 3}px`,
                height: `${4 + (i % 2) * 3}px`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

