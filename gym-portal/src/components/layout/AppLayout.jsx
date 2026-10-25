import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
//AppLayout is used to assign the Title and Subtile 
export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Compute page titles based on current route
  //getPageMeta is used for the subtitle of title.
  const getPageMeta = () => {
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('/trainer')) return { title: 'Trainer Dashboard', subtitle: 'Athlete coaching, workout splits & assessment logs' };
    if (path.includes('/member')) return { title: 'Member Dashboard', subtitle: 'Membership passes, scheduled workouts & fitness progress' };
    if (path.includes('/staff')) return { title: 'Staff Dashboard', subtitle: 'Front desk operations, check-in kiosk & member registrations' };
    if (path === '/dashboard') return { title: 'Gym Owner Dashboard', subtitle: 'Live metrics, facility operations, and revenue ledger' };
    if (path === '/members') return { title: 'Members Directory', subtitle: 'Search, manage, and assign coaching' };
    if (path === '/trainers') return { title: 'Trainers & Coaches', subtitle: 'Active coaching team and assignments' };
    if (path === '/plans') return { title: 'Membership Plans', subtitle: 'Packages, durations, and tier pricing' };
    if (path === '/subscriptions') return { title: 'Subscriptions', subtitle: 'Active, expiring, and renewed memberships' };
    if (path === '/payments') return { title: 'Payments & Revenue', subtitle: 'Transactions, payment methods, and ledger' };
    if (path === '/attendance') return { title: 'Daily Attendance', subtitle: 'Member check-in, check-out, and logs' };
    if (path === '/workouts') return { title: 'Workout Programs', subtitle: 'Custom schedules, splits, and training sets' };
    if (path === '/progress') return { title: 'Fitness Progress', subtitle: 'Weight, body composition, and milestone logs' };
    if (path === '/profile') return { title: 'Profile & Settings', subtitle: 'Account preferences and security credentials' };
    return { title: 'Gym Management System', subtitle: 'Cloud Operations' };
  };

  const { title, subtitle } = getPageMeta();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8F6' }}>
      {/* Sidebar for Desktop & Mobile Overlay */}
      <Sidebar isOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 85
          }}
        />
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={title}
          pageSubtitle={subtitle}
        />
        <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
