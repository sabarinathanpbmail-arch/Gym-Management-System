import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useAuth();

  // Extract token & email from either hash or search query params
  const getQueryParams = () => {
    let search = window.location.search;
    if (window.location.hash && window.location.hash.includes('?')) {
      search = '?' + window.location.hash.split('?')[1];
    }
    const params = new URLSearchParams(search);
    return {
      token: params.get('token') || '',
      email: params.get('email') || ''
    };
  };

  const { token, email } = getQueryParams();

  const [invitation, setInvitation] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkInvitation = async () => {
      setVerifying(true);
      setVerifyError('');

      if (!token || !email) {
        setVerifyError('Invalid invitation link. Both a valid token and email are required. Please use the link sent to your invitation email.');
        setVerifying(false);
        return;
      }

      try {
        const res = await api.auth.verifyInvitation(token, email);
        if (res && res.valid && res.data) {
          setInvitation(res.data);
        } else {
          setVerifyError(res?.message || 'This invitation link is invalid or has expired.');
        }
      } catch (err) {
        setVerifyError(err.message || 'Unable to verify invitation. The link may have expired.');
      } finally {
        setVerifying(false);
      }
    };

    checkInvitation();
  }, [token, email]);

  // Password rule checks
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasLetters && hasNumbers && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasLetters || !hasNumbers) {
      setFormError('Password must contain both letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.setPassword({
        token,
        email: invitation?.email || email,
        password
      });

      if (res && (res.status === 'success' || res.authenticated)) {
        // Update local session
        const rawUser = res.data?.user || {
          email: invitation?.email || email,
          role: invitation?.role || 'Member',
          name: invitation?.name || 'Member'
        };

        const activeUser = setCurrentUser ? setCurrentUser(rawUser) : rawUser;
        const assignedRole = String(activeUser?.role || rawUser.role || invitation?.role || 'Member').trim();
        const roleLower = assignedRole.toLowerCase();

        // Identify assigned role and determine role-specific dashboard:
        // Trainer -> Trainer Dashboard (/dashboard/trainer)
        // Member -> Member Dashboard (/dashboard/member)
        // Staff -> Staff Dashboard (/dashboard/staff)
        let targetPath = '/dashboard/member';
        let dashboardName = 'Member Dashboard';

        if (roleLower.includes('trainer')) {
          targetPath = '/dashboard/trainer';
          dashboardName = 'Trainer Dashboard';
        } else if (roleLower.includes('staff') || roleLower.includes('manager')) {
          targetPath = '/dashboard/staff';
          dashboardName = 'Staff Dashboard';
        } else if (roleLower.includes('owner')) {
          targetPath = '/dashboard';
          dashboardName = 'Owner Dashboard';
        }

        setSuccessMessage(`Password set successfully! Redirecting directly to your ${dashboardName}...`);

        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 1200);
      } else {
        throw new Error(res?.message || 'Account activation failed.');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to activate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF8F5 0%, #F0EDE5 100%)',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8E5DC',
        boxShadow: '0 8px 32px rgba(201, 162, 39, 0.12)',
        overflow: 'hidden'
      }}>
        {/* Header Ribbon */}
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, #C9A227 0%, #E8D293 50%, #A67C00 100%)'
        }} />

        <div style={{ padding: '36px 32px' }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(201, 162, 39, 0.3)'
            }}>
              A
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#242424', margin: 0, letterSpacing: '-0.3px' }}>
                AURUM GYM
              </h1>
              <span style={{ fontSize: '0.78rem', color: '#A67C00', fontWeight: '600' }}>
                Management System
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#242424', margin: '0 0 6px 0' }}>
            Set Your Password
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#707070', margin: '0 0 24px 0' }}>
            Complete your invitation and activate your account to access your role dashboard.
          </p>

          {/* Verification Loading State */}
          {verifying && (
            <div style={{ padding: '36px 0', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #E8E5DC',
                borderTopColor: '#C9A227',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ fontSize: '0.88rem', color: '#707070', margin: 0 }}>
                Verifying your invitation credentials with Zoho Catalyst...
              </p>
            </div>
          )}

          {/* Verification Error */}
          {!verifying && verifyError && (
            <div style={{
              padding: '18px',
              borderRadius: '12px',
              background: '#FEEBEA',
              border: '1px solid #FFA39E',
              color: '#CF1322',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CF1322" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <strong style={{ fontSize: '0.92rem' }}>Invitation Unavailable</strong>
              </div>
              <p style={{ fontSize: '0.84rem', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                {verifyError}
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#C9A227',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                Return to Home
              </Link>
            </div>
          )}

          {/* Invitation Details & Password Form */}
          {!verifying && !verifyError && (
            <div>
              {/* Invitee Card */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: '#FAF6ED',
                border: '1px solid #E8D293',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#A67C00', fontWeight: '700' }}>
                    Invited Role
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#C9A227',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: '700'
                  }}>
                    {invitation?.role || 'Member'}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#242424' }}>
                  {invitation?.name || 'New Member'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#707070' }}>
                  {invitation?.email || email}
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#EDF7EE',
                  border: '1px solid #B7EB8F',
                  color: '#237804',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  marginBottom: '18px'
                }}>
                  {successMessage}
                </div>
              )}

              {/* Form Error */}
              {formError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#FEEBEA',
                  border: '1px solid #FFA39E',
                  color: '#CF1322',
                  fontSize: '0.84rem',
                  marginBottom: '18px'
                }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '6px' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E8E5DC',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#707070',
                        fontSize: '0.76rem',
                        fontWeight: '600'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '6px' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E8E5DC',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#707070',
                        fontSize: '0.76rem',
                        fontWeight: '600'
                      }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#F8F8F6',
                  fontSize: '0.76rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ color: hasMinLength ? '#237804' : '#707070', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{hasMinLength ? '✓' : '○'}</span>
                    <span>At least 8 characters long</span>
                  </div>
                  <div style={{ color: (hasLetters && hasNumbers) ? '#237804' : '#707070', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{(hasLetters && hasNumbers) ? '✓' : '○'}</span>
                    <span>Contains letters and numbers</span>
                  </div>
                  <div style={{ color: passwordsMatch ? '#237804' : '#707070', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{passwordsMatch ? '✓' : '○'}</span>
                    <span>Passwords match</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || !isFormValid}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isFormValid ? 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)' : '#E8E5DC',
                    color: isFormValid ? '#FFFFFF' : '#999890',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    border: 'none',
                    cursor: (submitting || !isFormValid) ? 'not-allowed' : 'pointer',
                    boxShadow: isFormValid ? '0 4px 12px rgba(201, 162, 39, 0.25)' : 'none',
                    marginTop: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submitting ? 'Activating Account...' : 'Set Password & Access Portal'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
