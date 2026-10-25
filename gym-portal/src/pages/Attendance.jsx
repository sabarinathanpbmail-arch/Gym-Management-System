import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const Attendance = () => {
  const { role, user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success'); // 'success' | 'info' | 'error'

  const currentMemberId = user?.ROWID || user?.id;

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'Member' && currentMemberId) {
        params.member_id = currentMemberId;
      }
      const [attRes, memRes] = await Promise.all([
        api.attendance.getAll(params),
        api.members.getAll().catch(() => ({ data: [] }))
      ]);
      const currentGym = getGymDisplayName(user, null);
      let safeAtt = Array.isArray(attRes.data) ? attRes.data : (Array.isArray(attRes) ? attRes : []);
      const safeMem = Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []);

      const visibleMem = safeMem.filter(m => {
        if (!currentGym) return true;
        const mGym = getGymDisplayName(m, user);
        return isSameGym(mGym, currentGym);
      });

      // Filter attendance records to current gym
      safeAtt = safeAtt.filter(a => {
        if (role === 'Member' && currentMemberId) {
          const matchId = String(a.att_member_id || a.memberId) === String(currentMemberId);
          const matchEmail = a.memberEmail && user?.email && String(a.memberEmail).toLowerCase() === String(user.email).toLowerCase();
          return matchId || matchEmail;
        }
        if (!currentGym) return true;
        const aMemberId = String(a.att_member_id || a.memberId || '').trim();
        if (aMemberId) {
          const isOurMember = visibleMem.some(m => String(m.ROWID) === aMemberId);
          if (isOurMember) return true;
          const isOtherMember = safeMem.some(m => String(m.ROWID) === aMemberId);
          if (isOtherMember) return false;
        }
        const aGym = a.gymName || a.gym_name;
        if (aGym && !['Aurum Fitness Club', 'Fitness Club', 'Fitness Center'].includes(aGym)) {
          return isSameGym(aGym, currentGym);
        }
        return visibleMem.length > 0 ? false : true;
      });

      // Sort newest records first
      safeAtt.sort((a, b) => {
        const dA = a.att_date || a.attendanceDate || '';
        const dB = b.att_date || b.attendanceDate || '';
        if (dA !== dB) return dB.localeCompare(dA);
        try {
          const rA = BigInt(a.ROWID || 0);
          const rB = BigInt(b.ROWID || 0);
          if (rA !== rB) return rA > rB ? -1 : 1;
        } catch (ignored) {}
        return 0;
      });

      setAttendance(safeAtt);
      setMembers(visibleMem);
      if (visibleMem.length > 0 && !selectedMemberId) {
        setSelectedMemberId(visibleMem[0].ROWID);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const getIndianTimeStr = () => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date()).replace(/\u202f/g, ' ');
    } catch (e) {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  const getIndianDateStr = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  };

  const todayStr = getIndianDateStr();

  // Active session for the current member
  const memberActiveSession = attendance.find(a => {
    const isMember = role !== 'Member' ? true : (String(a.att_member_id || a.memberId) === String(currentMemberId));
    const isToday = (a.att_date || a.attendanceDate) === todayStr;
    const isStatusActive = (a.att_status === 'Checked In' || a.att_status === 'Present');
    const isInSession = (a.att_check_out === 'In Session' || !a.att_check_out || a.att_check_out === '-');
    return isMember && (isToday || isInSession) && isStatusActive && isInSession;
  });

  // Selected member active session (for Owner / Staff)
  const selectedMemberActiveSession = attendance.find(a => {
    const matchesSelected = String(a.att_member_id || a.memberId) === String(selectedMemberId);
    const isToday = (a.att_date || a.attendanceDate) === todayStr;
    const isStatusActive = (a.att_status === 'Checked In' || a.att_status === 'Present');
    const isInSession = (a.att_check_out === 'In Session' || !a.att_check_out || a.att_check_out === '-');
    return matchesSelected && (isToday || isInSession) && isStatusActive && isInSession;
  });

  // Today completed session for current member
  const memberTodayCompleted = attendance.find(a => {
    const isMember = role !== 'Member' ? true : (String(a.att_member_id || a.memberId) === String(currentMemberId));
    const isToday = (a.att_date || a.attendanceDate) === todayStr;
    const isCheckedOut = a.att_status === 'Checked Out' || (a.att_check_out && a.att_check_out !== 'In Session' && a.att_check_out !== '-');
    return isMember && isToday && isCheckedOut;
  });

  const todayPresent = attendance.filter(a => {
    const d = a.att_date || a.attendanceDate;
    const st = a.att_status || a.status;
    const co = a.att_check_out || a.checkOutTime;
    return d === todayStr && (st === 'Present' || st === 'Checked In') && (co === 'In Session' || !co || co === '-');
  });

  const todayCheckedOut = attendance.filter(a => {
    const d = a.att_date || a.attendanceDate;
    const st = a.att_status || a.status;
    const co = a.att_check_out || a.checkOutTime;
    return d === todayStr && (st === 'Checked Out' || (co && co !== 'In Session' && co !== '-'));
  });

  const handleCheckIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let targetMember = role === 'Member' ? currentMemberId : selectedMemberId;
    if (!targetMember && members && members.length > 0) {
      targetMember = members[0].ROWID;
    }
    if (!targetMember) {
      setNoticeType('error');
      setNotice('Please select a member to record check-in.');
      setTimeout(() => setNotice(''), 3000);
      return;
    }

    if (role === 'Member' && memberActiveSession) {
      setNoticeType('info');
      setNotice('You are already checked in today! Click "Check Out" when you finish your gym session.');
      setTimeout(() => setNotice(''), 4000);
      return;
    }

    try {
      setActionLoading(true);
      const istTime = getIndianTimeStr();
      const istDate = getIndianDateStr();
      await api.attendance.checkIn({
        att_member_id: targetMember,
        memberId: targetMember,
        checkInTime: istTime,
        time: istTime,
        attendanceDate: istDate,
        att_date: istDate
      });
      setNoticeType('success');
      setNotice(`Check-in recorded successfully at ${istTime} IST! Welcome to your gym session.`);
      setTimeout(() => setNotice(''), 4000);
      await loadData();
    } catch (err) {
      setNoticeType('error');
      setNotice(`Notice: ${err.message || 'Check-in failed'}`);
      setTimeout(() => setNotice(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (recordId) => {
    try {
      setActionLoading(true);
      const istTime = getIndianTimeStr();
      const istDate = getIndianDateStr();
      const targetMember = role === 'Member' ? currentMemberId : (selectedMemberId || (members[0] ? members[0].ROWID : ''));
      const payload = recordId
        ? { ROWID: recordId, checkOutTime: istTime, time: istTime, attendanceDate: istDate }
        : { member_id: targetMember, att_member_id: targetMember, checkOutTime: istTime, time: istTime, attendanceDate: istDate };
      await api.attendance.checkOut(payload);
      setNoticeType('success');
      setNotice(`Checked out successfully at ${istTime} IST! Your visit history has been updated.`);
      setTimeout(() => setNotice(''), 4000);
      await loadData();
    } catch (err) {
      setNoticeType('error');
      setNotice(`Notice: ${err.message || 'Check-out failed'}`);
      setTimeout(() => setNotice(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @keyframes sessionPulse {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
      `}</style>

      {/* Header Metric Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              {role === 'Member' ? 'My Gym Attendance & Check-In' : 'Daily Attendance & Check-In Desk'}
            </h3>
            {role === 'Member' && memberActiveSession && (
              <span style={{
                background: '#EDF7EE',
                color: '#237804',
                border: '1px solid #B7EB8F',
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '0.72rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#237804',
                  animation: 'sessionPulse 1.4s infinite'
                }}></span>
                Session Active
              </span>
            )}
            {role === 'Member' && !memberActiveSession && memberTodayCompleted && (
              <span style={{
                background: '#FEF7E6',
                color: '#A67C00',
                border: '1px solid #FFE58F',
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '0.72rem',
                fontWeight: '700'
              }}>
                ✓ Session Completed Today
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#707070', margin: '3px 0 0 0' }}>
            {role === 'Member'
              ? 'Check in when you arrive at the gym and check out when your workout is complete.'
              : 'Live timestamps recorded directly in Catalyst Attendance Data Store'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '600' }}>
              {role === 'Member' ? 'Current Session' : 'Active in Gym'}
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#237804', lineHeight: 1.1 }}>
              {role === 'Member' ? (memberActiveSession ? 'In Session' : 'None') : todayPresent.length}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '600' }}>
              {role === 'Member' ? 'Total Visits' : 'Completed Today'}
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#707070', lineHeight: 1.1 }}>
              {role === 'Member' ? attendance.length : todayCheckedOut.length}
            </div>
          </div>
        </div>
      </div>

      {/* Front-Desk / Member Check-In & Check-Out Control Box */}
      {(role === 'Owner' || role === 'Staff' || role === 'Member') && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E8E5DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                {role === 'Member' ? 'My Daily Attendance Terminal' : 'Front Desk Quick Action Bar'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#707070', margin: '2px 0 0 0' }}>
                {role === 'Member'
                  ? 'Record your arrival or check out to register your completed workout in the log.'
                  : 'Select an athlete to log front-desk check-in or check-out.'}
              </p>
            </div>

            {/* Member Active Session Banner */}
            {role === 'Member' && memberActiveSession && (
              <div style={{
                background: '#FAF6ED',
                border: '1px solid #E8D293',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                color: '#8C6700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontWeight: '700' }}>Checked In At:</span> {memberActiveSession.att_check_in || memberActiveSession.checkInTime}
              </div>
            )}
          </div>

          {notice && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: noticeType === 'error' ? '#FEEBEA' : (noticeType === 'info' ? '#FEF7E6' : '#EDF7EE'),
              color: noticeType === 'error' ? '#CF1322' : (noticeType === 'info' ? '#A67C00' : '#237804'),
              border: `1px solid ${noticeType === 'error' ? '#FFA39E' : (noticeType === 'info' ? '#FFE58F' : '#B7EB8F')}`,
              fontSize: '0.82rem',
              fontWeight: '600',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{noticeType === 'error' ? '⚠️' : (noticeType === 'info' ? 'ℹ️' : '✓')}</span>
              <span>{notice}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {role !== 'Member' && (
              <select
                id="frontDeskMemberSelect"
                value={selectedMemberId || (members[0] ? members[0].ROWID : '')}
                onChange={e => setSelectedMemberId(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E8E5DC',
                  fontSize: '0.86rem',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              >
                {(Array.isArray(members) ? members : []).map(m => (
                  <option key={m.ROWID || m.email} value={m.ROWID}>
                    {m.user_first_name || m.name} {m.user_last_name || ''} ({m.user_email || m.email})
                  </option>
                ))}
              </select>
            )}

            {/* Check In Button */}
            <button
              id="frontDeskCheckInBtn"
              type="button"
              disabled={actionLoading || (role === 'Member' && !!memberActiveSession)}
              onClick={handleCheckIn}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: (role === 'Member' && memberActiveSession)
                  ? '#FAF8F3'
                  : 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: (role === 'Member' && memberActiveSession) ? '#999890' : '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.86rem',
                border: (role === 'Member' && memberActiveSession) ? '1px solid #E8E5DC' : 'none',
                cursor: (role === 'Member' && memberActiveSession) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: (role === 'Member' && memberActiveSession) ? 'none' : '0 2px 8px rgba(201, 162, 39, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {role === 'Member'
                ? (memberActiveSession ? 'Checked In (Active)' : 'Check In to Gym Today')
                : 'Record Check-In'}
            </button>

            {/* Check Out Button */}
            <button
              id="frontDeskCheckOutBtn"
              type="button"
              disabled={
                actionLoading ||
                (role === 'Member' && !memberActiveSession) ||
                (role !== 'Member' && !selectedMemberActiveSession)
              }
              onClick={() => {
                if (role === 'Member') {
                  if (memberActiveSession) {
                    handleCheckOut(memberActiveSession.ROWID);
                  } else {
                    setNoticeType('info');
                    setNotice('No active session found for today. Please check in first before checking out.');
                    setTimeout(() => setNotice(''), 4000);
                  }
                } else {
                  if (selectedMemberActiveSession) {
                    handleCheckOut(selectedMemberActiveSession.ROWID);
                  } else {
                    handleCheckOut();
                  }
                }
              }}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: ((role === 'Member' && memberActiveSession) || (role !== 'Member' && selectedMemberActiveSession))
                  ? '#242424'
                  : '#F5F5F3',
                color: ((role === 'Member' && memberActiveSession) || (role !== 'Member' && selectedMemberActiveSession))
                  ? '#FFFFFF'
                  : '#A0A0A0',
                fontWeight: '700',
                fontSize: '0.86rem',
                border: ((role === 'Member' && memberActiveSession) || (role !== 'Member' && selectedMemberActiveSession))
                  ? '1px solid #141414'
                  : '1px solid #E8E5DC',
                cursor: ((role === 'Member' && memberActiveSession) || (role !== 'Member' && selectedMemberActiveSession))
                  ? 'pointer'
                  : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: ((role === 'Member' && memberActiveSession) || (role !== 'Member' && selectedMemberActiveSession))
                  ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {role === 'Member' ? 'Check Out of Gym' : 'Record Check-Out'}
            </button>
          </div>
        </div>
      )}

      {/* Attendance Logs Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#242424', margin: 0 }}>
            {role === 'Member' ? 'My Attendance History' : 'All Facility Attendance Records'}
          </h4>
          <span style={{ fontSize: '0.74rem', color: '#707070' }}>
            {attendance.length} total {attendance.length === 1 ? 'record' : 'records'} logged
          </span>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#FAF9F5', borderBottom: '1px solid #E8E5DC', color: '#707070', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <th style={{ padding: '14px 16px' }}>Member</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px' }}>Check-In Time</th>
              <th style={{ padding: '14px 16px' }}>Check-Out Time</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#707070' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid #E8E5DC', borderTopColor: '#C9A227', borderRadius: '50%', animation: 'sessionPulse 0.8s infinite', margin: '0 auto 10px auto' }} />
                  Loading attendance records...
                </td>
              </tr>
            ) : (!Array.isArray(attendance) || attendance.length === 0) ? (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#707070' }}>
                  No attendance activity recorded yet. Check in above to start your first session!
                </td>
              </tr>
            ) : (
              attendance.map(a => {
                const member = Array.isArray(members) ? members.find(m => String(m.ROWID) === String(a.att_member_id || a.memberId)) : null;
                const memberName = a.memberName || (member ? `${member.user_first_name || member.name} ${member.user_last_name || ''}`.trim() : `Member #${a.att_member_id || a.memberId || '1'}`);
                const memberEmail = member?.user_email || member?.email || (role === 'Member' ? user?.email : '');
                const dateVal = a.att_date || a.attendanceDate || todayStr;
                const checkInVal = a.att_check_in || a.checkInTime || '-';
                const rawCheckOut = a.att_check_out || a.checkOutTime;
                const statusVal = a.att_status || a.status || 'Present';
                const isToday = dateVal === todayStr;

                const isInSession =
                  (statusVal === 'Checked In' || statusVal === 'Present') &&
                  (rawCheckOut === 'In Session' || !rawCheckOut || rawCheckOut === '-');

                return (
                  <tr key={a.ROWID || Math.random()} style={{ borderBottom: '1px solid #F0EDE5', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#242424' }}>
                        {memberName}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                        {getGymDisplayName(member, user)}
                      </div>
                      {memberEmail && (
                        <div style={{ fontSize: '0.72rem', color: '#707070' }}>{memberEmail}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A', whiteSpace: 'nowrap' }}>
                      <span>{dateVal}</span>
                      {isToday && (
                        <span style={{
                          marginLeft: '6px',
                          fontSize: '0.68rem',
                          background: '#FAF6ED',
                          color: '#A67C00',
                          border: '1px solid #E8D293',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontWeight: '700'
                        }}>
                          Today
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#237804', whiteSpace: 'nowrap' }}>
                      {checkInVal}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {isInSession ? (
                        <span style={{
                          color: '#C9A227',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FAF6ED',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #E8D293',
                          fontSize: '0.74rem'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#C9A227',
                            animation: 'sessionPulse 1.4s infinite'
                          }}></span>
                          In Session
                        </span>
                      ) : (
                        <span style={{ color: '#4A4A4A', fontWeight: '600' }}>
                          {rawCheckOut || '-'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge status={isInSession ? 'Checked In' : (statusVal === 'Checked Out' ? 'Checked Out' : statusVal)} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isInSession ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleCheckOut(a.ROWID)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.76rem',
                            borderRadius: '6px',
                            border: '1px solid #C9A227',
                            background: '#FAF6ED',
                            color: '#8C6700',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 6px rgba(201, 162, 39, 0.15)'
                          }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Check Out
                        </button>
                      ) : (
                        <span style={{
                          fontSize: '0.74rem',
                          color: '#237804',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                          Checked Out
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

