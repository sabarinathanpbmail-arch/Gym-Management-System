import React from 'react';

export const StatCard = ({ title, value, subtitle, icon, trend, isGold = false }) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: isGold ? '1px solid rgba(201, 162, 39, 0.4)' : '1px solid #E8E5DC',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: isGold ? '0 4px 18px rgba(201, 162, 39, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      {isGold && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #C9A227 0%, #A67C00 100%)'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#707070', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#242424', marginTop: '4px', lineHeight: 1.1 }}>
            {value}
          </div>
        </div>

        {icon && (
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: isGold ? '#FAF6ED' : '#F8F8F6',
            color: isGold ? '#A67C00' : '#4A4A4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
        <span style={{ color: '#999890' }}>{subtitle}</span>
        {trend && (
          <span style={{
            color: trend.startsWith('+') ? '#237804' : '#707070',
            fontWeight: '600',
            background: trend.startsWith('+') ? '#EDF7EE' : '#F4F2EC',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
