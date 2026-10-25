import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar, pageTitle = 'Dashboard', pageSubtitle = 'Gym overview and live metrics' }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, title: 'Expiring Soon', text: 'Alex Mercer membership renews in 20 days.', time: '10m ago' },
    { id: 2, title: 'New Attendance', text: 'Jessica Miller checked out at 08:15 AM.', time: '1h ago' },
    { id: 3, title: 'Payment Confirmed', text: '$899 recorded for Gold Annual Pro.', time: 'Yesterday' }
  ];

  const isOwnerRole = /^owner$/i.test(role || user?.role || user?.user_role || '');
  const userFirst = user?.user_first_name || (user?.name ? user.name.split(' ')[0] : '');
  let displayGym = user?.gymName || user?.gym_name;
  if (!isOwnerRole && displayGym && userFirst && displayGym.toLowerCase() === `${userFirst.toLowerCase()} fitness`) {
    displayGym = null;
  }
  const navbarGymName = displayGym || (isOwnerRole && userFirst ? `${userFirst} Fitness` : 'Sabari Fitness');

  return (
    <header className="top-header" style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E8E5DC',
      padding: '0 24px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: '1px solid #E8E5DC',
            background: '#FFFFFF',
            color: '#242424',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#242424', margin: 0, lineHeight: 1.2 }}>
            {pageTitle}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#707070', margin: '2px 0 0 0' }}>
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Role Switcher, Notifications, User Meta, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Notifications Icon & Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E8E5DC',
              background: '#FFFFFF',
              color: '#242424',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C9A227'
            }}></span>
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: '0',
              width: '290px',
              background: '#FFFFFF',
              border: '1px solid #E8E5DC',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              padding: '12px',
              zIndex: 1000
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #F0EDE5' }}>
                <strong style={{ fontSize: '0.85rem', color: '#242424' }}>Notifications</strong>
                <span style={{ fontSize: '0.72rem', color: '#C9A227', fontWeight: '600' }}>3 New</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '6px 8px', borderRadius: '6px', background: '#F8F8F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: '600', color: '#242424' }}>
                      <span>{n.title}</span>
                      <span style={{ fontSize: '0.68rem', color: '#999890' }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#707070' }}>{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 10px', borderRadius: '8px', background: '#F8F8F6', border: '1px solid #E8E5DC' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#C9A227',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {user?.user_first_name ? user.user_first_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#242424', lineHeight: 1.2 }}>
              {user?.user_first_name ? `${user.user_first_name} ${user.user_last_name || ''}`.trim() : (user?.name || 'Loading...')}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: '#A67C00',
              lineHeight: 1.2
            }}>
              {navbarGymName}
            </span>
            <span style={{
              fontSize: '0.64rem',
              fontWeight: '600',
              color: '#8C8C8C',
              textTransform: 'uppercase'
            }}>
              {role || 'User'}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #E8E5DC',
            background: '#FFFFFF',
            color: '#707070',
            fontSize: '0.82rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Sign out of current account"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
