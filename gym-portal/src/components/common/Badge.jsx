import React from 'react';

export const Badge = ({ status, text }) => {
  const label = text || status;
  let bg = '#F4F2EC';
  let color = '#707070';
  let border = '#E8E5DC';

  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'present':
    case 'checked in':
      bg = '#EDF7EE';
      color = '#237804';
      border = '#B7EB8F';
      break;
    case 'expiring':
    case 'expiring soon':
    case 'pending':
    case 'checked out':
      bg = '#FEF7E6';
      color = '#A67C00';
      border = '#FFE58F';
      break;
    case 'expired':
    case 'inactive':
    case 'cancelled':
      bg = '#FEEBEA';
      color = '#CF1322';
      border = '#FFA39E';
      break;
    case 'gold':
    case 'owner':
    case 'trainer':
      bg = '#FAF5E8';
      color = '#8C6700';
      border = '#E8D293';
      break;
    default:
      break;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '0.74rem',
      fontWeight: '600',
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      lineHeight: 1.2
    }}>
      {label}
    </span>
  );
};
