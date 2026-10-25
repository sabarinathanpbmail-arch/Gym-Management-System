import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { InviteModal } from '../components/modals/AuthModals';

export const Members = () => {
  const { role, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [actionNotice, setActionNotice] = useState({ type: '', text: '' });

  const [newMemberData, setNewMemberData] = useState({
    user_first_name: '',
    user_last_name: '',
    user_email: '',
    user_phone: '',
    fitness_goals: '',
    medical_notes: '',
    emergency_contact: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'Trainer') params.trainer_id = user?.ROWID;
      const [memRes, trainRes] = await Promise.all([
        api.members.getAll(params),
        api.trainers.getAll()
      ]);
      setMembers(Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []));
      setTrainers(Array.isArray(trainRes.data) ? trainRes.data : (Array.isArray(trainRes) ? trainRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.members.create(newMemberData);
      setShowAddModal(false);
      setNewMemberData({
        user_first_name: '',
        user_last_name: '',
        user_email: '',
        user_phone: '',
        fitness_goals: '',
        medical_notes: '',
        emergency_contact: ''
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await api.members.update(selectedMember.ROWID, {
        assigned_trainer_id: selectedTrainerId
      });
      setShowAssignModal(false);
      setSelectedMember(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.members.delete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const currentGym = getGymDisplayName(user, null);
  const visibleMembers = (Array.isArray(members) ? members : []).filter(m => {
    if (!currentGym) return true;
    const mGym = getGymDisplayName(m, user);
    return isSameGym(mGym, currentGym);
  });
  const visibleTrainers = (Array.isArray(trainers) ? trainers : []).filter(t => {
    if (!currentGym) return true;
    const tGym = getGymDisplayName(t, user);
    return isSameGym(tGym, currentGym);
  });

  const filteredMembers = visibleMembers.filter(m => {
    const q = search.toLowerCase();
    const name = `${m.user_first_name || m.name || ''} ${m.user_last_name || ''}`.toLowerCase();
    const email = (m.user_email || m.email || '').toLowerCase();
    const phone = (m.user_phone || m.phone || '');
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px'
          }}>
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #E8E5DC',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999890"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#707070' }}>
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
          </span>
        </div>

        {(role === 'Owner' || role === 'Staff') && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(201, 162, 39, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>✉️</span>
              <span>Invite Member (via Email)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#242424',
                fontWeight: '600',
                fontSize: '0.84rem',
                border: '1px solid #E8E5DC',
                cursor: 'pointer'
              }}
            >
              + Quick Add
            </button>
          </div>
        )}
      </div>
      {actionNotice.text && (
        <div id="membersActionNotice" style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: actionNotice.type === 'success' ? 'linear-gradient(135deg, #F6FFED 0%, #EDF7EE 100%)' : '#FEEBEA',
          border: `1.5px solid ${actionNotice.type === 'success' ? '#52C41A' : '#FFA39E'}`,
          color: actionNotice.type === 'success' ? '#237804' : '#CF1322',
          fontSize: '0.86rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          boxShadow: actionNotice.type === 'success' ? '0 3px 10px rgba(82, 196, 26, 0.12)' : 'none'
        }}>
          <span style={{ fontSize: '1.1rem' }}>{actionNotice.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Members Data Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#FAF9F5', borderBottom: '1px solid #E8E5DC', color: '#707070', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <th style={{ padding: '14px 16px' }}>Member Name</th>
              <th style={{ padding: '14px 16px' }}>Contact</th>
              <th style={{ padding: '14px 16px' }}>Assigned Coach</th>
              <th style={{ padding: '14px 16px' }}>Fitness Goals</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              {role === 'Owner' && <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#707070' }}>Loading members...</td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#707070' }}>No members match your search criteria.</td>
              </tr>
            ) : (
              filteredMembers.map(m => {
                const assignedCoach = trainers.find(t => String(t.ROWID) === String(m.assigned_trainer_id));
                return (
                  <tr key={m.ROWID} style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#242424' }}>
                        {m.user_first_name} {m.user_last_name}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '2px' }}>
                        {getGymDisplayName(m, user)}
                      </div>
                      {m.medical_notes && (
                        <span style={{ fontSize: '0.7rem', color: '#CF1322' }}>
                          Medical: {m.medical_notes}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A' }}>
                      <div>{m.user_email}</div>
                      <div style={{ fontSize: '0.76rem', color: '#707070' }}>{m.user_phone || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {assignedCoach ? (
                        <span style={{ fontWeight: '600', color: '#A67C00' }}>
                          {assignedCoach.user_first_name} {assignedCoach.user_last_name}
                        </span>
                      ) : (
                        <span style={{ color: '#999890', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A', maxWidth: '240px' }}>
                      {m.fitness_goals || 'General Fitness'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge status={m.user_status} />
                    </td>
                    {role === 'Owner' && (
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(m);
                              setSelectedTrainerId(m.assigned_trainer_id || '');
                              setShowAssignModal(true);
                            }}
                            style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid #E8E5DC', background: '#FFFFFF', color: '#A67C00', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Assign Coach
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.ROWID)}
                            style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: '6px', border: '1px solid #FFA39E', background: '#FEEBEA', color: '#CF1322', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Member" subtitle="Create member record in Data Store">
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>First Name *</label>
              <input type="text" required value={newMemberData.user_first_name} onChange={e => setNewMemberData({ ...newMemberData, user_first_name: e.target.value })} placeholder="e.g. Rachel" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Last Name</label>
              <input type="text" value={newMemberData.user_last_name} onChange={e => setNewMemberData({ ...newMemberData, user_last_name: e.target.value })} placeholder="e.g. Green" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Email Address *</label>
              <input type="email" required value={newMemberData.user_email} onChange={e => setNewMemberData({ ...newMemberData, user_email: e.target.value })} placeholder="rachel@example.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Phone Number</label>
              <input type="tel" value={newMemberData.user_phone} onChange={e => setNewMemberData({ ...newMemberData, user_phone: e.target.value })} placeholder="+1 555-0188" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Fitness Goals</label>
            <input type="text" value={newMemberData.fitness_goals} onChange={e => setNewMemberData({ ...newMemberData, fitness_goals: e.target.value })} placeholder="e.g. Weight loss, Half marathon training" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Medical Conditions / Notes</label>
            <input type="text" value={newMemberData.medical_notes} onChange={e => setNewMemberData({ ...newMemberData, medical_notes: e.target.value })} placeholder="e.g. Asthma, Knee surgery (recovering)" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', border: 'none' }}>
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Coach Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Coach to Member" subtitle={`Assign trainer for ${selectedMember?.user_first_name} ${selectedMember?.user_last_name}`}>
        <form onSubmit={handleAssignTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Select Trainer *</label>
            <select required value={selectedTrainerId} onChange={e => setSelectedTrainerId(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
              <option value="">-- No Coach (Unassigned) --</option>
              {visibleTrainers.map(t => (
                <option key={t.ROWID} value={t.ROWID}>{t.user_first_name || t.name} {t.user_last_name || ''} ({t.fitness_goals || 'Coach'})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', border: 'none' }}>
              Update Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Email Invitation Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        defaultRole="Member"
        onUserInvited={(result, invitedData) => {
          loadData();
          setActionNotice({
            type: 'success',
            text: `Invitation sent successfully to ${invitedData?.email || 'member'}!`
          });
          setTimeout(() => setActionNotice({ type: '', text: '' }), 6000);
        }}
      />
    </div>
  );
};
