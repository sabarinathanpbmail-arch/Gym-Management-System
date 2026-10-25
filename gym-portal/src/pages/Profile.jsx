import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const Profile = () => {
  const { user, role, logout, updateGymName } = useAuth();
  const [isEditingGym, setIsEditingGym] = useState(false);
  const [gymInput, setGymInput] = useState('');
  const [savingGym, setSavingGym] = useState(false);
  const [gymSuccess, setGymSuccess] = useState('');
  const [gymError, setGymError] = useState('');

  const getRolePermissions = () => {
    switch (role) {
      case 'Owner':
        return [
          { feature: 'Dashboard & Revenue Analytics', allowed: true },
          { feature: 'Member Management & Invitations', allowed: true },
          { feature: 'Trainer Assignment & Roster', allowed: true },
          { feature: 'Membership Plan Configuration', allowed: true },
          { feature: 'Financial Transactions & Ledger', allowed: true },
          { feature: 'Daily Facility Attendance Logs', allowed: true },
          { feature: 'Role Provisioning & Settings', allowed: true }
        ];
      case 'Trainer':
        return [
          { feature: 'Assigned Members Profile View', allowed: true },
          { feature: 'Workout Routines & Splits', allowed: true },
          { feature: 'Biometric Progress Logging', allowed: true },
          { feature: 'Financial & Revenue Ledger', allowed: false },
          { feature: 'Plan Price Administration', allowed: false },
          { feature: 'Global User Deletion', allowed: false }
        ];
      case 'Member':
        return [
          { feature: 'Personal Profile & Goals', allowed: true },
          { feature: 'Active Plan & Expiry Date', allowed: true },
          { feature: 'Personal Attendance History', allowed: true },
          { feature: 'Assigned Workout Split', allowed: true },
          { feature: 'Progress & Body Metrics', allowed: true },
          { feature: 'Administrative Controls', allowed: false }
        ];
      case 'Staff':
      default:
        return [
          { feature: 'Front Desk Daily Attendance', allowed: true },
          { feature: 'Member Directory Lookup', allowed: true },
          { feature: 'New Member Registration', allowed: true },
          { feature: 'Membership Issue & Renewal', allowed: true },
          { feature: 'Financial Ledger & Reports', allowed: false },
          { feature: 'Trainer Wage & Admin Settings', allowed: false }
        ];
    }
  };

  const permissions = getRolePermissions();

  const displayName = user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Gym Member';
  const displayEmail = user?.email || user?.user_email || '';
  const displayPhone = user?.phone || user?.user_phone || 'Not Provided';
  const displayStatus = user?.status || user?.user_status || 'Active';
  const displayRole = user?.role || user?.user_role || role || 'Member';
  const isOwner = /^owner$/i.test(displayRole) || /^owner$/i.test(role || '');
  const displayEmergency = user?.emergencyContact || user?.emergency_contact || 'None Listed';
  const displayJoined = user?.joinedDate || user?.joined_date || 'Active Member';
  const displayTrainer = user?.assignedTrainer || user?.assigned_trainer || 'None Assigned';
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'M';

  const userFirst = user?.user_first_name || (displayName ? displayName.split(' ')[0] : '');
  let displayGym = user?.gymName || user?.gym_name;
  if (!isOwner && displayGym && userFirst && displayGym.toLowerCase() === `${userFirst.toLowerCase()} fitness`) {
    displayGym = null;
  }
  const gymDisplayName = displayGym || (isOwner && userFirst ? `${userFirst} Fitness` : 'Sabari Fitness');

  const handleStartEditGym = () => {
    setGymInput(gymDisplayName);
    setGymSuccess('');
    setGymError('');
    setIsEditingGym(true);
  };

  const handleSaveGym = async (e) => {
    e.preventDefault();
    if (!gymInput.trim()) {
      setGymError('Please enter a valid gym name.');
      return;
    }
    setSavingGym(true);
    setGymError('');
    setGymSuccess('');
    try {
      await updateGymName(gymInput.trim());
      setGymSuccess('Gym name successfully updated!');
      setTimeout(() => {
        setIsEditingGym(false);
        setGymSuccess('');
      }, 1500);
    } catch (err) {
      setGymError(err.message || 'Failed to update gym name.');
    } finally {
      setSavingGym(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      {/* Profile Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(201, 162, 39, 0.3)'
          }}>
            {avatarInitial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                {displayName}
              </h3>
              <Badge status={displayStatus} />
            </div>

            {/* Dynamic Gym Name & Edit Button */}
            <div style={{
              fontSize: '0.88rem',
              fontWeight: '800',
              color: '#A67C00',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span>🏋️‍♂️</span>
                <span>{gymDisplayName}</span>
              </span>

              {isOwner && !isEditingGym && (
                <button
                  type="button"
                  onClick={handleStartEditGym}
                  title="Customize your Gym / Facility Name"
                  style={{
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '0.72rem',
                    background: '#FAF6ED',
                    color: '#A67C00',
                    border: '1px solid #E8D293',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  ✏️ Edit Gym Name
                </button>
              )}
            </div>

            {/* Inline Gym Name Edit Form for Owner */}
            {isOwner && isEditingGym && (
              <form onSubmit={handleSaveGym} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={gymInput}
                  onChange={(e) => setGymInput(e.target.value)}
                  placeholder="Enter your gym name"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #C9A227',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: '#242424',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingGym}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#237804',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: savingGym ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingGym ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGym(false)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#F0EDE5',
                    color: '#555',
                    border: 'none',
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                {gymSuccess && (
                  <span style={{ fontSize: '0.74rem', color: '#237804', fontWeight: '700' }}>✓ {gymSuccess}</span>
                )}
                {gymError && (
                  <span style={{ fontSize: '0.74rem', color: '#CF1322', fontWeight: '700' }}>⚠️ {gymError}</span>
                )}
              </form>
            )}

            <p style={{ fontSize: '0.82rem', color: '#707070', margin: '4px 0 0 0' }}>
              {displayEmail} {displayPhone !== 'Not Provided' ? `• ${displayPhone}` : ''}
            </p>
            <div style={{ marginTop: '6px' }}>
              <span style={{ fontSize: '0.74rem', background: '#FAF6ED', color: '#A67C00', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                Role: {displayRole}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: '1px solid #FFA39E',
            background: '#FEEBEA',
            color: '#CF1322',
            fontWeight: '700',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          Sign Out of Account
        </button>
      </div>

      {/* Account Details & Role Permissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Account Details */}
        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
          <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#242424', margin: '0 0 16px 0' }}>
            Account Metadata
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
              <span style={{ color: '#707070' }}>Data Store Record ID</span>
              <span style={{ fontWeight: '700', color: '#242424' }}>#{user?.ROWID || user?.id || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
              <span style={{ color: '#707070' }}>Primary Specialty / Goals</span>
              <span style={{ fontWeight: '600', color: '#242424' }}>{user?.fitness_goals || 'Strength & Conditioning'}</span>
            </div>
            {displayTrainer !== 'None Assigned' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
                <span style={{ color: '#707070' }}>Assigned Coach</span>
                <span style={{ fontWeight: '600', color: '#A67C00' }}>{displayTrainer}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
              <span style={{ color: '#707070' }}>Joined Date</span>
              <span style={{ fontWeight: '600', color: '#242424' }}>{displayJoined}</span>
            </div>
            {user?.medical_notes && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
                <span style={{ color: '#707070' }}>Medical / Health Notes</span>
                <span style={{ fontWeight: '600', color: '#CF1322' }}>{user.medical_notes}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EDE5', paddingBottom: '8px' }}>
              <span style={{ color: '#707070' }}>Emergency Contact</span>
              <span style={{ fontWeight: '600', color: '#242424' }}>{displayEmergency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#707070' }}>Security Mode</span>
              <span style={{ fontWeight: '700', color: '#237804' }}>Catalyst Authentication</span>
            </div>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
          <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#242424', margin: '0 0 16px 0' }}>
            Authorized Permissions ({role})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {permissions.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: '#4A4A4A' }}>{p.feature}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '0.7rem',
                  background: p.allowed ? '#EDF7EE' : '#FEEBEA',
                  color: p.allowed ? '#237804' : '#CF1322'
                }}>
                  {p.allowed ? '✓ Authorized' : '✕ Restricted'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
