import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AuthModal({ isOpen, onClose, isStaffInitial, onLoginSuccess }) {
  const [isStaff, setIsStaff] = useState(isStaffInitial);
  const [activeTab, setActiveTab] = useState('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailConfirmNotice, setEmailConfirmNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsStaff(isStaffInitial);
    setError('');
    setSuccess('');
    setEmailConfirmNotice(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (isStaffInitial) {
      setActiveTab('login');
    }
  }, [isOpen, isStaffInitial]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailConfirmNotice(false);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        let authResult;
        try {
          // Attempt Sign In with Supabase Auth
          authResult = await api.signIn(email, password);
        } catch (signInErr) {
          const errMessage = signInErr.message || '';

          if (errMessage.toLowerCase().includes('email not confirmed')) {
            setEmailConfirmNotice(true);
            throw new Error('Your email address has not been confirmed yet.');
          }

          // If staff account does not exist in Supabase Auth yet, attempt auto-signup
          if (isStaff && email.toLowerCase().endsWith('@ajm.com')) {
            try {
              authResult = await api.signUp(email, password);
              if (!authResult.session) {
                setEmailConfirmNotice(true);
                throw new Error('Staff account registered! Email confirmation is required by your Supabase settings.');
              }
            } catch (signUpErr) {
              throw signInErr;
            }
          } else {
            throw signInErr;
          }
        }

        const user = authResult.user;
        if (!user) throw new Error('Authentication failed. Please check your credentials.');

        // If staff portal, verify admin role
        if (isStaff) {
          try {
            const profile = await api.getProfile(user.id);
            if (profile.role !== 'admin') {
              await api.signOut();
              throw new Error('Access denied. This portal is reserved for authorized staff members.');
            }
          } catch (profileErr) {
            if (profileErr.message.includes('Access denied')) throw profileErr;
            await api.signOut();
            throw new Error('Access denied. This portal is reserved for authorized staff members.');
          }
        }

        setSuccess('Authentication successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 800);

      } else {
        // Customer Registration
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const { user, session } = await api.signUp(email, password);

        if (!user) throw new Error('Registration failed. Please try again.');

        if (!session) {
          setEmailConfirmNotice(true);
          setSuccess('Account created! Please confirm your email');
        } else {
          setSuccess('Registration successful! Welcome to AJM Fisheries.');
          setTimeout(() => {
            onLoginSuccess(user);
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await api.signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
      setLoading(false);
    }
  };

  // Eye icon SVGs
  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isStaff ? 'Staff Portal Authentication' : 'B2B Client Access'}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Staff mode notice */}
        {isStaff && (
          <div style={{
            backgroundColor: 'rgba(201, 166, 91, 0.1)',
            borderBottom: '1px solid var(--color-border-gold)',
            padding: '0.75rem 2rem',
            fontSize: '0.78rem',
            color: 'var(--color-gold)',
            textAlign: 'center',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Authorized Staff Access
          </div>
        )}

        <div className="modal-body">
          {!isStaff && (
            <div className="auth-tabs">
              <div
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); setEmailConfirmNotice(false); }}
              >
                Sign In
              </div>
              <div
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); setEmailConfirmNotice(false); }}
              >
                Register Business
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Email confirmation guidance box if Supabase requires email verification */}
          {emailConfirmNotice && (
            <div style={{
              backgroundColor: 'rgba(201, 166, 91, 0.08)',
              border: '1px solid var(--color-border-gold)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '0.85rem 1rem',
              fontSize: '0.82rem',
              color: 'var(--text-dark-primary)',
              marginBottom: '1.25rem',
              lineHeight: '1.5'
            }}>

            </div>
          )}

          {/* Google OAuth button — customer mode only */}
          {!isStaff && (
            <>
              <button
                className="btn btn-outline-navy"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  marginBottom: '1.25rem',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
                color: 'var(--text-dark-secondary)',
                fontSize: '0.8rem',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }}></div>
                <span>or email authentication</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }}></div>
              </div>
            </>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. buyer@luxuryresort.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Re-enter Password</label>
                <div className="form-input-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : activeTab === 'login' ? 'Authenticate Access' : 'Create B2B Account'}
            </button>
          </form>

          {/* Toggle between Staff and Customer Login */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            {isStaff ? (
              <a href="#" className="navbar-link" onClick={(e) => { e.preventDefault(); setIsStaff(false); setActiveTab('login'); setError(''); setSuccess(''); setEmailConfirmNotice(false); }}>
                Looking for Client Portal?
              </a>
            ) : (
              <a href="#" className="navbar-link" onClick={(e) => { e.preventDefault(); setIsStaff(true); setActiveTab('login'); setError(''); setSuccess(''); setEmailConfirmNotice(false); }}>
                Authorized Staff Access
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
