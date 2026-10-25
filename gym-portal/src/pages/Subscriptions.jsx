import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { SubscriptionModal } from '../components/modals/OperationModals';

export const Subscriptions = () => {
  const { role, user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubModal, setShowSubModal] = useState(false);
  
  // Selected plan for Purchase Modal
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit / Debit Card');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notice, setNotice] = useState(null);

  const tableRef = useRef(null);
  const plansSectionRef = useRef(null);

  const currentMemberId = user?.ROWID || user?.id;
  const isMember = String(role || user?.role || '').trim().toLowerCase() === 'member';
  const currentGym = getGymDisplayName(user, user);

  const visibleMembers = React.useMemo(() => {
    if (!Array.isArray(members)) return [];
    return members.filter(m => isSameGym(getGymDisplayName(m, user), currentGym));
  }, [members, currentGym, user]);

  const visibleSubscriptions = React.useMemo(() => {
    if (!Array.isArray(subscriptions)) return [];
    if (isMember) return subscriptions;
    return subscriptions.filter(s => {
      const targetGym = s.gym_name || s.gymName;
      if (targetGym && !isSameGym(targetGym, currentGym)) return false;
      const memId = String(s.sub_member_id || s.memberId || '');
      if (memId) {
        const belongsToVisible = visibleMembers.some(m => String(m.ROWID) === memId);
        if (belongsToVisible) return true;
        const belongsToOther = members.some(m => String(m.ROWID) === memId && !isSameGym(getGymDisplayName(m, user), currentGym));
        if (belongsToOther) return false;
      }
      return true;
    });
  }, [subscriptions, visibleMembers, members, currentGym, isMember, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (isMember && currentMemberId) {
        params.member_id = currentMemberId;
      }
      if (isMember && user?.email) {
        params.email = user.email;
      }

      const [subRes, memRes, planRes] = await Promise.all([
        api.subscriptions.getAll(params),
        api.members.getAll().catch(() => ({ data: [] })),
        api.plans.getAll().catch(() => ({ data: [] }))
      ]);

      let rawSubs = Array.isArray(subRes.data) ? subRes.data : (Array.isArray(subRes) ? subRes : []);
      if (isMember) {
        const uId = String(currentMemberId || '').trim();
        const uEmail = String(user?.email || user?.user_email || '').toLowerCase().trim();
        const uName = String(user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}` || '').toLowerCase().trim();

        rawSubs = rawSubs.filter(s => {
          const sMemberId = String(s.sub_member_id || s.memberId || '').trim();
          const sEmail = String(s.memberEmail || s.email || '').toLowerCase().trim();
          const sName = String(s.memberName || s.name || '').toLowerCase().trim();

          const matchId = uId && sMemberId && uId === sMemberId;
          const matchEmail = uEmail && sEmail && uEmail === sEmail;
          const matchName = uName && sName && (uName === sName || uName.includes(sName) || sName.includes(uName));

          return matchId || matchEmail || matchName;
        });
      }

      setSubscriptions(rawSubs);
      setMembers(Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []));
      setPlans(Array.isArray(planRes.data) ? planRes.data : (Array.isArray(planRes) ? planRes : []));
    } catch (err) {
      console.error('Failed to load subscriptions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 0;
    try {
      const end = new Date(endDateStr);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff;
    } catch (e) {
      return 0;
    }
  };

  const handleOpenBuyModal = (plan) => {
    setSelectedPlanForPurchase(plan);
    setPaymentMethod('Credit / Debit Card');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlanForPurchase) return;

    const plan = selectedPlanForPurchase;
    const planName = plan.planName || plan.plan_name || 'Membership Plan';
    const planPrice = plan.price !== undefined ? plan.price : (plan.plan_price !== undefined ? plan.plan_price : 0);
    const durationDays = plan.plan_duration_days || ((plan.durationMonths || 1) * 30);
    const memberName = user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member';
    const memberEmail = user?.email || user?.user_email || '';

    setIsPurchasing(true);
    try {
      await api.subscriptions.create({
        memberId: currentMemberId,
        sub_member_id: currentMemberId,
        memberName: memberName,
        memberEmail: memberEmail,
        planId: plan.ROWID,
        sub_plan_id: plan.ROWID,
        planName: planName,
        sub_plan_name: planName,
        amount: planPrice,
        sub_amount: planPrice,
        duration_days: durationDays,
        payment_method: paymentMethod,
        record_payment: true,
        status: 'Active',
        sub_status: 'Active'
      });

      setSelectedPlanForPurchase(null);
      setNotice({
        type: 'success',
        text: `🎉 Congratulations ${memberName}! You have successfully purchased "${planName}". Your gym membership pass is now active!`
      });

      // Reload data to reflect new active subscription
      await loadData();

      // Scroll to table so member sees their pass right away
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setTimeout(() => setNotice(null), 8000);
    } catch (err) {
      alert(err.message || 'Failed to complete membership purchase.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const scrollToExplore = () => {
    if (plansSectionRef.current) {
      plansSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '18px 24px',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.12rem', fontWeight: '800', color: '#242424', margin: 0 }}>
            {isMember ? 'My Membership Pass & Packages' : 'Member Subscriptions & Renewals'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#707070', margin: '3px 0 0 0' }}>
            {isMember 
              ? 'View your active membership status, explore gym plans, and buy or upgrade passes.'
              : 'Track active memberships, validity periods, remaining days, and package status'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isMember ? (
            <button
              type="button"
              onClick={scrollToExplore}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.86rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(201, 162, 39, 0.3)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Explore Membership Plans
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={scrollToExplore}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#F0EDE5',
                  color: '#242424',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  border: '1px solid #E8E5DC',
                  cursor: 'pointer'
                }}
              >
                View Plans Catalog
              </button>
              <button
                type="button"
                onClick={() => setShowSubModal(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#242424',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                + Assign Membership
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation / Notification Banner */}
      {notice && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: '#EDF7EE',
          color: '#237804',
          border: '1px solid #B7EB8F',
          fontSize: '0.88rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(35, 120, 4, 0.1)'
        }}>
          <div>{notice.text}</div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: 'none', border: 'none', color: '#237804', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Subscriptions Table Section */}
      <div ref={tableRef} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EDE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#242424' }}>
              {isMember ? 'My Active Membership Pass' : 'Enrolled Subscriptions'}
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#707070' }}>
              {isMember ? 'Live membership validity and pass details' : 'All athlete subscription records'}
            </span>
          </div>
          {isMember && visibleSubscriptions.length > 0 && (
            <button
              type="button"
              onClick={scrollToExplore}
              style={{
                fontSize: '0.8rem',
                color: '#A67C00',
                background: 'none',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              + Buy Additional Plan or Upgrade &rarr;
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#FAF9F5', borderBottom: '1px solid #E8E5DC', color: '#707070', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <th style={{ padding: '14px 16px' }}>Member</th>
              <th style={{ padding: '14px 16px' }}>Enrolled Plan</th>
              <th style={{ padding: '14px 16px' }}>Start Date</th>
              <th style={{ padding: '14px 16px' }}>End Date</th>
              <th style={{ padding: '14px 16px' }}>Remaining</th>
              <th style={{ padding: '14px 16px' }}>Amount</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#707070' }}>Loading membership subscriptions...</td>
              </tr>
            ) : (!Array.isArray(visibleSubscriptions) || visibleSubscriptions.length === 0) ? (
              <tr>
                <td colSpan="7" style={{ padding: '44px 24px', textAlign: 'center', color: '#707070' }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>💳</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '800', color: '#242424' }}>
                    {isMember ? 'You do not have an active membership pass.' : 'No active subscriptions found.'}
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '0.85rem', color: '#707070', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                    {isMember 
                      ? 'Explore our membership packages below, choose your desired plan, and click "Buy Plan" to activate your pass immediately.' 
                      : 'Assign a new membership plan to a registered athlete.'}
                  </p>
                  <button
                    type="button"
                    onClick={scrollToExplore}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(201, 162, 39, 0.28)'
                    }}
                  >
                    Explore Membership Plans &rarr;
                  </button>
                </td>
              </tr>
            ) : (
              visibleSubscriptions.map(s => {
                const member = Array.isArray(members) ? members.find(m => String(m.ROWID) === String(s.sub_member_id || s.memberId)) : null;
                const planTitle = s.planName || s.sub_plan_name || 'Membership Plan';
                const sDate = s.startDate || s.sub_start_date || '-';
                const eDate = s.endDate || s.sub_end_date || '-';
                const daysLeft = calculateDaysRemaining(eDate);
                const isExpiring = daysLeft > 0 && daysLeft <= 30;
                const amtVal = s.amount !== undefined ? s.amount : (s.sub_amount !== undefined ? s.sub_amount : 0);
                const stVal = s.status || s.sub_status || 'Active';

                const displayMemberName = s.memberName || (member ? `${member.user_first_name || member.name} ${member.user_last_name || ''}`.trim() : (isMember ? (user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member') : `Member #${s.sub_member_id || s.memberId || '1'}`));
                const displayMemberEmail = member?.user_email || member?.email || (isMember ? user?.email : '');

                return (
                  <tr key={s.ROWID || Math.random()} style={{ borderBottom: '1px solid #F0EDE5' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#242424' }}>
                        {displayMemberName}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                        {getGymDisplayName(member, user)}
                      </div>
                      {displayMemberEmail && (
                        <div style={{ fontSize: '0.74rem', color: '#707070' }}>{displayMemberEmail}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#A67C00' }}>
                      {planTitle}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A', whiteSpace: 'nowrap' }}>{sDate}</td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A', whiteSpace: 'nowrap' }}>{eDate}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        background: daysLeft > 30 ? '#EDF7EE' : isExpiring ? '#FEF7E6' : '#FEEBEA',
                        color: daysLeft > 30 ? '#237804' : isExpiring ? '#A67C00' : '#CF1322'
                      }}>
                        {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#242424', whiteSpace: 'nowrap' }}>
                      ${Number(amtVal).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <Badge status={stVal} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* 2. Explore Our Membership Plans Section */}
      <div 
        ref={plansSectionRef}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E8E5DC',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF6ED', color: '#A67C00', fontSize: '0.74rem', fontWeight: '800', padding: '3px 10px', borderRadius: '6px', marginBottom: '8px' }}>
            ✨ MEMBERSHIP PACKAGES
          </div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#242424', margin: '0 0 4px 0' }}>
            Explore Our Membership Plans
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#707070', margin: 0 }}>
            Choose a plan that fits your workout routine. Click <strong>"Buy Plan"</strong> to activate your pass and train immediately.
          </p>
        </div>

        {plans.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#707070', fontSize: '0.88rem' }}>
            No plans available at this moment. Please visit our front desk.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {plans.map(p => {
              const pName = p.planName || p.plan_name || 'Membership Plan';
              const pPrice = p.price !== undefined ? p.price : (p.plan_price !== undefined ? p.plan_price : 0);
              const durationMonths = p.durationMonths || Math.max(1, Math.round((p.plan_duration_days || 30) / 30));
              const durationDays = p.plan_duration_days || durationMonths * 30;

              // Check if member already has this plan active
              const isCurrentPlan = visibleSubscriptions.some(s => 
                (s.planId === p.ROWID || s.sub_plan_id === p.ROWID || s.planName === pName || s.sub_plan_name === pName) &&
                (s.status === 'Active' || s.sub_status === 'Active')
              );

              return (
                <div
                  key={p.ROWID || pName}
                  style={{
                    background: isCurrentPlan ? '#FFFDF8' : '#FAF9F5',
                    borderRadius: '14px',
                    border: isCurrentPlan ? '2px solid #C9A227' : '1px solid #E8E5DC',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    position: 'relative',
                    boxShadow: isCurrentPlan ? '0 4px 16px rgba(201, 162, 39, 0.15)' : 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {isCurrentPlan && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      CURRENT PASS
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', background: '#FAF6ED', color: '#A67C00', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                        {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'} ({durationDays} Days)
                      </span>
                      <Badge status={p.status || p.plan_status || 'Active'} />
                    </div>

                    <h5 style={{ fontSize: '1.12rem', fontWeight: '800', color: '#242424', margin: '12px 0 4px 0' }}>
                      {pName}
                    </h5>

                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#242424', margin: '10px 0' }}>
                      ${Number(pPrice).toFixed(2)}
                      <span style={{ fontSize: '0.8rem', color: '#707070', fontWeight: '500' }}> / term</span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#4A4A4A', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      {p.description || p.plan_description || 'Full gym facility and equipment access.'}
                    </p>

                    {p.features && (
                      <div style={{ fontSize: '0.76rem', color: '#505050', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8E5DC', lineHeight: 1.4 }}>
                        ✨ {p.features}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBuyModal(p)}
                    style={{
                      padding: '11px 16px',
                      borderRadius: '8px',
                      background: isCurrentPlan 
                        ? '#242424' 
                        : 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '0.86rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isCurrentPlan ? 'none' : '0 2px 8px rgba(201, 162, 39, 0.25)'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    {isCurrentPlan ? 'Renew This Plan' : 'Buy / Add Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Interactive Buy Plan Confirmation Modal */}
      {selectedPlanForPurchase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            border: '1px solid #E8E5DC'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F0EDE5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF9F5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800'
                }}>
                  💳
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: '800', color: '#242424' }}>
                    Confirm Membership Purchase
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#707070' }}>Instant activation upon confirmation</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isPurchasing}
                onClick={() => setSelectedPlanForPurchase(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#707070',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Selected Plan Details Box */}
              <div style={{
                background: '#FAF6ED',
                border: '1px solid #E8D293',
                borderRadius: '12px',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#874D00', textTransform: 'uppercase' }}>
                    Selected Package
                  </span>
                  <span style={{ fontSize: '0.76rem', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', color: '#A67C00', border: '1px solid #E8D293' }}>
                    {(selectedPlanForPurchase.durationMonths || 1) * 30} Days Validity
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#242424' }}>
                    {selectedPlanForPurchase.planName || selectedPlanForPurchase.plan_name}
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#A67C00' }}>
                    ${Number(selectedPlanForPurchase.price !== undefined ? selectedPlanForPurchase.price : selectedPlanForPurchase.plan_price || 0).toFixed(2)}
                  </div>
                </div>

                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#606060' }}>
                  {selectedPlanForPurchase.description || 'Full access to gym equipment, locker rooms, and certified trainers.'}
                </p>
              </div>

              {/* Member Summary */}
              <div style={{
                background: '#FAF9F5',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid #E8E5DC',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707070' }}>Enrolling Member:</span>
                  <strong style={{ color: '#242424' }}>{user?.name || 'Member'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707070' }}>Email:</span>
                  <span style={{ color: '#242424' }}>{user?.email || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#707070' }}>Access Starts:</span>
                  <span style={{ color: '#237804', fontWeight: '700' }}>Immediately (Today)</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#242424', marginBottom: '8px' }}>
                  Choose Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['Credit / Debit Card', 'UPI / Net Banking', 'Pay at Gym Counter'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: paymentMethod === method ? '2px solid #C9A227' : '1px solid #E8E5DC',
                        background: paymentMethod === method ? '#FAF6ED' : '#FFFFFF',
                        color: paymentMethod === method ? '#874D00' : '#4A4A4A',
                        fontWeight: paymentMethod === method ? '700' : '500',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {paymentMethod === method ? '✓ ' : '○ '} {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #F0EDE5',
              background: '#FAF9F5',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                disabled={isPurchasing}
                onClick={() => setSelectedPlanForPurchase(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #E8E5DC',
                  background: '#FFFFFF',
                  color: '#4A4A4A',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurchasing}
                onClick={handleConfirmPurchase}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: isPurchasing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 10px rgba(201, 162, 39, 0.3)'
                }}
              >
                {isPurchasing ? (
                  <>Processing Purchase...</>
                ) : (
                  <>
                    <span>💳</span>
                    Confirm &amp; Buy Plan (${Number(selectedPlanForPurchase.price !== undefined ? selectedPlanForPurchase.price : selectedPlanForPurchase.plan_price || 0).toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner / Staff Modal to assign membership */}
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
        members={visibleMembers} 
        plans={plans} 
        onSubCreated={loadData} 
      />
    </div>
  );
};
