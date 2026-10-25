import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginModal, OwnerSignupModal } from '../components/modals/AuthModals';
import { useAuth } from '../context/AuthContext';

export const TermsOfService = () => {
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
          <Link to="/privacy-policy" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#707070', fontWeight: '500' }}>Privacy Policy</Link>
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
            Home / Legal / <strong>Terms of Service</strong>
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
            OPERATIONAL AGREEMENT
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: '800', color: '#242424', margin: '0 0 12px 0', letterSpacing: '-0.8px' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '1rem', color: '#707070', margin: 0 }}>
            <strong>Last updated:</strong> October 16, 2026
          </p>
        </div>

        {/* Section 1 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            By registering for an account, accessing, or using the Gym Management System (GMS), whether as a Gym Owner, Personal Trainer, Member, Manager, or Staff member, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree with any provision of these Terms, you must not access or use the platform.
          </p>
        </div>

        {/* Section 2 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            2. Description of Service
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS delivers cloud-based software tools for gym operations, including member roster tracking, trainer-to-athlete management, membership package definitions, subscription records, front-desk attendance logging, workout plan creation, and revenue tracking. Features available to an individual user depend on the subscription tier chosen by their gym facility and the specific role assigned to their authenticated account.
          </p>
        </div>

        {/* Section 3 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            3. Accounts and Responsibilities
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Users must provide accurate, complete, and current information during registration and keep profile details updated. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must promptly notify your facility administrator or GMS support if you discover or suspect any unauthorized use or security breach of your account. Users are strictly prohibited from sharing login accounts, impersonating other individuals, or attempting to circumvent role-based permission boundaries.
          </p>
        </div>

        {/* Section 4 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            4. Gym Owner Responsibilities
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Gym Owners serve as the primary administrators of their respective facility accounts. Gym Owners are responsible for:
            <br /><br />
            • Managing user invitations and properly configuring roles (Trainers, Staff, Members).
            <br />
            • Ensuring all recorded member and staff data is obtained and maintained in compliance with applicable local data protection and consumer laws.
            <br />
            • Maintaining accurate membership plans, pricing policies, and terms presented to their gym members.
            <br />
            • Handling inquiries, cancellations, or disputes initiated by their gym's registered athletes.
          </p>
        </div>

        {/* Section 5 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            5. Trainer, Member, Manager, and Staff Responsibilities
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            All users must interact with GMS only for legitimate fitness facility purposes according to their assigned permissions:
            <br /><br />
            • <strong>Trainers:</strong> Must maintain professional records for their assigned athletes and only record verified exercise routines and biometric updates.
            <br />
            • <strong>Members:</strong> Must use their digital pass and attendance check-in honorably and refrain from sharing passes or manipulating check-in data.
            <br />
            • <strong>Staff & Managers:</strong> Must execute front-desk attendance logging, member inquiries, and facility workflows faithfully in adherence to gym owner policies.
          </p>
        </div>

        {/* Section 6 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            6. Memberships and Payments
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS provides recordkeeping tools to log payment amounts, dates, methods, and subscription renewal cycles. 
            <br /><br />
            • <strong>Payment Statuses:</strong> GMS reflects payment records as configured or verified by the gym facility. A payment is recorded as valid only when confirmed via the configured payment receipt flow.
            <br />
            • <strong>Facility Refund and Cancellation Policies:</strong> Individual gym membership terms, pricing, cancellation rules, late fees, and refund obligations are determined solely by the independent gym facility operator. GMS operates as a software management platform and does not own or operate member gyms.
          </p>
        </div>

        {/* Section 7 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            7. Acceptable Use
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '10px' }}>
            You agree not to engage in any prohibited conduct, including:
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '0.92rem', color: '#4A4A4A', lineHeight: 1.8 }}>
            <li>Attempting unauthorized access to accounts, database records, API endpoints, or server infrastructure.</li>
            <li>Introducing viruses, malicious scripts, automated scrapers, or disruptive traffic loads.</li>
            <li>Harvesting personal information of other members, coaches, or staff without explicit authorization.</li>
            <li>Falsifying attendance logs, transaction serials, or membership validity dates.</li>
            <li>Using the platform for fraudulent or unlawful purposes.</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            8. Data and Account Management
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            User data is managed in accordance with our Privacy Policy. Gym Owners may deactivate user accounts or revoke staff permissions within their facility at any time. When an account is closed, data is retained or removed in compliance with contractual, operational, and statutory retention guidelines.
          </p>
        </div>

        {/* Section 9 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            9. Service Availability
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            GMS is deployed on modern cloud infrastructure (Zoho Catalyst) engineered for high availability. However, service may occasionally be suspended or interrupted for scheduled maintenance, version upgrades, emergency repairs, or external network disruptions. GMS does not warrant uninterrupted, error-free operation at all times.
          </p>
        </div>

        {/* Section 10 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            10. Limitation of Liability
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            To the maximum extent permitted by applicable law, GMS, its operators, affiliates, and infrastructure providers shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, data loss, business interruption, or fitness facility operational disruptions arising from your use of or inability to use the platform.
          </p>
        </div>

        {/* Section 11 */}
        <div className="legal-section-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            11. Changes to These Terms
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            We reserve the right to revise or update these Terms as the service evolves or as legal requirements dictate. When updates occur, the "Last updated" date at the top of this document will be amended. Continued use of GMS after revisions are published constitutes your acceptance of the updated Terms.
          </p>
        </div>

        {/* Section 12 */}
        <div className="legal-section-card" style={{ borderColor: '#E8D293', background: '#FAF6ED' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#242424', marginTop: 0, marginBottom: '14px' }}>
            12. Contact Information
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '16px' }}>
            For questions, legal notices, or clarifications regarding these Terms of Service, please reach out to our legal compliance desk:
          </p>
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid #E8D293', fontSize: '0.92rem', color: '#242424' }}>
            <strong>Gym Management System — Legal Compliance Desk</strong><br />
            Email: <a href="mailto:legal@aurum-gms.com" style={{ color: '#A67C00', fontWeight: '700' }}>legal@aurum-gms.com</a><br />
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
                <li><Link to="/privacy-policy" className="legal-link-hover" style={{ fontSize: '0.84rem' }}>Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="legal-link-hover" style={{ fontSize: '0.84rem', color: '#A67C00', fontWeight: '700' }}>Terms of Service</Link></li>
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
