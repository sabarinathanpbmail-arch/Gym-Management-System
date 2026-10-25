import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginModal, OwnerSignupModal } from '../components/modals/AuthModals';
import { useAuth } from '../context/AuthContext';

export const PrivacyPolicy = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div style={{ background: '#FAFAF8', color: '#242424', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .legal-link-hover {
          color: #707070;
          text-decoration: none;
          position: relative;
          display: inline-block;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          transition: color 220ms ease, text-shadow 220ms ease;
        }
        .legal-link-hover::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #C9A227;
          transition: width 220ms ease;
        }
        .legal-link-hover:hover {
          color: #C9A227;
          text-shadow: 0 0 10px rgba(201, 162, 39, 0.2);
        }
        .legal-link-hover:hover::after {
          width: 100%;
        }
        .legal-section-card {
          background: #FFFFFF;
          border: 1px solid #E8E5DC;
          border-radius: 14px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .legal-section-card:hover {
          border-color: #E8D293;
          box-shadow: 0 6px 20px rgba(201, 162, 39, 0.08);
        }
        .gms-btn-primary {
          background: linear-gradient(135deg, #C9A227 0%, #A67C00 100%);
          color: #FFFFFF;
          border: none;
          box-shadow: 0 6px 20px rgba(201, 162, 39, 0.32);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gms-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(201, 162, 39, 0.42);
        }
        .gms-btn-secondary {
          background: #FFFFFF;
          color: #242424;
          border: 1px solid #E8E5DC;
          transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .gms-btn-secondary:hover {
          background: #FAF6ED;
          border-color: #E8D293;
          color: #A67C00;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 991px) {
          .legal-nav-desktop { display: none !important; }
          .legal-mobile-btn { display: inline-flex !important; }
        }
        @media (max-width: 640px) {
          .legal-brand-subtitle { display: none !important; }
          .legal-btn-get-started { display: none !important; }
        }
        @media (max-width: 480px) {
          .legal-btn-login { display: none !important; }
          .legal-brand-title { font-size: 0.98rem !important; }
        }
        @media (min-width: 992px) {
          .legal-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* Header / Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E8E5DC',
        height: '72px',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(201, 162, 39, 0.28)'
          }}>
            G
          </div>
          <div>
            <span className="legal-brand-title" style={{ fontSize: '1.12rem', fontWeight: '800', color: '#242424', letterSpacing: '-0.3px', display: 'block', lineHeight: 1.1 }}>
              Gym Management System
            </span>
            <span className="legal-brand-subtitle" style={{ fontSize: '0.68rem', color: '#A67C00', fontWeight: '600', letterSpacing: '0.5px' }}>
              Cloud Operations Platform
            </span>
          </div>
        </Link>

        {/* Center Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="legal-nav-desktop">
          <Link to="/" className="legal-link-hover" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Home</Link>
          <button type="button" onClick={() => goToSection('features')} className="legal-link-hover" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Features</button>
          <button type="button" onClick={() => goToSection('how-it-works')} className="legal-link-hover" style={{ fontSize: '0.9rem', fontWeight: '500' }}>How It Works</button>
          <button type="button" onClick={() => goToSection('about')} className="legal-link-hover" style={{ fontSize: '0.9rem', fontWeight: '500' }}>About</button>
          <Link to="/security" className="legal-link-hover" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Security</Link>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="gms-btn-primary"
              style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer' }}
            >
              Open Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="gms-btn-secondary legal-btn-login"
                style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '0.86rem', cursor: 'pointer' }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="gms-btn-primary legal-btn-get-started"
                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer' }}
              >
                Get Started
              </button>
            </>
          )}

          {/* Mobile Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            style={{ padding: '8px', borderRadius: '8px', background: '#F8F8F6', border: '1px solid #E8E5DC', color: '#242424', cursor: 'pointer', display: 'none' }}
            className="legal-mobile-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="legal-mobile-drawer" style={{
          position: 'fixed', top: '72px', left: 0, right: 0, background: '#FFFFFF',
          borderBottom: '1px solid #E8E5DC', padding: '20px 24px', display: 'flex',
          flexDirection: 'column', gap: '16px', zIndex: 999, boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#242424', fontWeight: '600' }}>Home</Link>
          <a href="/#features" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>Features</a>
          <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>How It Works</a>
          <a href="/#about" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>About</a>
          <Link to="/security" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>Security</Link>
          <Link to="/terms-of-service" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>Terms of Service</Link>
          <div style={{ borderTop: '1px solid #E8E5DC', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setShowLogin(true); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFFFFF', fontWeight: '700' }}>Log In</button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setShowSignup(true); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)', color: '#FFFFFF', fontWeight: '700', border: 'none' }}>Get Started</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 24px 80px 24px', width: '100%', boxSizing: 'border-box' }}>
        {/* Breadcrumb & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E8E5DC',
              color: '#242424',
              fontSize: '0.86rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Back to Home
          </button>
          <span style={{ fontSize: '0.82rem', color: '#707070' }}>
            Home / Legal / <strong>Privacy Policy</strong>
          </span>
        </div>

        {/* Page Hero Title */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '20px',
            background: '#FAF6ED',
            border: '1px solid #E8D293',
            fontSize: '0.78rem',
            fontWeight: '700',
            color: '#A67C00',
            marginBottom: '14px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C9A227' }}></span>
            LEGAL & PRIVACY COMPLIANCE
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: '800', color: '#242424', margin: '0 0 12px 0', letterSpacing: '-0.8px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1rem', color: '#707070', margin: 0 }}>
            <strong>Last updated:</strong> October 16, 2026
          </p>
        </div>

        {/* Legal Sections */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            1. Introduction
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Gym Management System (GMS) provides software tools designed to help gym owners, coaches, and staff operate facilities efficiently. Our platform facilitates member management, trainer assignment, membership tier configuration, attendance tracking, workout plans, and payment records. This Privacy Policy explains how personal and operational information is collected, processed, stored, and protected when you access or interact with GMS.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            2. Information We Collect
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '12px' }}>
            Depending on the role assigned and features enabled, GMS processes only the data strictly necessary for facility operations:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.92rem', color: '#4A4A4A', lineHeight: 1.8 }}>
            <li><strong>Account Information:</strong> Full name, email address, assigned system role (Owner, Trainer, Member, Manager, Staff), and authentication identifiers.</li>
            <li><strong>Facility Profile Data:</strong> Gym facility name, address, contact numbers, operating hours, and configuration preferences.</li>
            <li><strong>Member and Trainer Profiles:</strong> Contact phone numbers, emergency contact details, health/biometric preferences, coach assignments, and athlete rosters.</li>
            <li><strong>Membership Records:</strong> Membership plan tiers (e.g. Platinum, Gold, Basic), validity periods, start/expiry dates, renewal histories, and status flags.</li>
            <li><strong>Attendance & Check-in Timestamps:</strong> Exact front-desk check-in and check-out logs, terminal IDs, date stamps, and facility hourly occupancy records.</li>
            <li><strong>Workout & Progress Metrics:</strong> Assigned exercise split routines, sets, reps, weight logs, body fat percentages, and physical milestone progressions.</li>
            <li><strong>Payment & Billing Data:</strong> Payment transaction references, amounts paid, payment method types (Credit/Debit Card, UPI, Bank Transfer, Cash), invoice serials, and payment confirmation statuses. (Note: Raw payment card numbers are never stored directly in GMS; transactions are tokenized via secure payment providers).</li>
            <li><strong>Technical Operational Logs:</strong> Secure browser session tokens, IP addresses for security audit logging, system error traces, and performance diagnostics.</li>
          </ul>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            3. How Information Is Used
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '12px' }}>
            Collected data is utilized solely for authenticating authorized users and executing core gym management workflows:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.92rem', color: '#4A4A4A', lineHeight: 1.8 }}>
            <li>Provisioning and maintaining role-authorized user accounts.</li>
            <li>Processing membership activations, renewals, and expiration warnings.</li>
            <li>Recording attendance timestamps and preventing duplicate check-ins.</li>
            <li>Enabling personal trainers to assign exercises and log athlete metrics.</li>
            <li>Generating operational revenue ledgers and business growth dashboards for gym owners.</li>
            <li>Detecting unauthorized login attempts, safeguarding user credentials, and investigating system irregularities.</li>
            <li>Ensuring compliance with contractual obligations and audit recordkeeping.</li>
          </ul>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            4. Access and Permissions (Role-Based Access Control)
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS implements strict <strong>Role-Based Access Control (RBAC)</strong> enforced at the serverless API layer. Users are restricted to accessing only the data and functionality permitted for their validated role:
            <br /><br />
            • <strong>Gym Owners:</strong> Have full administrative access to their facility's member directory, staff invitations, subscription configuration, and payment ledgers.
            <br />
            • <strong>Trainers:</strong> Can view and update only their assigned athlete roster, workout routines, and progress records.
            <br />
            • <strong>Members:</strong> Can view only their personal membership pass, attendance history, and assigned workouts.
            <br />
            • <strong>Managers & Staff:</strong> Access front-desk check-in terminals and member lookup with restricted access that excludes financial transaction ledgers.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            5. Information Sharing and Third-Party Infrastructure
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS does not sell, rent, or monetize your personal information to third-party data brokers or advertisers. Data is processed exclusively by our verified cloud infrastructure providers necessary to operate the application:
            <br /><br />
            • <strong>Cloud Platform & Hosting:</strong> Zoho Catalyst Cloud Platform (Catalyst Serverless Java Functions and Catalyst Slate frontend hosting) with secure data centers.
            <br />
            • <strong>Relational Database:</strong> Zoho Catalyst Data Store for encrypted, tenant-segregated record persistence.
            <br />
            • <strong>Authentication Services:</strong> Zoho Catalyst Authentication for secure token generation, session management, and credential verification.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            6. Data Storage and Security
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            We apply industry-standard security safeguards to protect stored and transmitted data. All communications between user browsers and GMS servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS). Database records are isolated in cloud-hosted relational tables with parameterized queries to prevent SQL injection. While no digital platform can guarantee absolute invulnerability, we continuously monitor execution logs and apply security updates to mitigate vulnerabilities.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            7. Data Retention & Deletion
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Personal and operational data is retained only for the duration necessary to deliver the gym management services, fulfill legitimate business needs, and comply with legal, tax, and auditing requirements. When an account is terminated or a deletion request is formally verified, associated records are securely purged or anonymized in accordance with applicable retention schedules.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            8. User Rights and Data Requests
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Depending on your jurisdiction, you may have rights under applicable privacy legislation, including the right to access your personal records, request corrections to inaccurate entries, or request deletion of personal information where no overriding legal obligation requires its retention. Members should direct requests regarding their facility records to their respective gym administrator or reach out to our privacy contact.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            9. Cookies and Local Storage Technologies
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS uses browser local storage and strictly necessary session tokens exclusively to maintain your authenticated login state and remember UI preferences (such as selected dashboard tabs). We do not deploy third-party advertising cookies or cross-site tracking pixels on our landing or application pages.
          </p>
        </div>

        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            10. Policy Updates
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            We may periodically revise this Privacy Policy to reflect enhancements in application functionality or changes in statutory requirements. Any revisions will be published directly on this page with an updated "Last updated" date. We encourage users to review this page periodically.
          </p>
        </div>

        <div className="legal-section-card" style={{ borderColor: '#E8D293', background: '#FAF6ED' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            11. Contact Us
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '16px' }}>
            If you have questions regarding this Privacy Policy, your personal information, or wish to exercise your data rights, please contact our designated privacy office:
          </p>
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E8D293', fontSize: '0.92rem', color: '#242424' }}>
            <strong>Gym Management System — Privacy Compliance Office</strong><br />
            Email: <a href="mailto:privacy@aurum-gms.com" style={{ color: '#A67C00', fontWeight: '700' }}>privacy@aurum-gms.com</a><br />
            Platform: Zoho Catalyst Cloud Operations
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E8E5DC', padding: '50px 28px 30px 28px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)', color: '#FFFFFF', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>G</div>
                <strong style={{ fontSize: '1rem', color: '#242424' }}>Gym Management System</strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#707070', lineHeight: 1.6, margin: 0 }}>
                Simple, reliable, and professional operations platform for gym owners, coaches, and members.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Navigation</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Home</Link></li>
                <li><button type="button" onClick={() => goToSection('features')} className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Features</button></li>
                <li><button type="button" onClick={() => goToSection('how-it-works')} className="legal-link-hover" style={{ fontSize: '0.84rem' }}>How It Works</button></li>
                <li><button type="button" onClick={() => goToSection('about')} className="legal-link-hover" style={{ fontSize: '0.84rem' }}>About Roles</button></li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Legal & Security</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/privacy-policy" className="legal-link-hover" style={{ fontSize: '0.84rem', color: '#A67C00', fontWeight: '700' }}>Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Terms of Service</Link></li>
                <li><Link to="/security" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Security Architecture</Link></li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Contact & Access</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" onClick={() => setShowLogin(true)} className="legal-link-hover" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.84rem' }}>Log In to Account</button>
                <button type="button" onClick={() => setShowSignup(true)} className="legal-link-hover" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.84rem', color: '#A67C00', fontWeight: '700' }}>Create Gym Owner Account →</button>
                <a href="mailto:support@aurum-gms.com" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>support@aurum-gms.com</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #E8E5DC', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#999890' }}>
            <div>© {new Date().getFullYear()} Gym Management System. Built with Zoho Catalyst Cloud & Data Store.</div>
            <div style={{ display: 'flex', gap: '18px' }}>
              <Link to="/privacy-policy" className="legal-link-hover" style={{ fontSize: '0.78rem' }}>Privacy Policy</Link>
              <Link to="/terms-of-service" className="legal-link-hover" style={{ fontSize: '0.78rem' }}>Terms of Service</Link>
              <Link to="/security" className="legal-link-hover" style={{ fontSize: '0.78rem' }}>Security</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }} />
      <OwnerSignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }} />
    </div>
  );
};
