import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

// 1. Create Membership Plan Modal
export const PlanModal = ({ isOpen, onClose, onPlanCreated }) => {
  const [formData, setFormData] = useState({
    plan_name: '',
    duration_months: '1',
    plan_duration_days: '30',
    plan_price: '99',
    plan_description: '',
    features: '',
    plan_status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDurationMonthsChange = (months) => {
    const m = Math.max(1, parseInt(months) || 1);
    setFormData(prev => ({
      ...prev,
      duration_months: String(m),
      plan_duration_days: String(m * 30)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plan_name.trim()) {
      setError('Plan name is required.');
      return;
    }
    const numPrice = parseFloat(formData.plan_price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }
    const months = parseInt(formData.duration_months) || 1;

    setLoading(true);
    setError('');
    try {
      const payload = {
        planName: formData.plan_name.trim(),
        plan_name: formData.plan_name.trim(),
        price: numPrice,
        plan_price: numPrice,
        durationMonths: months,
        plan_duration_days: months * 30,
        description: formData.plan_description.trim(),
        plan_description: formData.plan_description.trim(),
        features: formData.features.trim() || formData.plan_description.trim(),
        status: formData.plan_status || 'Active',
        plan_status: formData.plan_status || 'Active'
      };
      const res = await api.plans.create(payload);
      if (onPlanCreated) onPlanCreated(res.data);
      // Reset form on success
      setFormData({
        plan_name: '',
        duration_months: '1',
        plan_duration_days: '30',
        plan_price: '99',
        plan_description: '',
        features: '',
        plan_status: 'Active'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create membership plan. Please check backend response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Membership Plan" subtitle="Add new package tier to gym offerings">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Plan Name *</label>
          <input
            type="text"
            required
            value={formData.plan_name}
            onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
            placeholder="e.g. Gold Semi-Annual Membership"
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Duration (Months) *</label>
            <select
              value={formData.duration_months}
              onChange={e => handleDurationMonthsChange(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            >
              <option value="1">1 Month (30 Days)</option>
              <option value="3">3 Months (90 Days / Quarterly)</option>
              <option value="6">6 Months (180 Days / Semi-Annual)</option>
              <option value="12">12 Months (360 Days / Annual)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Price ($) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.plan_price}
              onChange={e => setFormData({ ...formData, plan_price: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Description</label>
          <textarea
            rows="2"
            value={formData.plan_description}
            onChange={e => setFormData({ ...formData, plan_description: e.target.value })}
            placeholder="Overview of the membership tier..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Features & Inclusions</label>
          <input
            type="text"
            value={formData.features}
            onChange={e => setFormData({ ...formData, features: e.target.value })}
            placeholder="e.g. Free locker, Sauna access, 2 Guest passes per month"
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#C9A227',
              color: '#FFF',
              fontWeight: '700',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// 2. Assign / Create Subscription Modal
export const SubscriptionModal = ({ isOpen, onClose, members = [], plans = [], onSubCreated }) => {
  const [formData, setFormData] = useState({
    sub_member_id: '',
    sub_plan_id: '',
    sub_start_date: new Date().toISOString().slice(0, 10),
    record_payment: true,
    payment_method: 'Credit Card'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        sub_member_id: prev.sub_member_id || (members.length > 0 ? String(members[0].ROWID) : ''),
        sub_plan_id: prev.sub_plan_id || (plans.length > 0 ? String(plans[0].ROWID) : '')
      }));
      setError('');
    }
  }, [isOpen, members, plans]);

  const effectiveMemberId = formData.sub_member_id || (members.length > 0 ? String(members[0].ROWID) : '');
  const effectivePlanId = formData.sub_plan_id || (plans.length > 0 ? String(plans[0].ROWID) : '');
  const selectedPlan = plans.find(p => String(p.ROWID) === String(effectivePlanId)) || plans[0];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveMemberId) {
      setError('Please select a member.');
      return;
    }
    if (!effectivePlanId) {
      setError('Please select a membership plan.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedMember = members.find(m => String(m.ROWID) === String(effectiveMemberId));
      const memberName = selectedMember
        ? (selectedMember.name || `${selectedMember.user_first_name || ''} ${selectedMember.user_last_name || ''}`.trim())
        : 'Member';

      const payload = {
        sub_member_id: effectiveMemberId,
        memberId: effectiveMemberId,
        memberName,
        sub_plan_id: selectedPlan?.ROWID,
        sub_plan_name: selectedPlan?.plan_name || 'Membership Plan',
        sub_amount: selectedPlan?.plan_price || '0',
        duration_days: selectedPlan?.plan_duration_days || '30',
        sub_start_date: formData.sub_start_date,
        record_payment: formData.record_payment,
        payment_method: formData.payment_method
      };
      const res = await api.subscriptions.create(payload);
      if (onSubCreated) onSubCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Membership Plan" subtitle="Enroll a member in an active plan">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <div style={{ color: '#CF1322', fontSize: '0.8rem' }}>{error}</div>}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Select Member *</label>
          <select required value={effectiveMemberId} onChange={e => setFormData({ ...formData, sub_member_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
            {members.length === 0 ? (
              <option value="">No members registered</option>
            ) : (
              members.map(m => (
                <option key={m.ROWID} value={m.ROWID}>
                  {m.name || `${m.user_first_name || ''} ${m.user_last_name || ''}`.trim() || 'Member'} {m.user_email ? `(${m.user_email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Select Plan *</label>
          <select required value={effectivePlanId} onChange={e => setFormData({ ...formData, sub_plan_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
            {plans.length === 0 ? (
              <option value="">No active plans</option>
            ) : (
              plans.map(p => (
                <option key={p.ROWID} value={p.ROWID}>{p.plan_name} (${p.plan_price} / {p.plan_duration_days} days)</option>
              ))
            )}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Start Date</label>
          <input type="date" value={formData.sub_start_date} onChange={e => setFormData({ ...formData, sub_start_date: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <input type="checkbox" id="recordPay" checked={formData.record_payment} onChange={e => setFormData({ ...formData, record_payment: e.target.checked })} />
          <label htmlFor="recordPay" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#242424' }}>Record payment immediately in Ledger (${selectedPlan?.plan_price || 0})</label>
        </div>
        {formData.record_payment && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Payment Method</label>
            <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
              <option value="Credit Card">Credit Card</option>
              <option value="UPI">UPI / Digital</option>
              <option value="Cash">Cash at Counter</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', border: 'none' }}>
            {loading ? 'Processing...' : 'Confirm Subscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// 3. Record Payment Modal
export const PaymentModal = ({ isOpen, onClose, members = [], onPaymentRecorded }) => {
  const [formData, setFormData] = useState({
    pay_member_id: '',
    pay_amount: '99',
    pay_method: 'Credit Card',
    pay_notes: 'Membership payment'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        pay_member_id: prev.pay_member_id || (members.length > 0 ? String(members[0].ROWID) : '')
      }));
      setError('');
    }
  }, [isOpen, members]);

  const effectiveMemberId = formData.pay_member_id || (members.length > 0 ? String(members[0].ROWID) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveMemberId) {
      setError('Please select a member.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedMember = members.find(m => String(m.ROWID) === String(effectiveMemberId));
      const memberName = selectedMember
        ? (selectedMember.name || `${selectedMember.user_first_name || ''} ${selectedMember.user_last_name || ''}`.trim())
        : 'Member';

      const res = await api.payments.create({
        ...formData,
        pay_member_id: effectiveMemberId,
        memberId: effectiveMemberId,
        memberName
      });
      if (onPaymentRecorded) onPaymentRecorded(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" subtitle="Add transaction to the financial ledger">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <div style={{ color: '#CF1322', fontSize: '0.8rem' }}>{error}</div>}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Member *</label>
          <select required value={effectiveMemberId} onChange={e => setFormData({ ...formData, pay_member_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
            {members.length === 0 ? (
              <option value="">No members registered</option>
            ) : (
              members.map(m => (
                <option key={m.ROWID} value={m.ROWID}>
                  {m.name || `${m.user_first_name || ''} ${m.user_last_name || ''}`.trim() || 'Member'} {m.user_email ? `(${m.user_email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Amount ($) *</label>
            <input type="number" required min="1" step="0.01" value={formData.pay_amount} onChange={e => setFormData({ ...formData, pay_amount: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Method *</label>
            <select value={formData.pay_method} onChange={e => setFormData({ ...formData, pay_method: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}>
              <option value="Credit Card">Credit Card</option>
              <option value="UPI">UPI / Digital</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Transaction Notes</label>
          <input type="text" value={formData.pay_notes} onChange={e => setFormData({ ...formData, pay_notes: e.target.value })} placeholder="Reference number or description" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', border: 'none' }}>
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// 4. Workout Plan Modal
export const WorkoutModal = ({ isOpen, onClose, members = [], trainerId = '', trainerName = '', onWorkoutCreated }) => {
  const [formData, setFormData] = useState({
    workout_member_id: '',
    workout_trainer_id: trainerId || '',
    workout_title: '',
    workout_description: '',
    workout_schedule: '',
    workout_status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever modal opens or members / trainerId change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        workout_member_id: prev.workout_member_id || (members.length > 0 ? String(members[0].ROWID) : ''),
        workout_trainer_id: trainerId || prev.workout_trainer_id
      }));
      setError('');
    }
  }, [isOpen, members, trainerId]);

  const effectiveMemberId = formData.workout_member_id || (members.length > 0 ? String(members[0].ROWID) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveMemberId) {
      setError('Please select an athlete / member.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedMember = members.find(m => String(m.ROWID) === String(effectiveMemberId));
      const memberFullName = selectedMember
        ? (selectedMember.name || `${selectedMember.user_first_name || ''} ${selectedMember.user_last_name || ''}`.trim() || 'Member')
        : 'Member';

      const res = await api.workouts.create({
        ...formData,
        workout_member_id: effectiveMemberId,
        memberId: effectiveMemberId,
        workout_member_name: memberFullName,
        memberName: memberFullName,
        workout_trainer_id: trainerId || formData.workout_trainer_id,
        trainerId: trainerId || formData.workout_trainer_id,
        trainerName: trainerName || 'Trainer'
      });
      if (onWorkoutCreated) onWorkoutCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create workout plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workout Plan" subtitle="Design custom training split for client">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <div style={{ color: '#CF1322', fontSize: '0.8rem' }}>{error}</div>}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Assign Member / Athlete *</label>
          <select
            required
            value={effectiveMemberId}
            onChange={e => setFormData({ ...formData, workout_member_id: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
          >
            {members.length === 0 ? (
              <option value="">No members registered</option>
            ) : (
              members.map(m => (
                <option key={m.ROWID} value={m.ROWID}>
                  {m.name || `${m.user_first_name || ''} ${m.user_last_name || ''}`.trim() || 'Member'} {m.user_email ? `(${m.user_email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Plan Title *</label>
          <input type="text" required value={formData.workout_title} onChange={e => setFormData({ ...formData, workout_title: e.target.value })} placeholder="e.g. 4-Day Strength & Hypertrophy" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Goal / Focus Description</label>
          <input type="text" value={formData.workout_description} onChange={e => setFormData({ ...formData, workout_description: e.target.value })} placeholder="Target: Compound strength, core stabilization" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Schedule & Exercises *</label>
          <textarea rows="4" required value={formData.workout_schedule} onChange={e => setFormData({ ...formData, workout_schedule: e.target.value })} placeholder="Day 1: Squats (4x8), Lunges (3x12) | Day 2: Bench Press (4x8), Dips (3x10)..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: '8px', background: '#C9A227', color: '#FFF', fontWeight: '700', border: 'none' }}>
            {loading ? 'Creating...' : 'Assign Workout'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// 5. Progress Tracking Modal
// 5. Progress Tracking Modal
export const ProgressModal = ({ isOpen, onClose, members = [], trainerId = '', onProgressLogged }) => {
  const [formData, setFormData] = useState({
    prog_member_id: '',
    prog_weight: '72.5',
    prog_body_fat: '17.5',
    prog_muscle_mass: '102',
    waistCm: '80',
    armsCm: '35',
    prog_notes: 'Consistent strength progression on core compound lifts and conditioning.'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        prog_member_id: prev.prog_member_id || (members.length > 0 ? String(members[0].ROWID || members[0].id) : '')
      }));
      setError('');
    }
  }, [isOpen, members]);

  const effectiveMemberId = formData.prog_member_id || (members.length > 0 ? String(members[0].ROWID || members[0].id) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveMemberId && members.length > 0) {
      setError('Please select a member.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedMember = members.find(m => String(m.ROWID || m.id) === String(effectiveMemberId)) || members[0] || {};
      const memberName = selectedMember
        ? (selectedMember.name || `${selectedMember.user_first_name || ''} ${selectedMember.user_last_name || ''}`.trim() || 'Member')
        : 'Member';
      const memberEmail = selectedMember.email || selectedMember.user_email || '';

      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.progress.create({
        ...formData,
        prog_member_id: effectiveMemberId,
        memberId: effectiveMemberId,
        memberName,
        memberEmail,
        prog_trainer_id: trainerId,
        recordedDate: todayStr,
        weightKg: formData.prog_weight,
        bodyFatPercentage: formData.prog_body_fat,
        chestCm: formData.prog_muscle_mass,
        waistCm: formData.waistCm,
        armsCm: formData.armsCm,
        notes: formData.prog_notes
      });
      if (onProgressLogged) onProgressLogged(res?.data || res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log progress assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Biometric Progress Assessment" subtitle="Record body composition, anthropometrics, and fitness milestones">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Athlete / Member *</label>
          {members.length === 1 ? (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#F8F8F6',
              border: '1px solid #E8E5DC',
              fontSize: '0.86rem',
              fontWeight: '700',
              color: '#242424',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{members[0].name || `${members[0].user_first_name || ''} ${members[0].user_last_name || ''}`.trim() || 'Member'}</span>
              <span style={{ fontSize: '0.74rem', color: '#A67C00', background: '#FAF6ED', padding: '2px 8px', borderRadius: '6px' }}>Enrolled Member</span>
            </div>
          ) : (
            <select
              required
              value={effectiveMemberId}
              onChange={e => setFormData({ ...formData, prog_member_id: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box', background: '#FFF' }}
            >
              {members.length === 0 ? (
                <option value="">No members registered</option>
              ) : (
                members.map(m => (
                  <option key={m.ROWID || m.id} value={m.ROWID || m.id}>
                    {m.name || `${m.user_first_name || ''} ${m.user_last_name || ''}`.trim() || 'Member'} {m.user_email || m.email ? `(${m.user_email || m.email})` : ''}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Weight (kg) *</label>
            <input
              type="text"
              required
              value={formData.prog_weight}
              onChange={e => setFormData({ ...formData, prog_weight: e.target.value })}
              placeholder="e.g. 72.5"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Body Fat (%) *</label>
            <input
              type="text"
              required
              value={formData.prog_body_fat}
              onChange={e => setFormData({ ...formData, prog_body_fat: e.target.value })}
              placeholder="e.g. 17.5"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Chest / Muscle (cm)</label>
            <input
              type="text"
              value={formData.prog_muscle_mass}
              onChange={e => setFormData({ ...formData, prog_muscle_mass: e.target.value })}
              placeholder="e.g. 102"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Waist (cm)</label>
            <input
              type="text"
              value={formData.waistCm}
              onChange={e => setFormData({ ...formData, waistCm: e.target.value })}
              placeholder="e.g. 80"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Arms / Biceps (cm)</label>
            <input
              type="text"
              value={formData.armsCm}
              onChange={e => setFormData({ ...formData, armsCm: e.target.value })}
              placeholder="e.g. 35"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '600', marginBottom: '4px', color: '#4A4A4A' }}>Assessment Notes & Goals</label>
          <textarea
            rows="3"
            value={formData.prog_notes}
            onChange={e => setFormData({ ...formData, prog_notes: e.target.value })}
            placeholder="Progress observations, personal records, nutrition adherence, or coach feedback..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFF', cursor: 'pointer', fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
              color: '#FFF',
              fontWeight: '700',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(201, 162, 39, 0.25)'
            }}
          >
            {loading ? 'Recording Assessment...' : '✓ Complete & Save Assessment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
