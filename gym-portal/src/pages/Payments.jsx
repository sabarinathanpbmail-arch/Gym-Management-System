import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth, getGymDisplayName, isSameGym } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { PaymentModal } from '../components/modals/OperationModals';

export const Payments = () => {
  const { role, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'Member') params.member_id = user?.ROWID;
      const [payRes, memRes] = await Promise.all([
        api.payments.getAll(params),
        api.members.getAll()
      ]);
      setPayments(Array.isArray(payRes.data) ? payRes.data : (Array.isArray(payRes) ? payRes : []));
      setMembers(Array.isArray(memRes.data) ? memRes.data : (Array.isArray(memRes) ? memRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const currentGym = getGymDisplayName(user, null);
  const safeMembers = Array.isArray(members) ? members : [];
  const visibleMembers = safeMembers.filter(m => {
    if (!currentGym) return true;
    const mGym = getGymDisplayName(m, user);
    return isSameGym(mGym, currentGym);
  });

  const safePayments = Array.isArray(payments) ? payments : [];
  const visiblePayments = safePayments.filter(p => {
    if (!currentGym) return true;
    const pGym = p.gymName || p.gym_name;
    if (pGym && !['Aurum Fitness Club', 'Fitness Club', 'Fitness Center'].includes(pGym)) {
      return isSameGym(pGym, currentGym);
    }
    const pMemberId = String(p.pay_member_id || p.memberId || '').trim();
    if (pMemberId) {
      return visibleMembers.some(m => String(m.ROWID) === pMemberId);
    }
    return isSameGym(currentGym, 'Sabari Fitness');
  });

  const totalRevenue = visiblePayments.reduce((sum, p) => sum + (parseFloat(p.pay_amount || p.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: 0 }}>
            {role === 'Member' ? 'My Billing & Invoices' : 'Payments & Revenue Ledger'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#707070', margin: '2px 0 0 0' }}>
            Verified financial transactions recorded in Catalyst Data Store
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#707070', textTransform: 'uppercase', fontWeight: '600' }}>Total Collected</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#237804', lineHeight: 1 }}>
              ${totalRevenue.toLocaleString()}
            </div>
          </div>

          {role === 'Owner' && (
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
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
              + Record Payment
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E5DC', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#FAF9F5', borderBottom: '1px solid #E8E5DC', color: '#707070', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <th style={{ padding: '14px 16px' }}>Receipt / Member</th>
              <th style={{ padding: '14px 16px' }}>Transaction Date</th>
              <th style={{ padding: '14px 16px' }}>Amount</th>
              <th style={{ padding: '14px 16px' }}>Payment Method</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#707070' }}>Loading payments ledger...</td>
              </tr>
            ) : visiblePayments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#707070' }}>No payment records found.</td>
              </tr>
            ) : (
              visiblePayments.map(p => {
                const member = visibleMembers.find(m => String(m.ROWID) === String(p.pay_member_id || p.memberId));
                return (
                  <tr key={p.ROWID || Math.random()} style={{ borderBottom: '1px solid #F0EDE5' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#242424' }}>
                        {member ? `${member.user_first_name || member.name} ${member.user_last_name || ''}`.trim() : (p.memberName || `Member #${p.pay_member_id || p.memberId || '1'}`)}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#A67C00', marginTop: '1px' }}>
                        {p.gymName || p.gym_name || (member ? getGymDisplayName(member, user) : currentGym)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#999890' }}>
                        Ref #{(p.ROWID || '000000').toString().slice(-6)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A' }}>{p.pay_date || p.paymentDate}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#237804', fontSize: '0.92rem' }}>
                      +${parseFloat(p.pay_amount || p.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#4A4A4A' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#F8F8F6', border: '1px solid #E8E5DC', fontSize: '0.76rem', fontWeight: '600' }}>
                        {p.pay_method || p.paymentMethod || 'Credit Card'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge status={p.pay_status || p.status || 'Completed'} />
                    </td>
                    <td style={{ padding: '14px 16px', color: '#707070', fontSize: '0.78rem' }}>
                      {p.pay_notes || p.invoiceNumber || 'Subscription renewal payment'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <PaymentModal isOpen={showPayModal} onClose={() => setShowPayModal(false)} members={visibleMembers} onPaymentRecorded={loadData} />
    </div>
  );
};
