import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export default function Navigation({ user, currentView, onViewChange, onOpenAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await api.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAdminLoginClick = () => {
    closeMobileMenu();
    onOpenAuth(true); // Open modal with admin/staff mode preselected
  };

  const scrollToSection = (id) => {
    closeMobileMenu();
    onViewChange('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (view) => {
    closeMobileMenu();
    onViewChange(view);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <nav className="navbar">
      <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
        {/* Gold Maritime Anchor SVG emblem */}
        <svg className="brand-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="6" r="2"></circle>
          <line x1="12" y1="8" x2="12" y2="22"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
        <span>AJM FISHERIES</span>
      </a>

      {/* Hamburger Toggle Button — visible only on mobile */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && <div className="mobile-menu-backdrop" onClick={closeMobileMenu}></div>}

      {/* Center Navigation Links + Right Actions — slide-out on mobile */}
      <div className={`navbar-drawer ${mobileMenuOpen ? 'open' : ''}`} ref={menuRef}>
        <div className="navbar-menu">
          <button className={`navbar-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>
            Home
          </button>
          <button className="navbar-link" onClick={() => scrollToSection('about-section')}>
            About Us
          </button>
          <button className="navbar-link" onClick={() => scrollToSection('founder-story')}>
            Our Story
          </button>
          <button className="navbar-link" onClick={() => scrollToSection('how-it-works-journey')}>
            How It Works
          </button>
          <button className="navbar-link" onClick={() => scrollToSection('rates-ticker')}>
            Daily Rates
          </button>
          <button className="navbar-link" onClick={() => scrollToSection('contact-section')}>
            Contact
          </button>

          {user && (
            <button 
              className={`navbar-link ${currentView === 'portal' ? 'active' : ''}`}
              onClick={() => handleNavClick('portal')}
              style={{ color: 'var(--color-gold)', fontWeight: '600' }}
            >
              Purchase Portal
            </button>
          )}

          {user && user.role === 'admin' && (
            <button 
              className={`navbar-link ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
              style={{ border: '1px solid var(--color-border-gold)', padding: '0.25rem 0.6rem', borderRadius: '4px', color: 'var(--color-gold)' }}
            >
              Admin Dashboard
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-info">
              <span className="navbar-user-name">
                <strong style={{ color: 'var(--text-light-primary)' }}>{user.name || user.email}</strong>
                <span className="navbar-role-badge">
                  {user.role === 'admin' ? 'Staff' : 'Client'}
                </span>
              </span>
              <button className="btn btn-secondary" onClick={() => { closeMobileMenu(); handleLogout(); }} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => { closeMobileMenu(); onOpenAuth(false); }} style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem' }}>
              View Today's Rates
            </button>
          )}

          {/* Staff Portal Outlined Gold Button */}
          <button className="btn btn-secondary" onClick={handleAdminLoginClick} id="admin-login-nav-btn" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            Staff Portal
          </button>
        </div>
      </div>
    </nav>
  );
}
