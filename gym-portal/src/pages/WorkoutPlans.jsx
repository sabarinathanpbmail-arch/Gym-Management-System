import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { WorkoutModal } from '../components/modals/OperationModals';

export const WorkoutPlans = () => {
  const { role, user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      const currentId = user?.ROWID || user?.id;
      if (role === 'Member' && currentId) params.member_id = String(currentId);
      if (role === 'Trainer' && currentId) params.trainer_id = String(currentId);

      const [wkRes, memRes, trainRes] = await Promise.all([
        api.workouts.getAll(params),
        api.members.getAll(),
        api.trainers.getAll()
      ]);
      const rawWorkouts = Array.isArray(wkRes.data) ? wkRes.data : (Array.isArray(wkRes) ? wkRes : []);
      const fetchedMembers = Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []);
      const fetchedTrainers = Array.isArray(trainRes.data) ? trainRes.data : (Array.isArray(trainRes) ? trainRes : []);

      const currentGym = getGymDisplayName(user, null);
      const visibleMembers = fetchedMembers.filter(m => {
        if (!currentGym) return true;
        const mGym = getGymDisplayName(m, user);
        return isSameGym(mGym, currentGym);
      });
      const visibleTrainers = fetchedTrainers.filter(t => {
        if (!currentGym) return true;
        const tGym = getGymDisplayName(t, user);
        return isSameGym(tGym, currentGym);
      });

      // Filter workouts to current gym
      const gymWorkouts = rawWorkouts.filter(w => {
        if (role === 'Member' && currentId) {
          const mId = String(w.workout_member_id || w.memberId || '').trim();
          return mId === String(currentId).trim() || !mId;
        }
        if (!currentGym) return true;
        const mId = String(w.workout_member_id || w.memberId || '').trim();
        const tId = String(w.workout_trainer_id || w.trainerId || '').trim();
        if (mId) {
          if (visibleMembers.some(m => String(m.ROWID) === mId)) return true;
          if (fetchedMembers.some(m => String(m.ROWID) === mId)) return false;
        }
        if (tId) {
          if (visibleTrainers.some(t => String(t.ROWID) === tId)) return true;
          if (fetchedTrainers.some(t => String(t.ROWID) === tId)) return false;
        }
        const wGym = w.gymName || w.gym_name;
        if (wGym && !['Aurum Fitness Club', 'Fitness Club', 'Fitness Center'].includes(wGym)) {
          return isSameGym(wGym, currentGym);
        }
        return (visibleMembers.length > 0 || visibleTrainers.length > 0) ? false : true;
      });

      setWorkouts(gymWorkouts);
      setMembers(visibleMembers);
      setTrainers(visibleTrainers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout routine?')) return;
    try {
      await api.workouts.delete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: 0 }}>
            {role === 'Member' ? 'My Assigned Workout Programs' : 'Athlete Workout Routines & Splits'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#707070', margin: '2px 0 0 0' }}>
            Custom training splits, compound lifts, and cardio conditioning plans
          </p>
        </div>

        {(role === 'Owner' || role === 'Trainer') && (
          <button
            type="button"
            onClick={() => setShowWorkoutModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: '#C9A227',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(201, 162, 39, 0.25)'
            }}
          >
            + Create Workout Plan
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#707070' }}>Loading workout plans...</div>
      ) : (!Array.isArray(workouts) || workouts.length === 0) ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8E5DC', color: '#707070' }}>
          No workout plans assigned yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {(Array.isArray(workouts) ? workouts : []).map(w => {
            const member = Array.isArray(members) ? members.find(m => String(m.ROWID) === String(w.workout_member_id || w.memberId)) : null;
            const coach = Array.isArray(trainers) ? trainers.find(t => String(t.ROWID) === String(w.workout_trainer_id || w.trainerId)) : null;

            const athleteName = (() => {
              if (member) {
                return member.name || `${member.user_first_name || ''} ${member.user_last_name || ''}`.trim() || `Member #${member.ROWID}`;
              }
              if (w.memberName && w.memberName !== 'Member') return w.memberName;
              if (w.workout_member_name && w.workout_member_name !== 'Member') return w.workout_member_name;
              const mid = w.workout_member_id || w.memberId;
              if (mid && mid !== 'null' && mid !== 'undefined' && String(mid).trim() !== '') return `Member #${mid}`;
              return 'Assigned Athlete';
            })();

            const coachName = (() => {
              if (coach) {
                return coach.name || `${coach.user_first_name || ''} ${coach.user_last_name || ''}`.trim() || 'Facility Trainer';
              }
              if (w.trainerName && w.trainerName !== 'Trainer') return w.trainerName;
              if (w.workout_trainer_name && w.workout_trainer_name !== 'Trainer') return w.workout_trainer_name;
              return 'Facility Trainer';
            })();

            return (
              <div
                key={w.ROWID}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E8E5DC',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <Badge status={w.workout_status || 'Active'} />
                    <span style={{ fontSize: '0.74rem', color: '#707070', textAlign: 'right' }}>
                      Athlete: <strong>{athleteName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#A67C00', fontWeight: '700', marginTop: '1px' }}>
                        {getGymDisplayName(member, user)}
                      </div>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#242424', margin: '4px 0' }}>
                    {w.workout_title}
                  </h4>

                  {w.workout_description && (
                    <p style={{ fontSize: '0.82rem', color: '#A67C00', fontWeight: '600', margin: '0 0 12px 0' }}>
                      Focus: {w.workout_description}
                    </p>
                  )}

                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#F8F8F6',
                    border: '1px solid #F0EDE5',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    color: '#242424',
                    whiteSpace: 'pre-line'
                  }}>
                    {w.workout_schedule}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F0EDE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#707070' }}>
                    Coach: <strong>{coachName}</strong>
                  </span>

                  {(role === 'Owner' || role === 'Trainer') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(w.ROWID)}
                      style={{ fontSize: '0.74rem', color: '#CF1322', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WorkoutModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        members={members}
        trainerId={user?.ROWID}
        trainerName={user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim()}
        onWorkoutCreated={loadData}
      />
    </div>
  );
};
