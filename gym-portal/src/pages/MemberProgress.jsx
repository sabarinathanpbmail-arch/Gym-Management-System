import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { ProgressModal } from '../components/modals/OperationModals';
import {
  DEFAULT_WORKOUT_DAYS,
  getSavedWorkoutProgress,
  saveWorkoutProgress,
  calculateWorkoutStats,
  parseWorkoutScheduleDays
} from '../services/workoutProgress';

export const MemberProgress = () => {
  const { role, user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [notice, setNotice] = useState('');

  const rawRole = String(role || user?.role || user?.user_role || '').trim().toLowerCase();
  const isMember = rawRole === 'member';
  const canManage = !isMember || rawRole === 'owner' || rawRole === 'trainer' || rawRole === 'admin' || rawRole === 'staff';

  const currentId = user?.ROWID || user?.id || 'member';

  // Real-time synced completed sessions — defaults strictly to {} (0%)
  const [completedSessions, setCompletedSessions] = useState(() => getSavedWorkoutProgress(user));

  useEffect(() => {
    setCompletedSessions(getSavedWorkoutProgress(user));
    const handleProgressUpdate = (e) => {
      if (e?.detail?.completedSessions) {
        setCompletedSessions(e.detail.completedSessions);
      } else {
        setCompletedSessions(getSavedWorkoutProgress(user));
      }
    };
    window.addEventListener('gym_workout_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('gym_workout_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [user]);

  const toggleSession = (index) => {
    const updated = { ...completedSessions, [index]: !completedSessions[index] };
    setCompletedSessions(updated);
    saveWorkoutProgress(user, updated);
    const isNowDone = !!updated[index];
    const stats = calculateWorkoutStats(updated, totalDays);
    setNotice(isNowDone
      ? `Day ${index + 1} marked completed! Workout progression is now ${stats.percentage}%.`
      : `Day ${index + 1} marked pending. Workout progression is now ${stats.percentage}%.`
    );
    setTimeout(() => setNotice(''), 3000);
  };

  const markNextSession = (totalDays = 5) => {
    for (let i = 0; i < totalDays; i++) {
      if (!completedSessions[i]) {
        toggleSession(i);
        return;
      }
    }
    // If all completed, notify user
    setNotice(`🎉 Outstanding! All ${totalDays} scheduled sessions completed this week!`);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (isMember && currentId) params.member_id = String(currentId);

      const [prgRes, wkRes, memRes, trainRes] = await Promise.all([
        api.progress.getAll(params),
        api.workouts.getAll().catch(() => ({ data: [] })),
        api.members.getAll().catch(() => ({ data: [] })),
        api.trainers.getAll().catch(() => ({ data: [] }))
      ]);

      const rawProgress = Array.isArray(prgRes.data) ? prgRes.data : (Array.isArray(prgRes) ? prgRes : []);
      const rawWorkouts = Array.isArray(wkRes.data) ? wkRes.data : (Array.isArray(wkRes) ? wkRes : []);
      const safeMem = Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []);
      const safeTrainers = Array.isArray(trainRes.data) ? trainRes.data : (Array.isArray(trainRes) ? trainRes : []);

      const currentGym = getGymDisplayName(user, null);
      const visibleMembers = safeMem.filter(m => {
        if (!currentGym) return true;
        const mGym = getGymDisplayName(m, user);
        return isSameGym(mGym, currentGym);
      });
      const visibleTrainers = safeTrainers.filter(t => {
        if (!currentGym) return true;
        const tGym = getGymDisplayName(t, user);
        return isSameGym(tGym, currentGym);
      });

      // Filter member progress
      const filteredProgress = rawProgress.filter(p => {
        if (isMember && currentId) {
          const mId = String(p.prog_member_id || p.memberId || '').trim();
          const idMatch = mId === String(currentId).trim();
          const nameMatch = user?.name && p.memberName && String(p.memberName).toLowerCase() === String(user.name).toLowerCase();
          const emailMatch = user?.email && p.memberEmail && String(p.memberEmail).toLowerCase() === String(user.email).toLowerCase();
          return idMatch || nameMatch || emailMatch;
        }
        if (!currentGym) return true;
        const mId = String(p.prog_member_id || p.memberId || '').trim();
        if (mId) {
          if (visibleMembers.some(m => String(m.ROWID) === mId)) return true;
          if (safeMem.some(m => String(m.ROWID) === mId)) return false;
        }
        const pGym = p.gymName || p.gym_name;
        if (pGym && !['Aurum Fitness Club', 'Fitness Club', 'Fitness Center'].includes(pGym)) {
          return isSameGym(pGym, currentGym);
        }
        return visibleMembers.length > 0 ? false : true;
      });

      // Filter member workouts
      const filteredWorkouts = rawWorkouts.filter(w => {
        if (isMember && currentId) {
          const mId = String(w.workout_member_id || w.memberId || '').trim();
          const idMatch = mId === String(currentId).trim();
          const nameMatch = user?.name && (w.memberName || w.workout_member_name) && String(w.memberName || w.workout_member_name).toLowerCase() === String(user.name).toLowerCase();
          return idMatch || nameMatch;
        }
        if (!currentGym) return true;
        const mId = String(w.workout_member_id || w.memberId || '').trim();
        const tId = String(w.workout_trainer_id || w.trainerId || '').trim();
        if (mId) {
          if (visibleMembers.some(m => String(m.ROWID) === mId)) return true;
          if (safeMem.some(m => String(m.ROWID) === mId)) return false;
        }
        if (tId) {
          if (visibleTrainers.some(t => String(t.ROWID) === tId)) return true;
          if (safeTrainers.some(t => String(t.ROWID) === tId)) return false;
        }
        const wGym = w.gymName || w.gym_name;
        if (wGym && !['Aurum Fitness Club', 'Fitness Club', 'Fitness Center'].includes(wGym)) {
          return isSameGym(wGym, currentGym);
        }
        return (visibleMembers.length > 0 || visibleTrainers.length > 0) ? false : true;
      });

      // Sort progress descending by date or ROWID
      filteredProgress.sort((a, b) => {
        const dateA = a.recordedDate || a.prog_record_date || '';
        const dateB = b.recordedDate || b.prog_record_date || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return String(b.ROWID || '').localeCompare(String(a.ROWID || ''));
      });

      setProgress(filteredProgress);
      setWorkouts(filteredWorkouts);
      setMembers(visibleMembers);
      setTrainers(visibleTrainers);
    } catch (err) {
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this fitness progress assessment? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      await api.progress.delete(id);
      setNotice('Assessment log deleted successfully!');
      setTimeout(() => setNotice(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete progress log');
    } finally {
      setDeletingId(null);
    }
  };

  // Resolve assigned workout for Member
  const activeWorkout = workouts.length > 0 ? workouts[0] : {
    title: '5 Day of Strength Training',
    workout_title: '5 Day of Strength Training',
    goal: 'Focus on Core',
    workout_description: 'Focus on Core',
    trainerName: trainers.length > 0 ? (trainers[0].name || `${trainers[0].user_first_name || ''} ${trainers[0].user_last_name || ''}`.trim()) : 'Personal Coach',
    difficulty: 'Intermediate',
    schedule: 'Test',
    workout_schedule: 'Test'
  };

  const scheduleDays = parseWorkoutScheduleDays(activeWorkout?.workout_schedule || activeWorkout?.schedule);
  const totalDays = scheduleDays.length;
  const workoutStats = calculateWorkoutStats(completedSessions, totalDays);
  const completedCount = workoutStats.completedCount;
  const progressPercent = workoutStats.percentage;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '20px 24px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              {isMember ? 'My Fitness Progression & Workout Tracker' : 'Member Fitness Assessments & Progress Logs'}
            </h2>
            <span style={{ fontSize: '0.74rem', background: '#FAF6ED', color: '#A67C00', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', border: '1px solid #E8D293' }}>
              Data Store Verified
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#707070', margin: '4px 0 0 0' }}>
            {isMember
              ? 'Track daily workout routine split completion, strength milestones, and verified biometric body assessments'
              : 'Monitor athlete training adherence and record anthropometric progression'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowProgressModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(201, 162, 39, 0.28)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {isMember ? '+ Log Biometric Assessment' : '+ Log Progress Assessment'}
        </button>
      </div>

      {notice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: '#EDF7EE',
          color: '#237804',
          border: '1px solid #B7EB8F',
          fontSize: '0.86rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span>
          <span>{notice}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: WORKOUT PROGRESS & ROUTINE TRACKING (For Member)
          ========================================================================= */}
      {isMember && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8E5DC',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F0EDE5', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏋️‍♂️</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                  Assigned Workout Progress & Training Split
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#707070', margin: 0 }}>
                Program: <strong style={{ color: '#242424' }}>{activeWorkout?.workout_title || activeWorkout?.title || '5 Day Strength Split'}</strong>
                {activeWorkout?.trainerName && ` • Assigned by Coach: ${activeWorkout.trainerName}`}
                {activeWorkout?.difficulty && ` • Level: ${activeWorkout.difficulty}`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => markNextSession(totalDays)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#242424',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>✓</span> Mark Today's Session Completed
              </button>
            </div>
          </div>

          {/* Metric Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            margin: '20px 0'
          }}>
            <div style={{ padding: '14px 18px', background: '#FBF9F2', borderRadius: '12px', border: '1px solid #EEDBB2' }}>
              <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Goal / Focus</span>
              <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#A67C00', marginTop: '4px' }}>
                {activeWorkout?.workout_description || activeWorkout?.goal || 'Focus on Core & Strength'}
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: '#F8F8F6', borderRadius: '12px', border: '1px solid #E8E5DC' }}>
              <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Weekly Completion</span>
              <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#242424', marginTop: '4px' }}>
                {completedCount} of {totalDays} Sessions Done
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: '#F8F8F6', borderRadius: '12px', border: '1px solid #E8E5DC' }}>
              <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Active Streak</span>
              <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#237804', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🔥</span> {completedCount}-Day Consistency
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: '#F8F8F6', borderRadius: '12px', border: '1px solid #E8E5DC' }}>
              <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Progression Rate</span>
              <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#C9A227', marginTop: '4px' }}>
                {progressPercent}% Complete
              </div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div style={{ padding: '16px 20px', background: '#FAF9F5', borderRadius: '12px', border: '1px solid #F0EDE5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#242424' }}>
                Weekly Training Split Adherence
              </span>
              <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#A67C00' }}>
                {progressPercent}% Completed
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#E8E5DC', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #52C41A 0%, #389E0D 100%)'
                  : 'linear-gradient(90deg, #C9A227 0%, #52C41A 100%)',
                borderRadius: '6px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#707070', marginTop: '6px' }}>
              <span>Day 1: Kickoff</span>
              <span>{completedCount === totalDays ? '✓ Routine Complete for the Week!' : `${totalDays - completedCount} sessions remaining`}</span>
              <span>Day {totalDays}: Split Complete</span>
            </div>
          </div>

          {/* Daily Split Checklist */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#242424', margin: '0 0 12px 0' }}>
              Routine Schedule & Daily Check-Off:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scheduleDays.map((day, idx) => {
                const isDone = !!completedSessions[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSession(idx)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: isDone ? '#F6FFED' : '#FFFFFF',
                      border: isDone ? '1px solid #B7EB8F' : '1px solid #E8E5DC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isDone ? '#52C41A' : '#FFFFFF',
                        border: isDone ? 'none' : '2px solid #D9D9D9',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '800'
                      }}>
                        {isDone ? '✓' : ''}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: isDone ? '#237804' : '#242424' }}>
                          {day.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#707070', marginTop: '2px' }}>
                          {day.focus} {day.target ? `• ${day.target}` : ''}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: isDone ? '#D9F7BE' : '#F5F5F5',
                        color: isDone ? '#237804' : '#595959'
                      }}>
                        {isDone ? 'Session Done ✓' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: BIOMETRIC PROGRESS ASSESSMENTS
          ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: '800', color: '#242424', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Biometric Progress Assessments
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#707070', margin: '2px 0 0 0' }}>
              {isMember
                ? 'Completed body composition metrics recorded directly in Catalyst Data Store'
                : 'Athlete anthropometric logs, body fat measurements, and milestone notes'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowProgressModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#FAF6ED',
              color: '#A67C00',
              border: '1px solid #E8D293',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> {isMember ? 'Complete New Assessment' : 'Log Assessment'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#707070' }}>Loading progress assessments...</div>
        ) : (!Array.isArray(progress) || progress.length === 0) ? (
          <div style={{ padding: '44px 24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', color: '#707070' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📈</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', fontWeight: '800', color: '#242424' }}>
              {isMember ? 'No completed biometric assessments recorded yet.' : 'No progress assessments recorded yet.'}
            </h4>
            <p style={{ margin: '0 auto 18px auto', fontSize: '0.84rem', color: '#707070', maxWidth: '480px' }}>
              {isMember
                ? 'Once you or your trainer complete a body composition check-in, your verified weight, body fat %, muscle mass, and measurements will be displayed right here.'
                : 'Log an athlete biometric assessment to start tracking fitness milestones.'}
            </p>
            <button
              type="button"
              onClick={() => setShowProgressModal(true)}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.86rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(201, 162, 39, 0.28)'
              }}
            >
              + Complete First Biometric Assessment
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
            {progress.map((p, idx) => {
              const member = Array.isArray(members) ? members.find(m => String(m.ROWID) === String(p.prog_member_id || p.memberId)) : null;
              const athleteName = (() => {
                if (member) {
                  return member.name || `${member.user_first_name || ''} ${member.user_last_name || ''}`.trim() || `Member #${member.ROWID}`;
                }
                if (p.memberName && p.memberName !== 'Member') return p.memberName;
                if (p.prog_member_name && p.prog_member_name !== 'Member') return p.prog_member_name;
                const mid = p.prog_member_id || p.memberId;
                if (mid && mid !== 'null' && mid !== 'undefined' && String(mid).trim() !== '') return `Member #${mid}`;
                return user?.name || 'Member';
              })();

              const isThisDeleting = deletingId === p.ROWID;
              const weightStr = p.prog_weight || (p.weightKg ? `${p.weightKg} kg` : '-');
              const bodyFatStr = p.prog_body_fat || (p.bodyFatPercentage ? `${p.bodyFatPercentage}%` : '-');
              const muscleStr = p.prog_muscle_mass || (p.chestCm ? `${p.chestCm} cm` : '-');
              const waistStr = p.waistCm ? `${p.waistCm} cm` : (p.prog_waist || '-');
              const armsStr = p.armsCm ? `${p.armsCm} cm` : (p.prog_arms || '-');

              // Trend calculation relative to next item (which is older since sorted desc)
              const previousLog = progress[idx + 1];
              let weightDiff = null;
              if (previousLog && p.weightKg && previousLog.weightKg) {
                const diff = (p.weightKg - previousLog.weightKg).toFixed(1);
                weightDiff = diff > 0 ? `+${diff} kg` : `${diff} kg`;
              }

              return (
                <div
                  key={p.ROWID || Math.random()}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E8E5DC',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F0EDE5', paddingBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                          {athleteName}
                        </h4>
                        <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                          {getGymDisplayName(member, user)}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#707070' }}>
                          Assessment Date: <strong>{p.prog_record_date || p.recordedDate || 'Recent'}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', background: '#EDF7EE', color: '#237804', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', border: '1px solid #B7EB8F' }}>
                          Completed ✓
                        </span>

                        {canManage && (
                          <button
                            type="button"
                            disabled={isThisDeleting}
                            onClick={() => handleDelete(p.ROWID)}
                            title="Delete progress log"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#FFF1F0',
                              border: '1px solid #FFA39E',
                              color: '#CF1322',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: isThisDeleting ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {isThisDeleting ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '14px' }}>
                      <div style={{ padding: '10px 8px', background: '#F8F8F6', borderRadius: '10px', textAlign: 'center', border: '1px solid #F0EDE5' }}>
                        <span style={{ fontSize: '0.68rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Weight</span>
                        <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#242424', marginTop: '2px' }}>
                          {weightStr}
                        </div>
                        {weightDiff && (
                          <div style={{ fontSize: '0.66rem', color: weightDiff.startsWith('-') ? '#237804' : '#A67C00', fontWeight: '700', marginTop: '2px' }}>
                            {weightDiff}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '10px 8px', background: '#F8F8F6', borderRadius: '10px', textAlign: 'center', border: '1px solid #F0EDE5' }}>
                        <span style={{ fontSize: '0.68rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Body Fat</span>
                        <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#A67C00', marginTop: '2px' }}>
                          {bodyFatStr}
                        </div>
                      </div>

                      <div style={{ padding: '10px 8px', background: '#F8F8F6', borderRadius: '10px', textAlign: 'center', border: '1px solid #F0EDE5' }}>
                        <span style={{ fontSize: '0.68rem', color: '#707070', textTransform: 'uppercase', fontWeight: '700' }}>Muscle/Chest</span>
                        <div style={{ fontSize: '1.02rem', fontWeight: '800', color: '#237804', marginTop: '2px' }}>
                          {muscleStr}
                        </div>
                      </div>
                    </div>

                    {/* Additional Anthropometrics (Waist & Arms) */}
                    {(waistStr !== '-' || armsStr !== '-') && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#FAF9F5',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        border: '1px solid #F0EDE5'
                      }}>
                        <div>
                          <span style={{ color: '#707070' }}>Waist Circumference: </span>
                          <strong style={{ color: '#242424' }}>{waistStr}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#707070' }}>Arms / Biceps: </span>
                          <strong style={{ color: '#242424' }}>{armsStr}</strong>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {(p.prog_notes || p.notes) && (
                      <div style={{ fontSize: '0.8rem', color: '#4A4A4A', background: '#FAF9F5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F0EDE5', marginTop: '10px', lineHeight: 1.5 }}>
                        <strong style={{ color: '#242424' }}>Assessment Notes:</strong> {p.prog_notes || p.notes}
                      </div>
                    )}
                  </div>

                  <div style={{
                    paddingTop: '8px',
                    borderTop: '1px solid #F0EDE5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: '#999890'
                  }}>
                    <span>Record #{p.ROWID}</span>
                    <span style={{ color: '#237804', fontWeight: '600' }}>✓ Verified Assessment</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        members={isMember ? [{ ROWID: user?.ROWID || user?.id, name: user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member', user_email: user?.email }] : members}
        trainerId={user?.ROWID}
        onProgressLogged={async () => {
          setNotice('Biometric assessment completed successfully and recorded in My Progress!');
          setTimeout(() => setNotice(''), 4500);
          await loadData();
        }}
      />
    </div>
  );
};
