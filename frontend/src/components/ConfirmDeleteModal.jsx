import React, { useEffect } from 'react';

export default function ConfirmDeleteModal({ isOpen, itemName, onClose, onConfirm, loading }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', border: '1px solid var(--color-coral)' }}
      >
        <div className="modal-header" style={{ background: 'var(--bg-navy-deep)' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light-primary)' }}>
            Confirm Deletion
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(193, 80, 46, 0.1)',
            color: 'var(--color-coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>

          <p style={{ color: 'var(--text-dark-primary)', fontSize: '0.98rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Are you sure you want to remove <span style={{ color: 'var(--color-coral)' }}>"{itemName}"</span>?
          </p>
          
          <p style={{ color: 'var(--text-dark-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
            This cannot be undone and will immediately update the live public site.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <button 
              className="btn btn-danger" 
              onClick={onConfirm}
              style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', backgroundColor: 'var(--color-coral)', color: '#fff' }}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Item'}
            </button>
            <button 
              className="btn btn-outline-navy" 
              onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
