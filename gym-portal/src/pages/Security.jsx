import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginModal, OwnerSignupModal } from '../components/modals/AuthModals';
import { useAuth } from '../context/AuthContext';

export const Security = () => {
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
          <Link to="/security" className="legal-link-hover" style={{ fontSize: '0.9rem', color: '#A67C00', fontWeight: '700' }}>Security</Link>
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
          <Link to="/security" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#A67C00', fontWeight: '700' }}>Security</Link>
          <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>Privacy Policy</Link>
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
            Home / Trust & Safety / <strong>Security Architecture</strong>
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
            INFRASTRUCTURE & DATA PROTECTION
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: '800', color: '#242424', margin: '0 0 12px 0', letterSpacing: '-0.8px' }}>
            Security at GMS
          </h1>
          <p style={{ fontSize: '1rem', color: '#707070', margin: 0 }}>
            An overview of the real security controls, encryption, and authentication safeguards engineered into the Gym Management System.
          </p>
        </div>

        {/* Section 1 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              1. Authentication Architecture
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS authenticates users through the <strong>Zoho Catalyst Authentication SDK</strong>. User passwords are encrypted and hashed server-side using cryptographically secure algorithms before storage; plain-text passwords are never accessible or stored. The public signup flow is restricted exclusively to facility owners through verified backend endpoints that validate account creation parameters before granting initial administrative privileges. Account recovery and password resets are handled via time-sensitive, one-time verification tokens sent to registered email addresses.
          </p>
        </div>

        {/* Section 2 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              2. Server-Enforced Role-Based Access Control (RBAC)
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Access boundaries in GMS are strictly enforced on the server, not merely hidden in the frontend interface. Every API request passes through role verification middleware before querying data:
            <br /><br />
            • <strong>Gym Owners:</strong> Authorized to execute administrative write operations, invite staff, manage membership plans, and audit the financial payment ledger.
            <br />
            • <strong>Personal Trainers:</strong> Scoped strictly to client records explicitly assigned to them. Trainers cannot view other coaches' rosters or gym-wide financial records.
            <br />
            • <strong>Members:</strong> Read access is restricted strictly to their own profile, active membership status, and assigned workouts.
            <br />
            • <strong>Front-Desk Staff:</strong> Authorized to search member records and log attendance check-ins, with explicit omission of financial reporting tools.
          </p>
        </div>

        {/* Section 3 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔒</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              3. Data Protection in Transit and at Rest
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            • <strong>Data in Transit:</strong> All HTTP traffic between client browsers and GMS endpoints is encrypted using Transport Layer Security (TLS 1.3 / HTTPS) with signed SSL certificates. Unencrypted HTTP traffic is rejected.
            <br /><br />
            • <strong>Data at Rest:</strong> Application records are persisted in the Zoho Catalyst Data Store, an enterprise-grade relational database running in secure, certified cloud data centers. Data files and object storage are secured with access tokens requiring active authenticated sessions.
          </p>
        </div>

        {/* Section 4 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              4. API Security & Query Protection
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            All serverless functions, Java microservices, and API gateways implement defense-in-depth protections:
            <br /><br />
            • <strong>Injection Prevention:</strong> All database interactions utilize parameterized ZCQL (Zoho Catalyst Query Language) statements, preventing SQL/ZCQL injection attacks.
            <br />
            • <strong>Input Sanitization:</strong> Request bodies and parameters are validated for length, type, and format before processing.
            <br />
            • <strong>Safe Error Handling:</strong> Internal stack traces, server environment paths, and database schema errors are suppressed in API responses to prevent information leakage.
          </p>
        </div>

        {/* Section 5 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              5. Account and Session Protection
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            • <strong>Session Expiry:</strong> Authentication tokens expire automatically after periods of inactivity, requiring re-authentication.
            <br /><br />
            • <strong>Immediate Revocation:</strong> Clicking "Sign Out" terminates the session immediately, clearing local auth caches and invalidating session headers on subsequent API calls.
            <br /><br />
            • <strong>Brute-Force Safeguards:</strong> Consecutive failed login attempts trigger temporary exponential backoff rate limits managed by Catalyst Authentication infrastructure.
          </p>
        </div>

        {/* Section 6 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔑</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              6. Secure Configuration & Secrets Management
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS maintains strict separation between client-side assets and server-side secrets:
            <br /><br />
            • Database connection strings, service credentials, and private environment variables are stored exclusively within Zoho Catalyst serverless environment variables.
            <br />
            • No administrative secrets, API secret keys, or private tokens are packaged into the frontend client build artifacts.
          </p>
        </div>

        {/* Section 7 */}
        <div className="legal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              7. Monitoring, Audit Trails & Incident Handling
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            • <strong>Audit Trails:</strong> Key operational actions—including payment recording, attendance check-ins, and membership tier edits—are timestamped and tagged with the performing user's ID for accountability.
            <br /><br />
            • <strong>Centralized Logs:</strong> Backend function invocations and runtime logs are aggregated within the Zoho Catalyst console monitoring suite, enabling rapid diagnosis of anomalies and performance bottlenecks.
            <br /><br />
            • <strong>Backups:</strong> Database tables are managed with automated platform-level snapshot capabilities provided by Zoho Catalyst cloud infrastructure.
          </p>
        </div>

        {/* Section 8 */}
        <div className="legal-section-card" style={{ borderColor: '#E8D293', background: '#FAF6ED' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', margin: 0 }}>
              8. Responsible Vulnerability Disclosure
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '16px' }}>
            We take security vulnerabilities seriously. If you discover a potential security flaw in GMS or its infrastructure, please disclose it to us responsibly so we can remediate it promptly:
          </p>
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E8D293', fontSize: '0.92rem', color: '#242424' }}>
            <strong>Security & Vulnerability Reporting Channel</strong><br />
            Email: <a href="mailto:security@aurum-gms.com" style={{ color: '#A67C00', fontWeight: '700' }}>security@aurum-gms.com</a><br />
            Response SLA: Verified security reports acknowledged within 24 hours.
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
                <li><Link to="/privacy-policy" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Terms of Service</Link></li>
                <li><Link to="/security" className="legal-link-hover" style={{ fontSize: '0.84rem', color: '#A67C00', fontWeight: '700' }}>Security Architecture</Link></li>
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
