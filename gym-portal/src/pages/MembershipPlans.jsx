import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { PlanModal } from '../components/modals/OperationModals';
import { Modal } from '../components/common/Modal';

export const MembershipPlans = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isMember = String(role || user?.role || '').trim().toLowerCase() === 'member';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);

  // Delete confirmation modal state
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // In-use plan conflict / archive modal state
  const [planToArchive, setPlanToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGetPlan = async (plan) => {
    const planName = plan.planName || plan.plan_name || 'Membership Plan';
    const planPrice = plan.price !== undefined ? plan.price : (plan.plan_price !== undefined ? plan.plan_price : 0);
    const durationDays = plan.plan_duration_days || ((plan.durationMonths || 1) * 30);
    const currentMemberId = user?.ROWID || user?.id;
    const memberName = user?.name || `${user?.user_first_name || ''} ${user?.user_last_name || ''}`.trim() || 'Member';

    try {
      setEnrollingId(plan.ROWID);
      await api.subscriptions.create({
        memberId: currentMemberId,
        sub_member_id: currentMemberId,
        memberName: memberName,
        memberEmail: user?.email || '',
        planId: plan.ROWID,
        sub_plan_id: plan.ROWID,
        planName: planName,
        sub_plan_name: planName,
        amount: planPrice,
        sub_amount: planPrice,
        duration_days: durationDays,
        status: 'Active',
        sub_status: 'Active'
      });
      showNotification(`Successfully enrolled in "${planName}"! Redirecting to My Membership...`);
      setTimeout(() => {
        navigate('/subscriptions');
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to enroll in membership plan.');
    } finally {
      setEnrollingId(null);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.plans.getAll();
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setPlans(raw);
    } catch (err) {
      console.error('Failed to load membership plans:', err);
      setError(err.message || 'Unable to connect to Catalyst Data Store. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenDelete = (plan) => {
    setPlanToDelete(plan);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await api.plans.delete(planToDelete.ROWID);
      showNotification(`Membership plan "${planToDelete.planName || planToDelete.plan_name}" deleted successfully.`);
      setPlanToDelete(null);
      loadPlans();
    } catch (err) {
      const msg = err.message || '';
      // Check if plan has active or historical subscriptions (409 Conflict)
      if (msg.includes('in use') || msg.includes('subscription') || msg.includes('409') || err.status === 409) {
        // Switch to the Archive / Deactivate prompt
        const inUsePlan = planToDelete;
        setPlanToDelete(null);
        setPlanToArchive({
          ...inUsePlan,
          reason: msg || 'This plan is currently associated with active or historical member subscriptions.'
        });
      } else {
        setDeleteError(msg || 'Failed to delete membership plan.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!planToArchive) return;
    setArchiving(true);
    try {
      await api.plans.archive(planToArchive.ROWID);
      showNotification(`Membership plan "${planToArchive.planName || planToArchive.plan_name}" was deactivated/archived to preserve subscription history.`);
      setPlanToArchive(null);
      loadPlans();
    } catch (err) {
      alert(`Deactivation failed: ${err.message}`);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Actions */}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              Gym Membership Packages
            </h3>
            <span style={{ fontSize: '0.74rem', background: '#FAF6ED', color: '#A67C00', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              Data Store Synced
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#707070', margin: '2px 0 0 0' }}>
            Tier offerings, subscription validity, and pricing models configured for Aurum Gym
          </p>
        </div>

        {role === 'Owner' && (
          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: '#C9A227',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(201, 162, 39, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span>
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: notification.type === 'error' ? '#FEEBEA' : '#EDF7EE',
          border: `1px solid ${notification.type === 'error' ? '#FFA39E' : '#B7EB8F'}`,
          color: notification.type === 'error' ? '#CF1322' : '#237804',
          fontSize: '0.86rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8E5DC'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E8E5DC',
            borderTopColor: '#C9A227',
            borderRadius: '50%',
            margin: '0 auto 12px auto',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ fontSize: '0.88rem', color: '#707070', margin: 0, fontWeight: '600' }}>
            Loading membership plans from Catalyst Data Store...
          </p>
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #FFA39E'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#CF1322', margin: '0 0 6px 0' }}>
            Unable to Load Membership Plans
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#707070', margin: '0 0 16px 0', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={loadPlans}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#C9A227',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.84rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && plans.length === 0 && (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8E5DC'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#FAF6ED',
            color: '#C9A227',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 16px auto'
          }}>
            📋
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#242424', margin: '0 0 6px 0' }}>
            No Membership Plans Found
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#707070', margin: '0 0 20px 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Create your gym's first membership tier to start enrolling athletes and recording subscription revenue.
          </p>
          {role === 'Owner' && (
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: '#C9A227',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.86rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              + Create First Plan
            </button>
          )}
        </div>
      )}

      {/* Plans Grid */}
      {!loading && !error && plans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
          {plans.map(p => {
            const planName = p.planName || p.plan_name || 'Membership Plan';
            const price = p.price !== undefined ? p.price : (p.plan_price !== undefined ? p.plan_price : 0);
            const durationMonths = p.durationMonths || Math.max(1, Math.round((p.plan_duration_days || 30) / 30));
            const durationDays = p.plan_duration_days || durationMonths * 30;
            const description = p.description || p.plan_description || 'Full gym facility access';
            const features = p.features || '';
            const status = p.status || p.plan_status || 'Active';
            const rowId = String(p.ROWID || '');

            return (
              <div
                key={rowId || planName}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: status === 'Active' ? '1px solid #E8E5DC' : '1px dashed #D0CCC2',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  opacity: status === 'Active' ? 1 : 0.75
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '24px',
                  right: '24px',
                  height: '3px',
                  background: status === 'Active' ? 'linear-gradient(90deg, #C9A227 0%, #A67C00 100%)' : '#B8B5AD'
                }} />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Badge status={status} />
                    <span style={{ fontSize: '0.74rem', color: '#707070', fontWeight: '600' }}>
                      {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'} ({durationDays} Days)
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#242424', margin: '8px 0 4px 0' }}>
                    {planName}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0' }}>
                    <span style={{ fontSize: '2.1rem', fontWeight: '800', color: '#242424', lineHeight: 1 }}>
                      ${Number(price).toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#707070' }}>
                      / {durationMonths === 1 ? 'month' : `${durationMonths} mos`}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                    {description}
                  </p>

                  {features && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#FAF8F5',
                      border: '1px solid #F0EDE5',
                      fontSize: '0.78rem',
                      color: '#606060',
                      marginBottom: '10px'
                    }}>
                      ✨ {features}
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid #F0EDE5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.74rem', color: '#999890' }}>
                    {rowId ? `ID: #${rowId.slice(-6)}` : 'ID: pending'}
                  </span>
                  
                  {isMember ? (
                    <button
                      type="button"
                      disabled={enrollingId === p.ROWID}
                      onClick={() => handleGetPlan(p)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: enrollingId === p.ROWID ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(201, 162, 39, 0.25)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {enrollingId === p.ROWID ? 'Enrolling...' : 'Get Plan'}
                    </button>
                  ) : (role === 'Owner' && (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(p)}
                      style={{
                        fontSize: '0.76rem',
                        color: '#CF1322',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !deleting && setPlanToDelete(null)}
          title="Delete Membership Plan"
          subtitle="Confirm package removal from gym catalog"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deleteError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEEBEA', border: '1px solid #FFA39E', color: '#CF1322', fontSize: '0.82rem' }}>
                {deleteError}
              </div>
            )}

            <div style={{
              padding: '14px',
              borderRadius: '8px',
              background: '#FFF1F0',
              border: '1px solid #FFA39E',
              display: 'flex',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#CF1322', display: 'block', marginBottom: '4px' }}>
                  Permanent Deletion Warning
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#4A4A4A', margin: 0, lineHeight: 1.4 }}>
                  Are you sure you want to delete <strong>{planToDelete.planName || planToDelete.plan_name}</strong> (${planToDelete.price ?? planToDelete.plan_price})?
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#707070', margin: 0 }}>
              Note: If this plan is currently associated with active or historical member subscriptions, permanent deletion will be prevented to protect accounting history.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPlanToDelete(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E8E5DC',
                  background: '#FFFFFF',
                  color: '#707070',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#CF1322',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* In-Use Plan Deactivate / Archive Modal */}
      {planToArchive && (
        <Modal
          isOpen={true}
          onClose={() => !archiving && setPlanToArchive(null)}
          title="Plan Currently In Use"
          subtitle="Subscription dependency detected"
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px',
              borderRadius: '8px',
              background: '#FAF6ED',
              border: '1px solid #E8D293',
              display: 'flex',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>🛡️</span>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#A67C00', display: 'block', marginBottom: '4px' }}>
                  Data Integrity Safeguard
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#4A4A4A', margin: 0, lineHeight: 1.4 }}>
                  <strong>{planToArchive.planName || planToArchive.plan_name}</strong> is referenced by existing member subscriptions. Deleting it would compromise subscriber and revenue audit logs.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#606060', margin: 0, lineHeight: 1.5 }}>
              Would you like to <strong>deactivate / archive</strong> this plan instead? This marks the plan inactive so no new members can purchase it, while fully preserving historical billing records.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                disabled={archiving}
                onClick={() => setPlanToArchive(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E8E5DC',
                  background: '#FFFFFF',
                  color: '#707070',
                  cursor: 'pointer'
                }}
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleConfirmArchive}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: archiving ? 'not-allowed' : 'pointer'
                }}
              >
                {archiving ? 'Archiving...' : 'Deactivate / Archive Plan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Plan Modal */}
      <PlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onPlanCreated={() => {
          showNotification('New membership plan created successfully in Catalyst Data Store.');
          loadPlans();
        }}
      />
    </div>
  );
};

export default MembershipPlans;
