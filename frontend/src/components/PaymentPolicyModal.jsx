import React, { useEffect } from 'react';

export default function PaymentPolicyModal({ isOpen, onClose, onAccept }) {
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
        style={{ maxWidth: '520px', border: '1px solid var(--color-border-gold)' }}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light-primary)' }}>
            Payment Policy
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-dark-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            As per our procurement policy, 50% of the total order value is required as advance payment before dispatch, and the remaining 50% is due upon delivery.
          </p>

          {/* Two Labeled Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--bg-ivory)',
              border: '1px solid var(--color-border-gold)',
              borderRadius: 'var(--border-radius-md)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <strong style={{ color: 'var(--color-gold)', fontSize: '0.9rem', display: 'block' }}>50% Advance</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>Payable before delivery is dispatched</span>
              </div>
              <span className="badge badge-available">Step 1</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--bg-ivory)',
              border: '1px solid var(--color-border-gold)',
              borderRadius: 'var(--border-radius-md)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <strong style={{ color: 'var(--text-dark-primary)', fontSize: '0.9rem', display: 'block' }}>50% on Delivery</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>Payable upon receipt of goods</span>
              </div>
              <span className="badge badge-dispatched">Step 2</span>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)', fontStyle: 'italic', marginBottom: '1.5rem', textAlign: 'center' }}>
            Note: This policy applies to all bulk & wholesale contracts placed through the Purchase Portal.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={onAccept}
              style={{ flex: '1 1 180px', padding: '0.75rem', fontSize: '0.9rem', minHeight: '44px' }}
            >
              Accept & Continue
            </button>
            <button 
              className="btn btn-outline-navy" 
              onClick={onClose}
              style={{ flex: '1 1 120px', padding: '0.75rem', fontSize: '0.9rem', minHeight: '44px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
