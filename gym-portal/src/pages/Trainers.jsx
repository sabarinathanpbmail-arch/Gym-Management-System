import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { InviteModal } from '../components/modals/AuthModals';

export const Trainers = () => {
  const { user, role } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionNotice, setActionNotice] = useState({ type: '', text: '' });

  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phone: '',
    fitness_goals: 'Strength & Conditioning Specialist',
    medical_notes: 'CPR & First Aid Certified'
  });

  const currentGym = getGymDisplayName(user, null);
  const visibleTrainers = trainers.filter(t => {
    if (!currentGym) return true;
    const tGym = getGymDisplayName(t, user);
    return isSameGym(tGym, currentGym);
  });

  const loadTrainers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.trainers.getAll();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTrainers(list);
    } catch (err) {
      console.error('Error loading coaches roster:', err);
      setError(err.message || 'Unable to retrieve coaching staff roster from Catalyst Data Store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    setActionNotice({ type: '', text: '' });
    try {
      await api.trainers.create(newTrainer);
      setShowAddModal(false);
      setNewTrainer({
        name: '',
        email: '',
        phone: '',
        fitness_goals: 'Strength & Conditioning Specialist',
        medical_notes: 'CPR & First Aid Certified'
      });
      setActionNotice({ type: 'success', text: 'New coach registered successfully!' });
      setTimeout(() => setActionNotice({ type: '', text: '' }), 4000);
      loadTrainers();
    } catch (err) {
      alert(err.message || 'Failed to add coach');
    }
  };

  const handleDeleteTrainer = async (t) => {
    const trainerName = t.name || `${t.user_first_name || ''} ${t.user_last_name || ''}`.trim() || 'this coach';
    if (!window.confirm(`Are you sure you want to remove ${trainerName} from coaching staff?`)) return;
    setDeletingId(t.ROWID);
    try {
      await api.trainers.delete(t.ROWID);
      setActionNotice({ type: 'success', text: `Coach ${trainerName} removed successfully.` });
      setTimeout(() => setActionNotice({ type: '', text: '' }), 4000);
      loadTrainers();
    } catch (err) {
      alert(err.message || 'Failed to remove trainer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '18px 24px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#242424', margin: 0 }}>
            Coaching & Personal Training Staff
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#707070', margin: '3px 0 0 0' }}>
            {visibleTrainers.length} registered {visibleTrainers.length === 1 ? 'coach' : 'coaches'} guiding facility athletes
          </p>
        </div>

        {role === 'Owner' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#242424',
                fontWeight: '700',
                fontSize: '0.84rem',
                border: '1px solid #E8E5DC',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✉️ Invite Coach
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(201, 162, 39, 0.25)'
              }}
            >
              + Add Coach Directly
            </button>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionNotice.text && (
        <div id="trainersActionNotice" style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: actionNotice.type === 'success' ? 'linear-gradient(135deg, #F6FFED 0%, #EDF7EE 100%)' : '#FEEBEA',
          border: `1.5px solid ${actionNotice.type === 'success' ? '#52C41A' : '#FFA39E'}`,
          color: actionNotice.type === 'success' ? '#237804' : '#CF1322',
          fontSize: '0.88rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(82, 196, 26, 0.12)',
          animation: 'slideIn 0.3s ease'
        }}>
          <span style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: actionNotice.type === 'success' ? '#52C41A' : '#CF1322',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>{actionNotice.type === 'success' ? '✓' : '!'}</span>
          <span style={{ flex: 1 }}>{actionNotice.text}</span>
          <button
            type="button"
            onClick={() => setActionNotice({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', color: actionNotice.type === 'success' ? '#237804' : '#CF1322', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Error State with Retry Action */}
      {error && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #FFA39E',
          padding: '28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '1.8rem' }}>⚠️</div>
          <h4 style={{ margin: 0, color: '#CF1322', fontSize: '1.05rem', fontWeight: '700' }}>
            Unable to Load Trainers
          </h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#707070', maxWidth: '460px' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={loadTrainers}
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#C9A227',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E8E5DC',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E8E5DC',
            borderTopColor: '#C9A227',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '0.86rem', color: '#707070', fontWeight: '600' }}>
            Retrieving coaches from Catalyst Data Store...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && visibleTrainers.length === 0 && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px dashed #D4CDBE',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#FAF6ED',
            color: '#A67C00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            border: '1px solid #E8D293'
          }}>
            🏋️
          </div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#242424' }}>
            No Coaching Staff Registered Yet
          </h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#707070', maxWidth: '420px', lineHeight: 1.5 }}>
            Invite experienced personal trainers or register them directly to assign athletes, design workout splits, and track member progress.
          </p>
          {role === 'Owner' && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✉️ Send Trainer Invitation
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E8E5DC',
                  color: '#242424',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                + Add Coach
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success State: Roster Grid */}
      {!loading && !error && visibleTrainers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {visibleTrainers.map(t => {
            const displayName = (t.name || `${t.user_first_name || ''} ${t.user_last_name || ''}`).trim() || 'Trainer Coach';
            const initial = (t.user_first_name ? t.user_first_name.charAt(0) : (t.name ? t.name.charAt(0) : 'T')).toUpperCase();
            const displayEmail = t.user_email || t.email || 'No email registered';
            const displayPhone = t.user_phone || t.phone || '+1 555-0100';
            const displayStatus = t.user_status || t.status || 'Active';
            const assignedCount = t.assignedMembersCount || 0;

            return (
              <div
                key={t.ROWID || t.email}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E8E5DC',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: '#FAF6ED',
                        color: '#A67C00',
                        fontWeight: '800',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E8D293',
                        boxShadow: '0 2px 6px rgba(201, 162, 39, 0.12)'
                      }}>
                        {initial}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.02rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                          {displayName}
                        </h4>
                        <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                          {getGymDisplayName(t, user)}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#707070', fontWeight: '500' }}>
                          {t.fitness_goals || 'Certified Personal Coach'}
                        </span>
                      </div>
                    </div>
                    <Badge status={displayStatus} />
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#4A4A4A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📧</span>
                      <span>{displayEmail}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📱</span>
                      <span>{displayPhone}</span>
                    </div>
                    {t.emergencyContact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#707070' }}>
                        <span>🏢</span>
                        <span>{t.emergencyContact}</span>
                      </div>
                    )}
                    {t.medical_notes && (
                      <div style={{ color: '#237804', fontSize: '0.76rem', marginTop: '2px', fontWeight: '600' }}>
                        🏅 {t.medical_notes}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid #F0EDE5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424' }}>
                    {assignedCount} Assigned {assignedCount === 1 ? 'Athlete' : 'Athletes'}
                  </span>
                  {role === 'Owner' && (
                    <button
                      type="button"
                      disabled={deletingId === t.ROWID}
                      onClick={() => handleDeleteTrainer(t)}
                      style={{
                        fontSize: '0.74rem',
                        color: '#CF1322',
                        background: 'none',
                        border: 'none',
                        cursor: deletingId === t.ROWID ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {deletingId === t.ROWID ? 'Removing...' : 'Remove Coach'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Direct Trainer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Gym Coach" subtitle="Register coach directly into gym records">
        <form onSubmit={handleAddTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Full Name *</label>
            <input
              type="text"
              required
              value={newTrainer.name}
              onChange={e => setNewTrainer({ ...newTrainer, name: e.target.value })}
              placeholder="e.g. Marcus Vance"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Email Address *</label>
              <input
                type="email"
                required
                value={newTrainer.email}
                onChange={e => setNewTrainer({ ...newTrainer, email: e.target.value })}
                placeholder="trainer@gympro.com"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Phone</label>
              <input
                type="tel"
                value={newTrainer.phone}
                onChange={e => setNewTrainer({ ...newTrainer, phone: e.target.value })}
                placeholder="+1 555-0145"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Specialization & Focus</label>
            <input
              type="text"
              value={newTrainer.fitness_goals}
              onChange={e => setNewTrainer({ ...newTrainer, fitness_goals: e.target.value })}
              placeholder="e.g. Strength & Conditioning Specialist, CSCS"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Certifications</label>
            <input
              type="text"
              value={newTrainer.medical_notes}
              onChange={e => setNewTrainer({ ...newTrainer, medical_notes: e.target.value })}
              placeholder="e.g. Certified Nutritionist, CPR & First Aid"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)', color: '#FFF', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
              Register Coach
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Coach Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        defaultRole="Trainer"
        onUserInvited={(result, invitedData) => {
          loadTrainers();
          setActionNotice({
            type: 'success',
            text: `Invitation sent successfully to ${invitedData?.email || 'coach'} as Trainer!`
          });
          setTimeout(() => setActionNotice({ type: '', text: '' }), 6000);
        }}
      />
    </div>
  );
};
