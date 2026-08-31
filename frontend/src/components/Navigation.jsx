import React from 'react';
import { api } from '../utils/api';

export default function Navigation({ user, currentView, onViewChange, onOpenAuth }) {
  const handleLogout = async () => {
    try {
      await api.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAdminLoginClick = () => {
    onOpenAuth(true); // Open modal with admin/staff mode preselected
  };

  const scrollToSection = (id) => {
    onViewChange('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <nav className="navbar">
      <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onViewChange('home'); }}>
        {/* Gold Maritime Anchor SVG emblem */}
        <svg className="brand-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="6" r="2"></circle>
          <line x1="12" y1="8" x2="12" y2="22"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
        <span>AJM FISHERIES</span>
      </a>

      {/* Center Navigation Links */}
      <div className="navbar-menu">
        <button className={`navbar-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
          Home
        </button>
        <button className="navbar-link" onClick={() => scrollToSection('about-section')}>
          About Us
        </button>
        <button className="navbar-link" onClick={() => scrollToSection('why-us-section')}>
          Why Choose Us
        </button>
        <button className="navbar-link" onClick={() => scrollToSection('rates-ticker')}>
          Live Rates
        </button>
        <button className="navbar-link" onClick={() => scrollToSection('contact-section')}>
          Contact
        </button>

        {user && (
          <button 
            className={`navbar-link ${currentView === 'portal' ? 'active' : ''}`}
            onClick={() => onViewChange('portal')}
            style={{ color: 'var(--color-gold)', fontWeight: '600' }}
          >
            Purchase Portal
          </button>
        )}

        {user && user.role === 'admin' && (
          <button 
            className={`navbar-link ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => onViewChange('admin')}
            style={{ border: '1px solid var(--color-border-gold)', padding: '0.25rem 0.6rem', borderRadius: '4px', color: 'var(--color-gold)' }}
          >
            Admin Dashboard
          </button>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="navbar-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light-secondary)' }}>
              <strong style={{ color: 'var(--text-light-primary)' }}>{user.name || user.email}</strong>
              <span style={{ 
                fontSize: '0.7rem', 
                marginLeft: '0.4rem', 
                padding: '0.15rem 0.4rem', 
                backgroundColor: 'rgba(201, 166, 91, 0.12)',
                color: 'var(--color-gold)',
                borderRadius: '3px',
                border: '1px solid var(--color-border-gold)'
              }}>
                {user.role === 'admin' ? 'Staff' : 'Client'}
              </span>
            </span>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
              Logout
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => onOpenAuth(false)} style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem' }}>
            Browse Bulk Catch
          </button>
        )}

        {/* Staff Portal Outlined Gold Button */}
        <button className="btn btn-secondary" onClick={handleAdminLoginClick} id="admin-login-nav-btn" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
          Staff Portal
        </button>
      </div>
    </nav>
  );
}
