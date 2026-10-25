import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth, getGymDisplayName, isSameGym } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const { login, verifyOwnerOtp, resendOwnerOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // OTP Verification state for unverified owners trying to log in
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setOtp('');
    setNeedsOtp(false);
    setError('');
    setInfoMessage('');
    setLoading(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const loginRes = await login(email, password);
      handleModalClose();

      const userRole = String(loginRes?.user?.role || loginRes?.user?.user_role || 'Member').toLowerCase();
      if (userRole.includes('trainer')) {
        navigate('/dashboard/trainer');
      } else if (userRole.includes('staff') || userRole.includes('manager')) {
        navigate('/dashboard/staff');
      } else if (userRole.includes('member')) {
        navigate('/dashboard/member');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'OWNER_OTP_REQUIRED' || (err.message && err.message.includes('OTP verification'))) {
        setNeedsOtp(true);
        setInfoMessage('Your Gym Owner account requires OTP verification before login. Please enter the verification code sent to your email.');
        setResendCooldown(30);
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOwnerOtp(email, cleanOtp);
      setInfoMessage('Account verified successfully! Entering Gym Owner Dashboard...');
      setTimeout(() => {
        handleModalClose();
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      const res = await resendOwnerOtp(email);
      setInfoMessage(res?.message || 'A new verification code has been dispatched.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={needsOtp ? 'Verify Gym Owner OTP' : 'Sign In to Gym Portal'}
      subtitle={needsOtp ? 'Complete one-time verification to access Owner Dashboard' : 'Access your authorized role dashboard'}
      maxWidth="460px"
    >
      {needsOtp ? (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}
          {infoMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FAF6ED', border: '1px solid #E8D293', color: '#874D00', fontSize: '0.82rem' }}>
              {infoMessage}
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>
              Verifying owner account for: <br />
              <strong style={{ color: '#242424' }}>{email}</strong>
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '8px', textAlign: 'center' }}>
              6-Digit Verification Code *
            </label>
            <input
              type="text"
              required
              maxLength="6"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              style={{
                width: '100%',
                padding: '14px 12px',
                borderRadius: '10px',
                border: '2px solid #C9A227',
                fontSize: '1.8rem',
                fontWeight: '800',
                letterSpacing: '8px',
                textAlign: 'center',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#FFFDF9'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: otp.length === 6 ? 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)' : '#DDD',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              boxShadow: otp.length === 6 ? '0 4px 12px rgba(201, 162, 39, 0.25)' : 'none',
              marginTop: '4px'
            }}
          >
            {loading ? 'Verifying OTP...' : 'Verify & Enter Dashboard'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#707070', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setNeedsOtp(false)}
              style={{ background: 'none', border: 'none', color: '#707070', cursor: 'pointer', padding: 0 }}
            >
              ← Back to Sign In
            </button>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendOtp}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? '#999' : '#C9A227',
                fontWeight: '700',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                padding: 0
              }}
            >
              {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '6px' }}>
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aurugym@gmail.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E8E5DC',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (optional for registered demo users)"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E8E5DC',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(201, 162, 39, 0.25)',
              marginTop: '4px'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#707070', marginTop: '4px' }}>
            New Gym Owner?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              style={{ color: '#C9A227', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Create Owner Account
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export const OwnerSignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { signupOwner, verifyOwnerOtp, resendOwnerOtp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gymName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setStep('form');
    setOtp('');
    setError('');
    setInfoMessage('');
    setLoading(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (formData.password && (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password))) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    setLoading(true);
    try {
      const res = await signupOwner(formData);
      setStep('otp');
      setResendCooldown(60);
      setInfoMessage(res?.message || `A verification code has been sent to ${formData.email}. Please check your email inbox.`);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOwnerOtp(formData.email, cleanOtp);
      setStep('success');
      setTimeout(() => {
        handleModalClose();
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      const res = await resendOwnerOtp(formData.email);
      setInfoMessage(res?.message || `A new verification code has been dispatched to ${formData.email}. Please check your inbox.`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={step === 'otp' ? 'Verify Owner Account' : (step === 'success' ? 'Account Verified!' : 'Create Gym Owner Account')}
      subtitle={step === 'otp' ? 'Enter the 6-digit verification code' : (step === 'success' ? 'Welcome to Aurum Gym Management' : 'Owner registration & security verification')}
      maxWidth={step === 'otp' ? '480px' : '520px'}
    >
      {step === 'form' && (
        <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <div style={{ padding: '8px 12px', background: '#FAF6ED', border: '1px solid #E8D293', borderRadius: '8px', fontSize: '0.76rem', color: '#A67C00' }}>
            ℹ️ Registration requires email OTP verification. Once verified, you can access the Gym Owner Dashboard and invite team members.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>First Name *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="e.g. Sabari" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Nathan" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Gym / Facility Name *</label>
            <input type="text" name="gymName" required value={formData.gymName} onChange={handleChange} placeholder="e.g. Spartan Fitness Center" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Work Email Address *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="owner@aurumgym.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Contact Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0199" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Password * (min. 8 characters, letters & numbers)</label>
            <input type="password" name="password" required minLength="8" value={formData.password} onChange={handleChange} placeholder="At least 8 chars with letters & numbers" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(201, 162, 39, 0.25)',
              marginTop: '8px'
            }}
          >
            {loading ? 'Creating Account...' : 'Continue to OTP Verification →'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#707070' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{ color: '#C9A227', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign In here
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FAF6ED', border: '1px solid #E8D293', color: '#874D00', fontSize: '0.82rem' }}>
              {infoMessage}
            </div>
          )}



          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <span style={{ fontSize: '0.86rem', color: '#555' }}>
              Enter the 6-digit verification code sent to:<br />
              <strong style={{ color: '#242424' }}>{formData.email}</strong>
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#242424', marginBottom: '8px', textAlign: 'center' }}>
              6-Digit Code
            </label>
            <input
              type="text"
              required
              maxLength="6"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              style={{
                width: '100%',
                padding: '14px 12px',
                borderRadius: '10px',
                border: '2px solid #C9A227',
                fontSize: '1.9rem',
                fontWeight: '800',
                letterSpacing: '8px',
                textAlign: 'center',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#FFFDF9'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: otp.length === 6 ? 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)' : '#DDD',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              boxShadow: otp.length === 6 ? '0 4px 12px rgba(201, 162, 39, 0.25)' : 'none',
              marginTop: '4px'
            }}
          >
            {loading ? 'Verifying OTP...' : 'Verify & Activate Owner Access'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#707070', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setStep('form')}
              style={{ background: 'none', border: 'none', color: '#707070', cursor: 'pointer', padding: 0 }}
            >
              ← Edit Account Details
            </button>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendOtp}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? '#999' : '#C9A227',
                fontWeight: '700',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                padding: 0
              }}
            >
              {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EDF7EE', color: '#52C41A', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            ✓
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#242424', margin: '0 0 8px 0' }}>Account Verified!</h3>
          <p style={{ fontSize: '0.88rem', color: '#666', margin: 0 }}>
            Your Gym Owner account is verified and active. Redirecting to your Owner Dashboard...
          </p>
        </div>
      )}
    </Modal>
  );
};

export const InviteModal = ({ isOpen, onClose, onUserInvited, defaultRole = 'Member' }) => {
  const { user } = useAuth();
  const currentGymName = getGymDisplayName(user, null) || 'Sabari Fitness';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: defaultRole || 'Member',
    gymName: currentGymName,
    assignedTrainer: '',
    fitnessGoals: '',
    emergencyContact: ''
  });
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitationResult, setInvitationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch trainers for optional coach assignment when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setCopied(false);
      setFormData(prev => ({
        ...prev,
        role: defaultRole || prev.role || 'Member',
        gymName: currentGymName || prev.gymName || ''
      }));
      api.trainers.getAll()
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setTrainers(list);
        })
        .catch(() => setTrainers([]));
    } else {
      // Only clear invitation result when modal is closed
      setInvitationResult(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentGym = currentGymName || user?.gymName || user?.gym_name;
  const filteredTrainers = trainers.filter(t => {
    if (!currentGym) return true;
    const tGym = getGymDisplayName(t, user);
    return isSameGym(tGym, currentGym);
  });

  const handleCopyLink = () => {
    const url = invitationResult?.invitation?.setPasswordUrl || '';
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.inviteUser(formData);
      const resData = res.data || res;
      setInvitationResult(resData);
      if (onUserInvited) onUserInvited(resData, formData);
    } catch (err) {
      setError(err.message || 'Invitation failed. Please verify the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvitationResult(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: defaultRole || 'Member',
      gymName: currentGymName,
      assignedTrainer: '',
      fitnessGoals: '',
      emergencyContact: ''
    });
    onClose();
  };

  const isDelivered = Boolean(
    invitationResult?.emailDelivered === true ||
    invitationResult?.emailDelivery?.delivered === true ||
    invitationResult?.data?.emailDelivery?.delivered === true
  );
  const emailDeliveryInfo =
    invitationResult?.emailDelivery ||
    invitationResult?.data?.emailDelivery ||
    {};
  const setPasswordLink =
    invitationResult?.invitation?.setPasswordUrl ||
    invitationResult?.data?.invitation?.setPasswordUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={invitationResult ? "" : "Invite Team or Member"}
      subtitle={invitationResult ? "" : "Owner-controlled role provisioning flow"}
      maxWidth={invitationResult ? "440px" : "540px"}
      hideHeader={Boolean(invitationResult)}
    >
      {invitationResult ? (
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '12px 8px 8px 8px',
          textAlign: 'center'
        }}>
          {/* Scoped Keyframe Animations */}
          <style>{`
            @keyframes inviteSuccessPop {
              0% {
                transform: scale(0.3);
                opacity: 0;
              }
              60% {
                transform: scale(1.15);
                opacity: 1;
              }
              80% {
                transform: scale(0.95);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @keyframes inviteCheckDraw {
              0% {
                stroke-dashoffset: 40;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }

            @keyframes inviteTextFade {
              0% {
                opacity: 0;
                transform: translateY(10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes invitePulseGlow {
              0%, 100% {
                box-shadow: 0 4px 16px rgba(82, 196, 26, 0.25);
              }
              50% {
                box-shadow: 0 8px 28px rgba(82, 196, 26, 0.45);
              }
            }
          `}</style>

          {/* Close 'X' Button in Top Right */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#F8F8F6',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#707070',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >
            ×
          </button>

          {/* Right (Checkmark) Icon with Pop & Glow Animation */}
          <div
            id="invitationSuccessIcon"
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'inviteSuccessPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, invitePulseGlow 2.2s infinite',
              boxShadow: '0 6px 22px rgba(82, 196, 26, 0.35)',
              margin: '8px auto 0 auto'
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 40,
                strokeDashoffset: 0,
                animation: 'inviteCheckDraw 0.45s ease-in-out forwards'
              }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Invitation Send Successfully Text */}
          <div style={{ textAlign: 'center', animation: 'inviteTextFade 0.4s ease 0.15s both' }}>
            <h3
              id="invitationSuccessTitle"
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: '#1F1F1F',
                margin: '0 0 6px 0',
                letterSpacing: '-0.2px'
              }}
            >
              Invitation send successfully
            </h3>
            <p
              id="invitationSuccessSubtitle"
              style={{
                fontSize: '0.88rem',
                color: '#666666',
                margin: 0,
                lineHeight: 1.4
              }}
            >
              Invitation sent to <strong style={{ color: '#242424' }}>{formData.email}</strong> as <strong style={{ color: '#C9A227' }}>{formData.role}</strong>
            </p>
          </div>

          {/* Action Done Button */}
          <button
            id="inviteDoneBtn"
            type="button"
            onClick={handleClose}
            style={{
              marginTop: '8px',
              padding: '10px 38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(201, 162, 39, 0.25)',
              animation: 'inviteTextFade 0.4s ease 0.25s both',
              transition: 'transform 0.15s ease'
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {error && (
            <div id="inviteErrorAlert" style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="inviteFirstName" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '3px' }}>First Name *</label>
              <input id="inviteFirstName" type="text" name="firstName" required autoFocus value={formData.firstName} onChange={handleChange} placeholder="e.g. Liam" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label htmlFor="inviteLastName" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '3px' }}>Last Name</label>
              <input id="inviteLastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Stone" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label htmlFor="inviteEmail" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Email Address *</label>
            <input id="inviteEmail" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="user@example.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="inviteRole" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Assign Role *</label>
              <select id="inviteRole" name="role" required value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
                <option value="Member">Member</option>
                <option value="Trainer">Trainer (Coach)</option>
                <option value="Staff">Staff / Operations</option>
              </select>
            </div>
            <div>
              <label htmlFor="invitePhone" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>Phone</label>
              <input id="invitePhone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0123" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Conditional field for Member: Assign Trainer */}
          {formData.role === 'Member' && filteredTrainers.length > 0 && (
            <div>
              <label htmlFor="inviteTrainer" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>
                Assign Coach / Trainer (Optional)
              </label>
              <select
                id="inviteTrainer"
                name="assignedTrainer"
                value={formData.assignedTrainer}
                onChange={handleChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
              >
                <option value="">-- No Coach Assigned Yet --</option>
                {filteredTrainers.map(t => (
                  <option key={t.ROWID || t.email} value={t.ROWID || t.name}>
                    {t.name || `${t.user_first_name} ${t.user_last_name}`} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="inviteGoals" style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#242424', marginBottom: '4px' }}>
              {formData.role === 'Trainer' ? 'Specialization & Certifications' : 'Fitness Goals / Notes'}
            </label>
            <input
              id="inviteGoals"
              type="text"
              name="fitnessGoals"
              value={formData.fitnessGoals}
              onChange={handleChange}
              placeholder={formData.role === 'Trainer' ? 'e.g. NASM-CPT, Hypertrophy, Olympic Lifting' : 'e.g. Hypertrophy, Strength, Cardio Endurance'}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button id="inviteCancelBtn" type="button" onClick={handleClose} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFFFFF', color: '#707070', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              id="inviteSubmitBtn"
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(201, 162, 39, 0.25)'
              }}
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
