import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { api, getLocalISTTime, getLocalISTDate } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { InviteModal } from '../components/modals/AuthModals';
import { PlanModal, SubscriptionModal, PaymentModal, WorkoutModal, ProgressModal } from '../components/modals/OperationModals';
import {
  DEFAULT_WORKOUT_DAYS,
  getSavedWorkoutProgress,
  saveWorkoutProgress,
  calculateWorkoutStats,
  parseWorkoutScheduleDays
} from '../services/workoutProgress';

export const Dashboard = ({ forcedRole }) => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [progress, setProgress] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invitationNotice, setInvitationNotice] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressNotice, setProgressNotice] = useState('');

  // Quick check-in state
  const [checkInMemberId, setCheckInMemberId] = useState('');
  const [checkInNotice, setCheckInNotice] = useState('');

  // Workout progress real-time synchronization
  const [completedWorkoutSessions, setCompletedWorkoutSessions] = useState(() => getSavedWorkoutProgress(user));

  useEffect(() => {
    setCompletedWorkoutSessions(getSavedWorkoutProgress(user));
    const handleProgressUpdate = (e) => {
      if (e?.detail?.completedSessions) {
        setCompletedWorkoutSessions(e.detail.completedSessions);
      } else {
        setCompletedWorkoutSessions(getSavedWorkoutProgress(user));
      }
    };
    window.addEventListener('gym_workout_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('gym_workout_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [user]);

  const toArr = (res, key) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (key && Array.isArray(res?.data?.[key])) return res.data[key];
    if (key && Array.isArray(res?.[key])) return res[key];
    return [];
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, memRes, trainRes, planRes, subRes, payRes, attRes, wkRes, prgRes, invRes] = await Promise.all([
        api.dashboard.getStats().catch(() => ({ data: {} })),
        api.members.getAll().catch(() => ({ data: [] })),
        api.trainers.getAll().catch(() => ({ data: [] })),
        api.plans.getAll().catch(() => ({ data: [] })),
        api.subscriptions.getAll().catch(() => ({ data: [] })),
        api.payments.getAll().catch(() => ({ data: [] })),
        api.attendance.getAll().catch(() => ({ data: [] })),
        api.workouts.getAll().catch(() => ({ data: [] })),
        api.progress.getAll().catch(() => ({ data: [] })),
        api.auth.getInvitations().catch(() => ({ data: [] }))
      ]);

      setStats(statsRes?.data || statsRes || {});
      setMembers(toArr(memRes, 'members'));
      setTrainers(toArr(trainRes, 'trainers'));
      setPlans(toArr(planRes, 'plans'));
      setSubscriptions(toArr(subRes, 'subscriptions'));
      setPayments(toArr(payRes, 'payments'));
      setAttendance(toArr(attRes, 'attendance'));
      setWorkouts(toArr(wkRes, 'workouts'));
      setProgress(toArr(prgRes, 'progress'));
      setInvitations(toArr(invRes, 'invitations'));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInMemberId) return;
    try {
      const nowTime = getLocalISTTime();
      const nowDate = getLocalISTDate();
      await api.attendance.checkIn({
        memberId: checkInMemberId,
        att_member_id: checkInMemberId,
        checkInTime: nowTime,
        time: nowTime,
        attendanceDate: nowDate,
        att_date: nowDate
      });
      setCheckInNotice(`Check-in recorded successfully at ${nowTime}!`);
      setTimeout(() => setCheckInNotice(''), 3000);
      loadAllData();
    } catch (err) {
      setCheckInNotice(`Notice: ${err.message}`);
    }
  };

  const handleQuickCheckOut = async (recordId) => {
    try {
      const nowTime = getLocalISTTime();
      const nowDate = getLocalISTDate();
      await api.attendance.checkOut({
        ROWID: recordId,
        checkOutTime: nowTime,
        time: nowTime,
        attendanceDate: nowDate,
        att_date: nowDate
      });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResendInvite = async (email) => {
    try {
      const res = await api.auth.resendInvite(email);
      setInvitationNotice(`Invitation resent to ${email}!`);
      setTimeout(() => setInvitationNotice(''), 4000);
      loadAllData();
    } catch (err) {
      alert(`Resend failed: ${err.message}`);
    }
  };

  const handleCancelInvite = async (email) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) return;
    try {
      await api.auth.cancelInvite(email);
      setInvitationNotice(`Invitation for ${email} cancelled.`);
      setTimeout(() => setInvitationNotice(''), 4000);
      loadAllData();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', color: '#707070' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E8E5DC', borderTopColor: '#C9A227', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '0.88rem', fontWeight: '600' }}>Loading live gym records from Catalyst Data Store...</p>
      </div>
    );
  }

  // Safe normalized arrays scoped to active gym
  const gymDisplayName = getGymDisplayName(user, null) || stats?.gymName || 'Sabari Fitness';
  const rawMembers = Array.isArray(members) ? members : [];
  const rawTrainers = Array.isArray(trainers) ? trainers : [];
  const safeMembers = rawMembers.filter(m => !gymDisplayName || isSameGym(getGymDisplayName(m, user), gymDisplayName));
  const safeTrainers = rawTrainers.filter(t => !gymDisplayName || isSameGym(getGymDisplayName(t, user), gymDisplayName));
  const safePlans = Array.isArray(plans) ? plans : [];

  const safeSubscriptions = (Array.isArray(subscriptions) ? subscriptions : []).filter(s => {
    const sGym = s.gym_name || s.gymName;
    if (sGym && !isSameGym(sGym, gymDisplayName)) return false;
    const memId = String(s.sub_member_id || s.memberId || '');
    if (memId) {
      if (safeMembers.some(m => String(m.ROWID) === memId)) return true;
      if (rawMembers.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), gymDisplayName))) return false;
    }
    return true;
  });

  const safeAttendance = (Array.isArray(attendance) ? attendance : []).filter(a => {
    const aGym = a.gym_name || a.gymName;
    if (aGym && !isSameGym(aGym, gymDisplayName)) return false;
    const memId = String(a.att_member_id || a.memberId || '');
    if (memId) {
      if (safeMembers.some(m => String(m.ROWID) === memId)) return true;
      if (rawMembers.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), gymDisplayName))) return false;
    }
    return true;
  });

  const safeWorkouts = (Array.isArray(workouts) ? workouts : []).filter(w => {
    const wGym = w.gym_name || w.gymName;
    if (wGym && !isSameGym(wGym, gymDisplayName)) return false;
    const memId = String(w.workout_member_id || w.memberId || '');
    if (memId) {
      if (safeMembers.some(m => String(m.ROWID) === memId)) return true;
      if (rawMembers.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), gymDisplayName))) return false;
    }
    return true;
  });

  const safeProgress = (Array.isArray(progress) ? progress : []).filter(p => {
    const pGym = p.gym_name || p.gymName;
    if (pGym && !isSameGym(pGym, gymDisplayName)) return false;
    const memId = String(p.prog_member_id || p.memberId || '');
    if (memId) {
      if (safeMembers.some(m => String(m.ROWID) === memId)) return true;
      if (rawMembers.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), gymDisplayName))) return false;
    }
    return true;
  });

  const safePayments = (Array.isArray(payments) ? payments : []).filter(p => {
    const pGym = p.gym_name || p.gymName;
    if (pGym && !isSameGym(pGym, gymDisplayName)) return false;
    const memId = String(p.pay_member_id || p.memberId || '');
    if (memId) {
      if (safeMembers.some(m => String(m.ROWID) === memId)) return true;
      if (rawMembers.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), gymDisplayName))) return false;
    }
    return true;
  });

  // Filter personal data for Member role (never fallback to arbitrary subscription)
  const currentUserId = user?.ROWID || user?.id;
  const mySubscription = safeSubscriptions.find(s => 
    String(s.sub_member_id || s.memberId) === String(currentUserId) ||
    (s.memberEmail && user?.email && String(s.memberEmail).toLowerCase() === String(user?.email).toLowerCase()) ||
    (s.memberName && user?.name && String(s.memberName).toLowerCase() === String(user?.name).toLowerCase())
  );
  const myAttendance = safeAttendance.filter(a => 
    String(a.att_member_id || a.memberId) === String(currentUserId) ||
    (a.memberEmail && user?.email && String(a.memberEmail).toLowerCase() === String(user?.email).toLowerCase())
  );
  const myWorkouts = safeWorkouts.filter(w => 
    String(w.workout_member_id || w.memberId) === String(currentUserId) ||
    (w.memberName && user?.name && String(w.memberName).toLowerCase() === String(user?.name).toLowerCase()) ||
    (w.workout_member_name && user?.name && String(w.workout_member_name).toLowerCase() === String(user?.name).toLowerCase())
  );
  const myProgress = safeProgress.filter(p => 
    String(p.prog_member_id || p.memberId) === String(currentUserId) ||
    (p.memberName && user?.name && String(p.memberName).toLowerCase() === String(user?.name).toLowerCase())
  );

  // Active member workout resolution with reliable fallback
  const activeMemberWorkout = myWorkouts.length > 0 
    ? myWorkouts[0] 
    : {
        title: '5 Day of Strength Training',
        workout_title: '5 Day of Strength Training',
        goal: 'Focus on Core',
        workout_description: 'Focus on Core',
        trainerName: safeTrainers[0]?.name || `${safeTrainers[0]?.user_first_name || ''} ${safeTrainers[0]?.user_last_name || ''}`.trim() || 'Head Coach',
        difficulty: 'Intermediate',
        schedule: 'Test',
        workout_schedule: 'Test'
      };

  const memberScheduleDays = parseWorkoutScheduleDays(activeMemberWorkout?.workout_schedule || activeMemberWorkout?.schedule);
  const memberTotalDays = memberScheduleDays.length;
  const workoutStats = calculateWorkoutStats(completedWorkoutSessions, memberTotalDays);

  // Dynamically resolve assigned trainer for Member
  const currentMemberRecord = safeMembers.find(m => 
    String(m.ROWID) === String(user?.ROWID) ||
    (m.email && user?.email && String(m.email).toLowerCase() === String(user?.email).toLowerCase())
  );
  const trainerRawVal = String(
    currentMemberRecord?.assignedTrainer ||
    currentMemberRecord?.assigned_trainer ||
    currentMemberRecord?.assigned_trainer_id ||
    user?.assignedTrainer || 
    user?.assigned_trainer || 
    user?.assigned_trainer_id || 
    ''
  ).trim();

  const assignedTrainerObj = safeTrainers.find(t => 
    (trainerRawVal && String(t.ROWID) === trainerRawVal) ||
    (trainerRawVal && t.email && t.email.toLowerCase() === trainerRawVal.toLowerCase()) ||
    (trainerRawVal && t.name && t.name.toLowerCase() === trainerRawVal.toLowerCase()) ||
    (trainerRawVal && `${t.user_first_name || ''} ${t.user_last_name || ''}`.trim().toLowerCase() === trainerRawVal.toLowerCase())
  );

  let trainerDisplayName = 'Not Assigned';
  let trainerDisplaySubtitle = 'No coach assigned yet';

  if (assignedTrainerObj) {
    trainerDisplayName = assignedTrainerObj.name || `${assignedTrainerObj.user_first_name || ''} ${assignedTrainerObj.user_last_name || ''}`.trim() || 'Assigned Coach';
    trainerDisplaySubtitle = assignedTrainerObj.fitness_goals || assignedTrainerObj.specialization || 'Dedicated Personal Coach';
  } else if (trainerRawVal && trainerRawVal !== 'None' && trainerRawVal !== 'Self' && trainerRawVal !== 'null') {
    trainerDisplayName = trainerRawVal;
    trainerDisplaySubtitle = 'Dedicated Personal Coach';
  }

  // Filter assigned clients for Trainer role
  const myClients = safeMembers.filter(m => String(m.assigned_trainer_id || m.assignedTrainer) === String(user?.ROWID));
  const myCreatedWorkouts = safeWorkouts.filter(w => String(w.workout_trainer_id || w.trainerId) === String(user?.ROWID));

  // Trusted user role from authenticated profile (never trust URL or browser spoofing for non-owners)
  const userRole = String(role || user?.role || user?.user_role || 'Member').trim();
  const isUserOwner = /^owner$/i.test(userRole);

  // If user is Owner, they can inspect specific role dashboards; non-owners are locked to their verified profile role
  const currentRole = isUserOwner ? (forcedRole || 'Owner') : userRole;

  // Normalized Role Flags
  const isOwner = /^owner$/i.test(currentRole);
  const isTrainer = /^trainer$/i.test(currentRole);
  const isStaff = /^staff$|^manager$/i.test(currentRole);
  const isMember = /^member$/i.test(currentRole) || (!isOwner && !isTrainer && !isStaff);

  const dashboardTitle = isOwner
    ? 'Gym Owner Dashboard'
    : (isTrainer
      ? 'Trainer Dashboard'
      : (isStaff
        ? 'Staff Dashboard'
        : 'Member Dashboard'));

  const userDisplayName = (user?.user_first_name ? `${user.user_first_name} ${user.user_last_name || ''}`.trim() : (user?.name || (isTrainer ? 'Trainer' : (isStaff ? 'Staff' : 'Member'))));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Quick Actions */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', background: '#FAF6ED', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              {isOwner ? 'Gym Owner' : (isTrainer ? 'Trainer' : (isStaff ? 'Staff' : 'Member'))} Portal
            </span>
            <span style={{ fontSize: '0.82rem', color: '#999890' }}>
              Catalyst Live Services Active
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#242424', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            {dashboardTitle}
          </h1>
          <div style={{ marginTop: '6px' }}>
            <div style={{ fontSize: '0.94rem', color: '#4A4A4A', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span>Welcome back,</span>
              <strong style={{ color: '#242424', fontWeight: '800', fontSize: '1rem' }}>
                {userDisplayName}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#707070' }}>({user?.user_email || user?.email || ''})</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              fontWeight: '800',
              color: '#A67C00',
              background: '#FAF6ED',
              border: '1px solid #E8D293',
              padding: '2px 10px',
              borderRadius: '6px',
              marginTop: '5px',
              marginBottom: '5px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>🏋️‍♂️</span>
              <span>{gymDisplayName}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#707070', margin: '2px 0 0 0', lineHeight: 1.4 }}>
              • {isOwner && 'Manage facility operations, coaches, memberships, and real-time revenue.'}
              {isTrainer && 'Track your assigned athletes, design workouts, and record progress assessments.'}
              {isMember && 'View your active plan validity, daily check-in logs, workouts, and body metrics.'}
              {isStaff && 'Oversee front desk check-ins, member registrations, and active subscriptions.'}
            </p>
          </div>
        </div>

        {/* Role-Specific Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', fontSize: '0.84rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(201, 162, 39, 0.3)' }}
              >
                + Invite User
              </button>
              <button
                type="button"
                onClick={() => setShowPlanModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#FFFFFF', color: '#242424', fontWeight: '600', fontSize: '0.84rem', border: '1px solid #E8E5DC', cursor: 'pointer' }}
              >
                + Add Plan
              </button>
              <button
                type="button"
                onClick={() => setShowSubModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#FFFFFF', color: '#242424', fontWeight: '600', fontSize: '0.84rem', border: '1px solid #E8E5DC', cursor: 'pointer' }}
              >
                Assign Plan
              </button>
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#FFFFFF', color: '#242424', fontWeight: '600', fontSize: '0.84rem', border: '1px solid #E8E5DC', cursor: 'pointer' }}
              >
                Record Payment
              </button>
            </>
          )}

          {isTrainer && (
            <>
              <button
                type="button"
                onClick={() => setShowWorkoutModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', fontSize: '0.84rem', border: 'none', cursor: 'pointer' }}
              >
                + Create Workout
              </button>
              <button
                type="button"
                onClick={() => setShowProgressModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#FFFFFF', color: '#242424', fontWeight: '600', fontSize: '0.84rem', border: '1px solid #E8E5DC', cursor: 'pointer' }}
              >
                + Log Progress
              </button>
            </>
          )}

          {isStaff && (
            <>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', fontSize: '0.84rem', border: 'none', cursor: 'pointer' }}
              >
                + Register Member
              </button>
              <button
                type="button"
                onClick={() => setShowSubModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', background: '#FFFFFF', color: '#242424', fontWeight: '600', fontSize: '0.84rem', border: '1px solid #E8E5DC', cursor: 'pointer' }}
              >
                Issue Membership
              </button>
            </>
          )}
        </div>
      </div>

      {invitationNotice && (
        <div id="dashboardTopInvitationAlert" style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #F6FFED 0%, #EDF7EE 100%)',
          border: '1.5px solid #52C41A',
          color: '#237804',
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
            background: '#52C41A',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>✓</span>
          <span style={{ flex: 1 }}>{invitationNotice}</span>
          <button
            type="button"
            onClick={() => setInvitationNotice('')}
            style={{ background: 'none', border: 'none', color: '#237804', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW A: GYM OWNER DASHBOARD
          ========================================================================= */}
      {isOwner && (
        <>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              title="Total Members"
              value={stats?.totalMembers ?? safeMembers.length}
              subtitle="Registered athletes"
              trend="+12% vs last month"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              }
            />

            <StatCard
              title="Active Members"
              value={stats?.activeMembers ?? safeMembers.filter(m => (m.user_status || m.status) === 'Active').length}
              subtitle="With good standing"
              trend="100% active"
              isGold={true}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              }
            />

            <StatCard
              title="Total Revenue"
              value={`$${(stats?.totalRevenue ?? safePayments.reduce((sum, p) => sum + (parseFloat(p.pay_amount || p.amount) || 0), 0)).toLocaleString()}`}
              subtitle="Collected payments"
              trend="Verified ledger"
              isGold={true}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                </svg>
              }
            />

            <StatCard
              title="Expiring Soon"
              value={stats?.expiringSoonCount ?? 1}
              subtitle="Within 30 days"
              trend="Renewal action required"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              }
            />

            <StatCard
              title="Today's Attendance"
              value={stats?.todayAttendanceCount ?? safeAttendance.length}
              subtitle="Checked in at facility"
              trend="Real-time check-in"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              }
            />
          </div>

          {/* Two-Column Operational Views */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Recent Payments Ledger */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', margin: 0 }}>Recent Payments</h3>
                <span style={{ fontSize: '0.74rem', color: '#A67C00', fontWeight: '600' }}>Live Records</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safePayments.slice(0, 5).map(p => {
                  const member = safeMembers.find(m => String(m.ROWID) === String(p.pay_member_id || p.memberId));
                  return (
                    <div key={p.ROWID || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F8F8F6', borderRadius: '8px', border: '1px solid #F0EDE5' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#242424' }}>
                          {member ? `${member.user_first_name || member.name} ${member.user_last_name || ''}`.trim() : `Member #${p.pay_member_id || p.memberId || '1'}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#A67C00' }}>
                          {member?.gymName || member?.gym_name || gymDisplayName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#707070' }}>
                          {p.pay_date || p.paymentDate || 'Today'} • {p.pay_method || p.paymentMethod || 'Credit Card'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#237804' }}>
                          +${p.pay_amount || p.amount || 89}
                        </div>
                        <Badge status={p.pay_status || p.status || 'Paid'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance & Front Desk Feed */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', margin: 0 }}>Daily Attendance Activity</h3>
                <span style={{ fontSize: '0.74rem', color: '#707070' }}>Check-in / Check-out</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {safeAttendance.slice(0, 5).map(a => {
                  const member = safeMembers.find(m => String(m.ROWID) === String(a.att_member_id || a.memberId));
                  return (
                    <div key={a.ROWID || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F8F8F6', borderRadius: '8px', border: '1px solid #F0EDE5' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#242424' }}>
                          {member ? `${member.user_first_name || member.name} ${member.user_last_name || ''}`.trim() : `Member #${a.att_member_id || a.memberId || '1'}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#A67C00' }}>
                          {member?.gymName || member?.gym_name || gymDisplayName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#707070' }}>
                          In: {a.att_check_in || a.checkInTime || '08:00 AM'} {a.att_check_out && a.att_check_out !== '-' && `• Out: ${a.att_check_out}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge status={a.att_status || a.status || 'Present'} />
                        {((a.att_status === 'Present' || a.att_status === 'Checked In') && (a.att_check_out === 'In Session' || !a.att_check_out || a.att_check_out === '-')) && (
                          <button
                            type="button"
                            onClick={() => handleQuickCheckOut(a.ROWID)}
                            style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: '4px', background: '#FAF6ED', border: '1px solid #E8D293', color: '#A67C00', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Team & Member Invitations Tracker */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', margin: 0 }}>
                    Team & Member Invitations
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: '#FAF6ED', color: '#A67C00', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    Live Status
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#707070', margin: '2px 0 0 0' }}>
                  Track invitation delivery, resend activation credentials, and manage pending invites
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#FAF6ED',
                  border: '1px solid #E8D293',
                  color: '#A67C00',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                + Invite User
              </button>
            </div>

            {invitationNotice && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#EDF7EE', color: '#237804', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid #B7EB8F' }}>
                {invitationNotice}
              </div>
            )}

            {invitations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#707070', fontSize: '0.84rem' }}>
                No active invitations. Click <strong>+ Invite User</strong> to onboard a Trainer, Member, or Staff.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F0EDE5', textAlign: 'left', color: '#999890' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '600' }}>Invitee Name</th>
                      <th style={{ padding: '10px 12px', fontWeight: '600' }}>Email Address</th>
                      <th style={{ padding: '10px 12px', fontWeight: '600' }}>Assigned Role</th>
                      <th style={{ padding: '10px 12px', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '10px 12px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv, idx) => {
                      const status = (inv.status || inv.user_status || 'SENT').toUpperCase();
                      const email = inv.email || inv.user_email || '';
                      const name = inv.name || `${inv.user_first_name || ''} ${inv.user_last_name || ''}`.trim() || 'Invited User';
                      const roleName = inv.role || inv.user_role || 'Member';
                      return (
                        <tr key={email || idx} style={{ borderBottom: '1px solid #F8F8F6' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#242424' }}>
                            {name}
                          </td>
                          <td style={{ padding: '12px', color: '#4A4A4A' }}>
                            {email}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#FAF6ED',
                              color: '#A67C00',
                              fontWeight: '700',
                              fontSize: '0.74rem'
                            }}>
                              {roleName}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Badge status={status} />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              {status !== 'ACCEPTED' && status !== 'ACTIVE' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleResendInvite(email)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      background: '#C9A227',
                                      color: '#FFFFFF',
                                      fontSize: '0.74rem',
                                      fontWeight: '600',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Resend
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelInvite(email)}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      background: 'none',
                                      border: '1px solid #FFA39E',
                                      color: '#CF1322',
                                      fontSize: '0.74rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW B: TRAINER DASHBOARD
          ========================================================================= */}
      {isTrainer && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              title="My Assigned Members"
              value={myClients.length}
              subtitle="Active athletes under your coaching"
              isGold={true}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              }
            />
            <StatCard
              title="Workout Routines Created"
              value={myCreatedWorkouts.length}
              subtitle="Active training splits"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                </svg>
              }
            />
          </div>

          {/* Assigned Athletes List */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', marginBottom: '14px' }}>
              Your Assigned Members
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {myClients.map(c => {
                const clientWorkout = workouts.find(w => String(w.workout_member_id) === String(c.ROWID));
                const clientProgress = progress.filter(p => String(p.prog_member_id) === String(c.ROWID));
                return (
                  <div key={c.ROWID} style={{ padding: '16px', background: '#F8F8F6', borderRadius: '10px', border: '1px solid #E8E5DC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                          {c.user_first_name} {c.user_last_name}
                        </h4>
                        <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                          {c.gymName || c.gym_name || gymDisplayName}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#707070' }}>{c.user_email} • {c.user_phone}</span>
                      </div>
                      <Badge status={c.user_status} />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#4A4A4A' }}>
                      <strong>Goal:</strong> {c.fitness_goals || 'Strength & Conditioning'}
                    </div>
                    {c.medical_notes && (
                      <div style={{ marginTop: '4px', fontSize: '0.76rem', color: '#CF1322' }}>
                        ⚠️ {c.medical_notes}
                      </div>
                    )}
                    <div style={{ marginTop: '12px', borderTop: '1px solid #E8E5DC', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span><strong>Workout:</strong> {clientWorkout ? clientWorkout.workout_title : 'No routine'}</span>
                      <span><strong>Logs:</strong> {clientProgress.length} assessments</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW C: MEMBER PERSONAL DASHBOARD
          ========================================================================= */}
      {isMember && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <StatCard
              title="Current Membership"
              value={
                (mySubscription?.planName || mySubscription?.sub_plan_name) ? (
                  (mySubscription.planName || mySubscription.sub_plan_name)
                ) : (
                  <Link
                    to="/subscriptions"
                    style={{
                      fontSize: '0.98rem',
                      color: '#A67C00',
                      textDecoration: 'none',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Explore Membership Plans →
                  </Link>
                )
              }
              subtitle={
                (mySubscription?.endDate || mySubscription?.sub_end_date)
                  ? `Valid until: ${mySubscription.endDate || mySubscription.sub_end_date}`
                  : 'Explore available membership packages'
              }
              isGold={!!mySubscription}
              trend={mySubscription ? 'Active Status' : 'Browse Plans'}
            />
            <StatCard
              title="Attendance Records"
              value={myAttendance.length}
              subtitle={myAttendance.length === 1 ? '1 session completed' : `${myAttendance.length} sessions completed`}
              trend={myAttendance.length > 0 ? 'Consistency: High' : 'Ready for First Session'}
            />
            <StatCard
              title="Assigned Trainer"
              value={trainerDisplayName}
              subtitle={trainerDisplaySubtitle}
            />
          </div>

          {/* Member Active Plan Details Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EDE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                  My Membership Plan & Enrolled Pass
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#707070', margin: '2px 0 0 0' }}>
                  Live membership status and subscription validity
                </p>
              </div>
              <Link
                to="/subscriptions"
                style={{
                  fontSize: '0.78rem',
                  color: '#A67C00',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Explore & Manage Plans →
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#FAF9F5', borderBottom: '1px solid #E8E5DC', color: '#707070', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 16px' }}>Member</th>
                    <th style={{ padding: '12px 16px' }}>Enrolled Plan</th>
                    <th style={{ padding: '12px 16px' }}>Start Date</th>
                    <th style={{ padding: '12px 16px' }}>End Date</th>
                    <th style={{ padding: '12px 16px' }}>Remaining</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!mySubscription ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px 20px', textAlign: 'center', color: '#707070' }}>
                        <div style={{ marginBottom: '8px', fontSize: '0.88rem', fontWeight: '600' }}>No active membership pass enrolled.</div>
                        <Link
                          to="/subscriptions"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '0.82rem'
                          }}
                        >
                          Explore Membership Plans & Enroll →
                        </Link>
                      </td>
                    </tr>
                  ) : (() => {
                    const planTitle = mySubscription.planName || mySubscription.sub_plan_name || 'Membership Plan';
                    const sDate = mySubscription.startDate || mySubscription.sub_start_date || '-';
                    const eDate = mySubscription.endDate || mySubscription.sub_end_date || '-';
                    
                    let daysLeft = 0;
                    if (eDate && eDate !== '-') {
                      try {
                        const end = new Date(eDate);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);
                        daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                      } catch (e) {
                        daysLeft = 0;
                      }
                    }
                    const isExpiring = daysLeft > 0 && daysLeft <= 30;
                    const amt = mySubscription.amount !== undefined ? mySubscription.amount : (mySubscription.sub_amount !== undefined ? mySubscription.sub_amount : 0);
                    const st = mySubscription.status || mySubscription.sub_status || 'Active';
                    const memberName = mySubscription.memberName || user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member';

                    return (
                      <tr style={{ borderBottom: '1px solid #F0EDE5' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#242424' }}>
                          {memberName}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#A67C00' }}>
                          {planTitle}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#4A4A4A', whiteSpace: 'nowrap' }}>{sDate}</td>
                        <td style={{ padding: '14px 16px', color: '#4A4A4A', whiteSpace: 'nowrap' }}>{eDate}</td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            background: daysLeft > 30 ? '#EDF7EE' : isExpiring ? '#FEF7E6' : '#FEEBEA',
                            color: daysLeft > 30 ? '#237804' : isExpiring ? '#A67C00' : '#CF1322'
                          }}>
                            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#242424', whiteSpace: 'nowrap' }}>
                          ${Number(amt).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <Badge status={st} />
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Workout Routine & Progress Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', margin: 0 }}>
                    Assigned Workout Program
                  </h3>
                  <Link
                    to="/progress"
                    style={{
                      fontSize: '0.78rem',
                      color: '#A67C00',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    View Workout Progress →
                  </Link>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#C9A227', margin: 0 }}>
                      {activeMemberWorkout.workout_title || activeMemberWorkout.title || '5 Day of Strength Training'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', background: '#FAF6ED', color: '#A67C00', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      {activeMemberWorkout.difficulty || 'Intermediate'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#707070', margin: '0 0 10px 0' }}>
                    Goal: <strong>{activeMemberWorkout.workout_description || activeMemberWorkout.goal || 'Focus on Core'}</strong>
                    {(activeMemberWorkout.trainerName || (trainerDisplayName !== 'Not Assigned' && trainerDisplayName)) &&
                      ` • Coach: ${activeMemberWorkout.trainerName || trainerDisplayName}`}
                  </p>

                  {/* Live Dynamic Workout Progress Bar */}
                  <div style={{ padding: '14px', background: '#F8F8F6', borderRadius: '10px', border: '1px solid #F0EDE5', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px' }}>
                      <span style={{ color: '#242424' }}>Weekly Routine Progress</span>
                      <span style={{ color: workoutStats.percentage > 0 ? '#A67C00' : '#707070', fontWeight: '800' }}>
                        {workoutStats.completedCount} / {workoutStats.totalDays} Sessions Done ({workoutStats.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#E8E5DC', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${workoutStats.percentage}%`,
                        height: '100%',
                        background: workoutStats.percentage === 100
                          ? 'linear-gradient(90deg, #52C41A 0%, #389E0D 100%)'
                          : (workoutStats.percentage > 0 ? 'linear-gradient(90deg, #C9A227 0%, #52C41A 100%)' : 'transparent'),
                        borderRadius: '5px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#707070', marginTop: '6px' }}>
                      <span>
                        {workoutStats.completedCount > 0 ? `🔥 ${workoutStats.streak}-Day Active Streak` : '0-Day Active Streak'}
                      </span>
                      <span style={{ color: workoutStats.percentage === 100 ? '#237804' : (workoutStats.percentage > 0 ? '#237804' : '#8C8C8C'), fontWeight: '700' }}>
                        {workoutStats.percentage === 100 ? 'Split Completed ✓' : (workoutStats.percentage > 0 ? 'On Track' : 'Not Started (0%)')}
                      </span>
                    </div>

                    {/* Interactive Session Day Pills */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {memberScheduleDays.map((d, idx) => {
                        const isDone = !!completedWorkoutSessions[idx];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const updated = { ...completedWorkoutSessions, [idx]: !isDone };
                              setCompletedWorkoutSessions(updated);
                              saveWorkoutProgress(user, updated);
                            }}
                            title={`Click to mark Day ${idx + 1} (${d.title}) as ${isDone ? 'pending' : 'completed'}`}
                            style={{
                              flex: 1,
                              minWidth: '55px',
                              padding: '6px 4px',
                              borderRadius: '6px',
                              border: isDone ? '1px solid #B7EB8F' : '1px solid #E8E5DC',
                              background: isDone ? '#F6FFED' : '#FFFFFF',
                              color: isDone ? '#237804' : '#595959',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '3px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{isDone ? '✓' : '○'}</span>
                            <span>Day {idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#FAF9F5', borderRadius: '8px', fontSize: '0.8rem', lineHeight: 1.6, border: '1px solid #F0EDE5' }}>
                    <div style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>SCHEDULE SPLIT:</div>
                    {activeMemberWorkout.workout_schedule || activeMemberWorkout.schedule || 'Test'}
                  </div>
                </div>
              </div>
            </div>

            {/* Biometric Progress Assessments Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', margin: 0 }}>
                      Biometric Progress Assessments
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#707070' }}>Body composition & milestones</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowProgressModal(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '0.76rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(201, 162, 39, 0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      + Complete Assessment
                    </button>
                    <Link
                      to="/progress"
                      style={{
                        fontSize: '0.78rem',
                        color: '#A67C00',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                    >
                      My Progress →
                    </Link>
                  </div>
                </div>

                {progressNotice && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#EDF7EE', color: '#237804', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid #B7EB8F', fontWeight: '600' }}>
                    ✓ {progressNotice}
                  </div>
                )}

                {myProgress.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myProgress.slice(0, 3).map(p => {
                      const recDate = p.recordedDate || p.prog_record_date || 'Recent';
                      const weight = p.prog_weight || (p.weightKg ? `${p.weightKg} kg` : '-');
                      const bodyFat = p.prog_body_fat || (p.bodyFatPercentage ? `${p.bodyFatPercentage}%` : '-');
                      const muscle = p.prog_muscle_mass || (p.chestCm ? `${p.chestCm} cm` : '-');
                      const waist = p.waistCm ? `${p.waistCm} cm` : (p.prog_waist || '-');
                      const arms = p.armsCm ? `${p.armsCm} cm` : (p.prog_arms || '-');
                      const notes = p.prog_notes || p.notes;

                      return (
                        <div key={p.ROWID || Math.random()} style={{ padding: '12px 14px', background: '#F8F8F6', borderRadius: '8px', border: '1px solid #F0EDE5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
                            <span style={{ color: '#242424' }}>Assessment: {recDate}</span>
                            <span style={{ color: '#237804', background: '#EDF7EE', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>Completed ✓</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', background: '#FFFFFF', padding: '8px', borderRadius: '6px', border: '1px solid #E8E5DC', margin: '6px 0' }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#707070' }}>WEIGHT</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#A67C00' }}>{weight}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#707070' }}>BODY FAT</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#242424' }}>{bodyFat}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#707070' }}>CHEST/MUSCLE</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#242424' }}>{muscle}</div>
                            </div>
                          </div>
                          {(waist !== '-' || arms !== '-') && (
                            <div style={{ fontSize: '0.74rem', color: '#707070', marginTop: '4px' }}>
                              Waist: {waist} • Arms: {arms}
                            </div>
                          )}
                          {notes && (
                            <div style={{ fontSize: '0.74rem', color: '#4A4A4A', marginTop: '4px', fontStyle: 'italic' }}>
                              "{notes}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '24px 16px', background: '#F8F8F6', borderRadius: '10px', textAlign: 'center', color: '#707070' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>📊</div>
                    <p style={{ fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                      No completed biometric assessments logged yet. Once your assessment is completed, your full progress tracking logs will be shown in My Progress.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProgressModal(true)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      + Complete First Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW D: MANAGER / STAFF DASHBOARD
          ========================================================================= */}
      {isStaff && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              title="Today's Check-ins"
              value={safeAttendance.length}
              subtitle="Front desk logs"
              isGold={true}
            />
            <StatCard
              title="Active Members"
              value={safeMembers.length}
              subtitle="Registered athletes"
            />
            <StatCard
              title="Active Subscriptions"
              value={safeSubscriptions.length}
              subtitle="Valid membership passes"
            />
          </div>

          {/* Front Desk Quick Check-In Form */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E8E5DC' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#242424', marginBottom: '8px' }}>
              Front Desk Member Check-In
            </h3>
            {checkInNotice && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#EDF7EE', color: '#237804', fontSize: '0.8rem', marginBottom: '12px' }}>
                {checkInNotice}
              </div>
            )}
            <form onSubmit={handleQuickCheckIn} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <select
                required
                value={checkInMemberId}
                onChange={e => setCheckInMemberId(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', fontSize: '0.86rem' }}
              >
                <option value="">-- Select Member to Check In --</option>
                {safeMembers.map(m => (
                  <option key={m.ROWID || m.email} value={m.ROWID}>{m.user_first_name || m.name} {m.user_last_name || ''} ({m.user_email || m.email})</option>
                ))}
              </select>
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#C9A227', color: '#FFFFFF', fontWeight: '700', border: 'none', cursor: 'pointer' }}
              >
                Check In Member
              </button>
            </form>
          </div>
        </>
      )}

      {/* Render All Modals */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onUserInvited={(result, invitedData) => {
          loadAllData();
          setInvitationNotice(`Invitation sent successfully to ${invitedData?.email || 'user'} as ${invitedData?.role || 'Member'}!`);
          setTimeout(() => setInvitationNotice(''), 6000);
        }}
      />
      <PlanModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} onPlanCreated={loadAllData} />
      <SubscriptionModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} members={safeMembers} plans={safePlans} onSubCreated={loadAllData} />
      <PaymentModal isOpen={showPayModal} onClose={() => setShowPayModal(false)} members={safeMembers} onPaymentRecorded={loadAllData} />
      <WorkoutModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} members={safeMembers} trainerId={user?.ROWID} trainerName={user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim()} onWorkoutCreated={loadAllData} />
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        members={isMember ? [{ ROWID: user?.ROWID || user?.id, name: user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member', user_email: user?.email }] : safeMembers}
        trainerId={user?.ROWID}
        onProgressLogged={async () => {
          setProgressNotice('Biometric Assessment completed and recorded in My Progress!');
          setTimeout(() => setProgressNotice(''), 4000);
          await loadAllData();
        }}
      />
    </div>
  );
};
