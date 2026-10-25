import React, { useState, useEffect, useRef } from 'react';
import { LoginModal, OwnerSignupModal } from '../components/modals/AuthModals';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const PublicLanding = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const handleDashboardNavigate = () => {
    const userRole = String(role || user?.role || user?.user_role || '').toLowerCase();
    if (userRole.includes('trainer')) {
      navigate('/dashboard/trainer');
    } else if (userRole.includes('staff') || userRole.includes('manager')) {
      navigate('/dashboard/staff');
    } else if (userRole.includes('member')) {
      navigate('/dashboard/member');
    } else {
      navigate('/dashboard');
    }
  };
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('members');

  // Detail Modal States for Interactive Features, Steps, and Roles
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Initial page-load sequence state
  const [isLoaded, setIsLoaded] = useState(false);

  // Gentle pointer-based parallax state for dashboard preview
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Scroll reveal references
  const featuresRef = useRef(null);
  const previewRef = useRef(null);
  const howItWorksRef = useRef(null);
  const aboutRef = useRef(null);
  const ctaRef = useRef(null);

  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [howVisible, setHowVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    // Trigger initial hero reveal sequence on mount
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    // Scroll-triggered IntersectionObserver
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === featuresRef.current) setFeaturesVisible(true);
          if (entry.target === previewRef.current) setPreviewVisible(true);
          if (entry.target === howItWorksRef.current) setHowVisible(true);
          if (entry.target === aboutRef.current) setAboutVisible(true);
          if (entry.target === ctaRef.current) setCtaVisible(true);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.12 });

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (previewRef.current) observer.observe(previewRef.current);
    if (howItWorksRef.current) observer.observe(howItWorksRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDashboardMouseMove = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({
      rx: -y * 2.5, // subtle limit ±2.5 deg
      ry: x * 2.5
    });
  };

  const handleDashboardMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedFeature(null);
        setSelectedStep(null);
        setSelectedRole(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Features Data Suite (9 Comprehensive Operational Features)
  const featuresList = [
    {
      id: 'members',
      icon: '👥',
      title: 'Member Management',
      tag: 'Instant search & profile editing',
      shortDesc: 'Maintain complete member rosters, emergency contacts, subscription histories, and trainer assignments from one searchable table.',
      fullDesc: 'Empowers gym administrators and front-desk staff with instant athlete lookups, emergency contact logs, medical notes, and membership status flags. Filter by membership type, active status, or assigned trainer.',
      capabilities: [
        'Instant multi-field search (Name, Phone, Email, Status)',
        'Emergency contact & medical note logging',
        'Direct personal coach & trainer assignment',
        'One-click membership subscription activation'
      ],
      roleAccess: 'Gym Owner, Manager, Staff'
    },
    {
      id: 'trainers',
      icon: '🏋️',
      title: 'Trainer Management',
      tag: 'Real-time athlete-to-coach mapping',
      shortDesc: 'Organize your coaching roster, assign athletes to dedicated trainers, and monitor personal training workload distribution.',
      fullDesc: 'Structure your fitness staff and coaching professionals. Assign members to personal trainers to distribute workloads evenly, avoid scheduling conflicts, and track trainer-specific athlete retention.',
      capabilities: [
        'Coaching specialty and certification tracking',
        'Athlete workload distribution & client capacity',
        'Direct trainer-client workout and schedule sync',
        'Private trainer notes and client performance logs'
      ],
      roleAccess: 'Gym Owner, Manager, Trainer'
    },
    {
      id: 'plans',
      icon: '🏷️',
      title: 'Membership Management',
      tag: 'Plan tiers & 30-day renewal engine',
      shortDesc: 'Create customizable monthly, quarterly, or annual plans. Track active subscriptions and receive automated alerts for expiring plans.',
      fullDesc: 'Design flexible, high-converting membership packages. Define tier pricing, validity days, enrollment fees, and automatic renewal alerts that warn staff 30 days before expiration.',
      capabilities: [
        'Unlimited custom tiers (Day Pass, Monthly, Annual, VIP)',
        'Configurable validity durations and pricing rules',
        'Automated 30-day renewal expiration notices',
        'Active vs. expired membership filtering'
      ],
      roleAccess: 'Gym Owner, Manager'
    },
    {
      id: 'attendance',
      icon: '📋',
      title: 'Attendance Tracking',
      tag: 'Duplicate-check prevention & occupancy',
      shortDesc: 'Front desk check-in/out logging with duplicate check-in prevention. Monitor peak facility hours and daily athlete visit trends.',
      fullDesc: 'High-speed facility check-in terminal. Automatically validates membership status before granting entry, prevents duplicate check-ins within the same session, and logs peak hourly facility usage.',
      capabilities: [
        'Rapid check-in / check-out logging terminal',
        'Duplicate check-in prevention algorithm',
        'Live facility occupancy & peak hour calculations',
        'Exportable athlete visit history & attendance audits'
      ],
      roleAccess: 'Gym Owner, Manager, Staff'
    },
    {
      id: 'payments',
      icon: '💳',
      title: 'Payment Management',
      tag: 'Automated invoice & revenue ledger',
      shortDesc: 'Record payments across credit cards, bank transfers, UPI, or cash. Maintain an audit-ready ledger with unique invoice tracking numbers.',
      fullDesc: 'Transparent financial tracking for gym owners. Record incoming membership payments with invoice numbers, payment methods (Credit Card, UPI, Bank Transfer, Cash), and clear settlement timestamps.',
      capabilities: [
        'Multi-channel payment recording (Card, UPI, Cash, Transfer)',
        'Audit-ready financial ledger with sequential invoice IDs',
        'Monthly & annual facility revenue totals',
        'Payment status verification and receipt logs'
      ],
      roleAccess: 'Gym Owner, Financial Manager'
    },
    {
      id: 'workouts',
      icon: '📝',
      title: 'Workout Management',
      tag: 'Custom splits & exercise routines',
      shortDesc: 'Trainers design tailored workout splits (Upper/Lower, 4-Day Hypertrophy, PPL) with precise sets, reps, and exercise libraries.',
      fullDesc: 'Coaches create periodized training programs tailored to athletes’ goals. Structure daily splits, target muscle groups, prescribe rep ranges, and update routines dynamically as members advance.',
      capabilities: [
        'Custom workout split templates (Hypertrophy, Strength, Cardio)',
        'Exercise database with sets, reps, and target muscle groups',
        'Direct assignment to specific member accounts',
        'Mobile-friendly routine view for members during workouts'
      ],
      roleAccess: 'Gym Owner, Trainer, Member'
    },
    {
      id: 'progress',
      icon: '📈',
      title: 'Progress Tracking',
      tag: 'Biometric tracking & fitness milestones',
      shortDesc: 'Track athlete biometric changes, weight logs, body fat percentages, muscle circumference measurements, and personal records.',
      fullDesc: 'Keep members motivated with visual evidence of transformation. Record weight progression, body composition metrics, and strength milestones over time with easy comparative logs.',
      capabilities: [
        'Periodic weight and body fat % logging',
        'Body circumference tracking (Chest, Arms, Waist, Thighs)',
        'Historical progress timeline and trend charts',
        'Coach-verified milestones and personal record tracking'
      ],
      roleAccess: 'Gym Owner, Trainer, Member'
    },
    {
      id: 'reports',
      icon: '📊',
      title: 'Reports and Analytics',
      tag: 'Facility occupancy & revenue metrics',
      shortDesc: 'Gain executive clarity with real-time dashboards detailing active members, monthly cash flow, peak hour utilization, and renewal retention.',
      fullDesc: 'Make data-driven operational decisions. Visual charts display facility hourly traffic patterns, member churn/retention ratios, plan popularity, and projected revenue growth.',
      capabilities: [
        'Facility hourly traffic & peak occupancy bar charts',
        'Monthly & yearly revenue aggregation reports',
        'Membership plan breakdown & popular tier analytics',
        'Athlete retention rate and renewal velocity tracking'
      ],
      roleAccess: 'Gym Owner, Executive Manager'
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications & Alerts',
      tag: 'Automated renewal & session alerts',
      shortDesc: 'Keep members and staff synchronized with automated alerts for expiring passes, scheduled training sessions, and system announcements.',
      fullDesc: 'Never miss an expiring subscription or scheduled session. Centralized notification center alerts front-desk staff to upcoming renewals and notifies trainers of new athlete assignments.',
      capabilities: [
        '30-day and 7-day membership expiry warning alerts',
        'Real-time check-in notifications for trainers',
        'Front-desk member alert flags (overdue fees, renewals)',
        'System broadcast announcements for facility hours'
      ],
      roleAccess: 'All Roles (Owner, Trainer, Member, Staff)'
    }
  ];

  // How It Works Steps
  const stepsList = [
    {
      step: 1,
      title: 'Create Gym Owner Account',
      shortDesc: 'Register as the verified facility owner. Public signup assigns administrative ownership through validated server-side logic.',
      fullDesc: 'Start your digital transformation in under 2 minutes. The public onboarding modal validates your gym details and provisions a secure Owner account with complete administrative control on Zoho Catalyst.',
      keyTakeaway: 'Immediate administrative credentials provisioned securely.'
    },
    {
      step: 2,
      title: 'Set Up Gym Profile & Plans',
      shortDesc: 'Define your facility details, operating hours, and create customized membership packages with defined prices and term lengths.',
      fullDesc: 'Configure your gym profile, facility address, operating schedule, and membership tiers (Monthly, Quarterly, Annual, VIP Passes). Set enrollment fees and renewal warning windows.',
      keyTakeaway: 'Standardize pricing and automated renewal notification rules.'
    },
    {
      step: 3,
      title: 'Add Trainers and Staff',
      shortDesc: 'Securely invite personal trainers, front desk staff, and managers directly from inside your authenticated dashboard.',
      fullDesc: 'Invite your fitness coaches and front-desk personnel with role-based access. Front-desk staff get check-in terminal tools; trainers receive coaching portals scoped strictly to their assigned athletes.',
      keyTakeaway: 'Zero data overlap; each staff member accesses only permitted tools.'
    },
    {
      step: 4,
      title: 'Register Members',
      shortDesc: 'Onboard athletes, link them to subscription plans, record contact info, and assign dedicated personal trainers.',
      fullDesc: 'Easily enter member profiles, emergency contacts, and active plans. Assign athletes to personal coaches for workout programming and biometric progression monitoring.',
      keyTakeaway: 'One centralized roster replacing paper binders and spreadsheets.'
    },
    {
      step: 5,
      title: 'Manage Subscriptions & Payments',
      shortDesc: 'Record cash, card, bank transfer, and UPI payments with audit-ready invoices and automated renewal tracking.',
      fullDesc: 'Maintain a clear transaction history for every membership plan sold. Log payments with unique serial invoice numbers and track member renewal deadlines effortlessly.',
      keyTakeaway: 'Financial clarity with accurate revenue reporting.'
    },
    {
      step: 6,
      title: 'Track Attendance & Operations',
      shortDesc: 'Log live front-desk check-ins, analyze peak hours, assign tailored workouts, and monitor athlete progress daily.',
      fullDesc: 'Front-desk staff check athletes in within seconds while preventing duplicate entries. Live facility analytics calculate hourly occupancy so you know exactly when your gym is at peak capacity.',
      keyTakeaway: 'Smooth daily operations with real-time operational oversight.'
    }
  ];

  // Role Cards
  const rolesList = [
    {
      role: 'Gym Owner',
      badge: 'Executive Level',
      badgeColor: '#A67C00',
      icon: '👑',
      tagline: 'Complete facility command and financial control.',
      shortDesc: 'Manages gym operations, trainers, members, memberships, payments, reports, and authorized settings.',
      fullDesc: 'As the facility owner, you maintain unrestricted access across all operational modules: member registers, staff invitations, pricing structures, revenue ledger audits, and real-time operational analytics.',
      responsibilities: [
        'Revenue ledger & payment audits',
        'Membership plan creation & pricing configuration',
        'Staff & coach role provisioning and invitations',
        'Global facility reporting & data oversight'
      ]
    },
    {
      role: 'Trainer',
      badge: 'Coaching Hub',
      badgeColor: '#237804',
      icon: '🏋️',
      tagline: 'Dedicated coaching portal for assigned athletes.',
      shortDesc: 'Manages assigned members, workout plans, and member progress according to assigned permissions.',
      fullDesc: 'Personal trainers access only their assigned clients. Design custom workout routine splits, track workout adherence, and record biometric changes (body fat, weight, measurements) without seeing gym-wide financial ledgers.',
      responsibilities: [
        'Assigned athlete roster & client profiles',
        'Custom workout routine splits & exercise assignments',
        'Biometric progress & milestone logging',
        'Client training session notes'
      ]
    },
    {
      role: 'Member',
      badge: 'Athlete Pass',
      badgeColor: '#707070',
      icon: '🏃',
      tagline: 'Personal membership dashboard and workout routines.',
      shortDesc: 'Views personal membership details, attendance, workout plans, and progress.',
      fullDesc: 'Athletes access their personalized member portal to view digital membership status, validity dates, check-in timestamps, coach-assigned workout splits, and historical body transformation records.',
      responsibilities: [
        'Digital facility access pass & validity status',
        'View coach-assigned workout routines',
        'Personal attendance check-in timestamps',
        'Biometric progress & milestone visualizer'
      ]
    },
    {
      role: 'Manager',
      badge: 'Operations Lead',
      badgeColor: '#1890FF',
      icon: '💼',
      tagline: 'Oversees day-to-day gym operational execution.',
      shortDesc: 'Handles permitted operational tasks according to assigned access permissions.',
      fullDesc: 'Operations managers supervise front-desk logistics, monitor facility hourly occupancy, resolve member inquiries, and coordinate trainer schedules within permissions granted by the gym owner.',
      responsibilities: [
        'Front-desk operations supervision',
        'Facility hourly activity & occupancy monitoring',
        'Member registration & plan renewals',
        'Staff shift coordination & operational logging'
      ]
    },
    {
      role: 'Staff',
      badge: 'Front Desk',
      badgeColor: '#707070',
      icon: '📋',
      tagline: 'Fast athlete check-in terminal and member lookup.',
      shortDesc: 'Performs authorized daily gym operations based on the permissions configured by the gym owner.',
      fullDesc: 'Front-desk attendants use a streamlined terminal interface to quickly search member passes, verify active subscriptions, and record check-in/out timestamps with strict protection against financial ledger tampering.',
      responsibilities: [
        'Rapid check-in & check-out terminal logging',
        'Member contact & pass validity validation',
        'Duplicate check-in prevention control',
        'Restricted financial view (no financial ledger access)'
      ]
    }
  ];

  return (
    <div style={{ background: '#FAFAF8', color: '#242424', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* -------------------------------------------------------------
          EMBEDDED REPSI-STYLE ANIMATIONS & STYLING SYSTEM
          ------------------------------------------------------------- */}
      <style>{`
        /* Global Reset & Smooth Scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Hero 2-Column Layout (Desktop: Text on Left, Dashboard on Right) */
        .gms-hero-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
          width: 100%;
        }

        .gms-hero-text-col {
          flex: 1;
          min-width: 0;
          order: 1; /* Left on Desktop */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .gms-hero-dashboard-col {
          flex: 1.15;
          min-width: 0;
          order: 2; /* Right on Desktop */
        }

        /* Masked Line Reveal for Headline */
        .gms-mask-wrapper {
          overflow: hidden;
          display: block;
          line-height: 1.15;
          padding-bottom: 4px;
        }

        .gms-mask-inner {
          display: inline-block;
          transform: translateY(115%);
          transition: transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }

        .gms-mask-inner.is-revealed {
          transform: translateY(0%);
        }

        /* Gold Gradient Text */
        .gms-gold-gradient {
          background: linear-gradient(135deg, #C9A227 0%, #A67C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* CTA Button Hover Micro-interactions */
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
        .gms-btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(201, 162, 39, 0.25);
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
        .gms-btn-secondary:active {
          transform: translateY(0);
        }

        /* Dashboard Preview Container Hover */
        .gms-dashboard-container {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, box-shadow;
        }
        .gms-dashboard-container:hover {
          box-shadow: 0 24px 70px rgba(201, 162, 39, 0.12), 0 12px 30px rgba(0, 0, 0, 0.06);
        }

        /* Dashboard KPI Card Micro-hover */
        .gms-kpi-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .gms-kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
          border-color: #E8D293;
        }

        /* Feature Cards Gold Hover & Pop-Up */
        .gms-feature-card {
          border: 1px solid #E8E5DC;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 28px;
          cursor: pointer;
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          position: relative;
        }
        .gms-feature-card:hover {
          transform: translateY(-6px);
          border-color: #C9A227;
          box-shadow: 0 12px 28px rgba(201, 162, 39, 0.18);
        }
        .gms-feature-card:active {
          transform: translateY(-2px) scale(0.99);
        }

        /* How It Works Steps Gold Hover & Pop-Up */
        .gms-step-card {
          background: #F8F8F6;
          border: 1px solid #E8E5DC;
          border-radius: 14px;
          padding: 24px;
          cursor: pointer;
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
          text-align: left;
          display: flex;
          flex-direction: column;
        }
        .gms-step-card:hover {
          transform: translateY(-6px);
          border-color: #C9A227;
          box-shadow: 0 12px 28px rgba(201, 162, 39, 0.18);
        }
        .gms-step-card:hover .gms-step-num {
          background: linear-gradient(135deg, #C9A227 0%, #A67C00 100%) !important;
          color: #FFFFFF !important;
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(201, 162, 39, 0.35);
        }
        .gms-step-card:active {
          transform: translateY(-2px) scale(0.99);
        }

        /* About Role Cards Gold Hover & Pop-Up */
        .gms-role-card {
          background: #FFFFFF;
          border: 1px solid #E8E5DC;
          border-radius: 14px;
          padding: 28px;
          cursor: pointer;
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
          text-align: left;
          display: flex;
          flex-direction: column;
        }
        .gms-role-card:hover {
          transform: translateY(-6px);
          border-color: #C9A227;
          box-shadow: 0 12px 28px rgba(201, 162, 39, 0.18);
        }
        .gms-role-card:active {
          transform: translateY(-2px) scale(0.99);
        }

        /* Footer Link Animated Underline & Gold Glow */
        .gms-footer-link {
          color: #707070;
          text-decoration: none;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 0.84rem;
          position: relative;
          display: inline-block;
          transition: color 220ms ease, text-shadow 220ms ease;
        }
        .gms-footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #C9A227;
          transition: width 220ms ease;
        }
        .gms-footer-link:hover {
          color: #C9A227;
          text-shadow: 0 0 10px rgba(201, 162, 39, 0.2);
        }
        .gms-footer-link:hover::after {
          width: 100%;
        }

        /* Modal Pop-up Animation */
        @keyframes gmsModalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .gms-modal-content {
          animation: gmsModalFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Scroll Reveal Utility Classes */
        .gms-fade-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .gms-fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 { transition-delay: 0.08s; }
        .stagger-2 { transition-delay: 0.16s; }
        .stagger-3 { transition-delay: 0.24s; }
        .stagger-4 { transition-delay: 0.32s; }
        .stagger-5 { transition-delay: 0.40s; }
        .stagger-6 { transition-delay: 0.48s; }

        /* Responsive Breakpoints */
        @media (max-width: 1080px) {
          .gms-hero-wrapper {
            gap: 32px;
          }
        }

        @media (max-width: 991px) {
          .gms-hero-wrapper {
            flex-direction: column;
            gap: 40px;
          }
          /* ON MOBILE: Headline and CTAs show FIRST on top! */
          .gms-hero-text-col {
            order: 1 !important;
            align-items: center !important;
            text-align: center !important;
            width: 100% !important;
          }
          /* ON MOBILE: Dashboard shows SECOND below! */
          .gms-hero-dashboard-col {
            order: 2 !important;
            width: 100% !important;
          }
          .pub-nav-desktop {
            display: none !important;
          }
          .pub-mobile-btn {
            display: inline-flex !important;
          }
        }

        @media (max-width: 640px) {
          .pub-brand-subtitle {
            display: none !important;
          }
          .pub-btn-get-started {
            display: none !important;
          }
          .pub-section-header h2 {
            font-size: 1.6rem !important;
          }
        }

        @media (max-width: 480px) {
          .pub-btn-login {
            display: none !important;
          }
          .pub-brand-title {
            font-size: 0.98rem !important;
          }
          .pub-preview-tabs-bar {
            width: 100% !important;
            display: flex !important;
          }
          .pub-preview-tab-btn {
            flex: 1 1 calc(50% - 6px) !important;
            padding: 8px 6px !important;
            font-size: 0.78rem !important;
            text-align: center !important;
          }
        }

        @media (min-width: 992px) {
          .pub-mobile-drawer {
            display: none !important;
          }
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .gms-mask-inner,
          .gms-fade-up,
          .gms-dashboard-container,
          .gms-modal-content {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
            animation: none !important;
          }
          .gms-feature-card:hover,
          .gms-step-card:hover,
          .gms-role-card:hover {
            transform: none !important;
          }
        }
      `}</style>

      {/* -------------------------------------------------------------
          1. NAVBAR (Fade In From Above)
          ------------------------------------------------------------- */}
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
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Left: Brand Mark */}
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
        >
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
            <span className="pub-brand-title" style={{ fontSize: '1.12rem', fontWeight: '800', color: '#242424', letterSpacing: '-0.3px', display: 'block', lineHeight: 1.1 }}>
              Gym Management System
            </span>
            <span className="pub-brand-subtitle" style={{ fontSize: '0.68rem', color: '#A67C00', fontWeight: '600', letterSpacing: '0.5px' }}>
              Cloud Operations Platform
            </span>
          </div>
        </a>

        {/* Center: Public Links (Smooth Scroll) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="pub-nav-desktop">
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            style={{ fontSize: '0.9rem', fontWeight: '600', color: '#242424', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.15s' }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            style={{ fontSize: '0.9rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.15s' }}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            style={{ fontSize: '0.9rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.15s' }}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            style={{ fontSize: '0.9rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.15s' }}
          >
            About
          </button>
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleDashboardNavigate}
              className="gms-btn-primary"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Open Dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="gms-btn-secondary pub-btn-login"
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="gms-btn-primary pub-btn-get-started"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: '#F8F8F6',
              border: '1px solid #E8E5DC',
              color: '#242424',
              cursor: 'pointer',
              display: 'none'
            }}
            className="pub-mobile-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="pub-mobile-drawer" style={{
          position: 'fixed',
          top: '72px',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E5DC',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          <button type="button" onClick={() => scrollToSection('home')} style={{ textAlign: 'left', fontSize: '1rem', fontWeight: '600', color: '#242424', background: 'none', border: 'none' }}>Home</button>
          <button type="button" onClick={() => scrollToSection('features')} style={{ textAlign: 'left', fontSize: '1rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none' }}>Features</button>
          <button type="button" onClick={() => scrollToSection('how-it-works')} style={{ textAlign: 'left', fontSize: '1rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none' }}>How It Works</button>
          <button type="button" onClick={() => scrollToSection('about')} style={{ textAlign: 'left', fontSize: '1rem', fontWeight: '500', color: '#707070', background: 'none', border: 'none' }}>About</button>
          <div style={{ borderTop: '1px solid #E8E5DC', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setShowLogin(true); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E8E5DC', background: '#FFFFFF', fontWeight: '700' }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setShowSignup(true); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)', color: '#FFFFFF', fontWeight: '700', border: 'none' }}
            >
              Get Started (Gym Owner)
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          2. SECTION A: HERO SECTION (REVERSED LAYOUT + REPSI ANIMATIONS)
          LEFT: DASHBOARD PREVIEW | RIGHT: HEADLINE, DESCRIPTION, CTAS
          ------------------------------------------------------------- */}
      <section id="home" style={{
        padding: '60px 24px 70px 24px',
        maxWidth: '1320px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="gms-hero-wrapper">
          {/* =========================================================
              LEFT COLUMN (DESKTOP): HERO CONTENT & REPSI TEXT ANIMATION
              ========================================================= */}
          <div className="gms-hero-text-col">
            {/* 1. Badge: GYM MANAGEMENT, SIMPLIFIED */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                background: '#FAF6ED',
                border: '1px solid #E8D293',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#A67C00',
                letterSpacing: '0.5px',
                marginBottom: '18px',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A227' }}></span>
              GYM MANAGEMENT, SIMPLIFIED
            </div>

            {/* 2. Headline: Masked Line-by-Line Reveal */}
            <h1 style={{
              fontSize: 'clamp(2.3rem, 4.2vw, 3.7rem)',
              fontWeight: '800',
              color: '#242424',
              lineHeight: 1.15,
              letterSpacing: '-1.2px',
              margin: '0 0 18px 0'
            }}>
              {/* Line 1: Everything You Need to */}
              <div className="gms-mask-wrapper">
                <span className={`gms-mask-inner ${isLoaded ? 'is-revealed' : ''}`} style={{ transitionDelay: '0.30s' }}>
                  Everything You Need to
                </span>
              </div>
              {/* Line 2: Run Your Gym (Gold Highlight) */}
              <div className="gms-mask-wrapper">
                <span className={`gms-mask-inner gms-gold-gradient ${isLoaded ? 'is-revealed' : ''}`} style={{ transitionDelay: '0.44s' }}>
                  Run Your Gym
                </span>
              </div>
            </h1>

            {/* 3. Supporting Description */}
            <p
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                color: '#707070',
                lineHeight: 1.6,
                maxWidth: '540px',
                margin: '0 0 28px 0',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s'
              }}
            >
              Manage members, trainers, memberships, attendance, payments, and workouts from one simple platform.
            </p>

            {/* 4. CTA Buttons with Small Stagger */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.68s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.68s'
              }}
            >
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="gms-btn-primary"
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Get Started →
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="gms-btn-secondary"
                style={{
                  padding: '14px 24px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.98rem',
                  cursor: 'pointer'
                }}
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN (DESKTOP): GMS DASHBOARD PREVIEW
              ========================================================= */}
          <div
            className="gms-hero-dashboard-col"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateX(0) translateY(0)' : 'translateX(36px) translateY(16px)',
              transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.1s'
            }}
          >
            <div
              className="gms-dashboard-container"
              onMouseEnter={() => setIsHovered(true)}
              onMouseMove={handleDashboardMouseMove}
              onMouseLeave={handleDashboardMouseLeave}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E5DC',
                borderRadius: '16px',
                boxShadow: isHovered
                  ? '0 24px 60px rgba(201, 162, 39, 0.14), 0 8px 24px rgba(0, 0, 0, 0.05)'
                  : '0 16px 45px rgba(0, 0, 0, 0.07)',
                overflow: 'hidden',
                transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
              }}
            >
              {/* Window Header Bar */}
              <div style={{
                background: '#FAF6ED',
                borderBottom: '1px solid #E8D293',
                padding: '11px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFA39E' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFE58F' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#B7EB8F' }}></span>
                  <span style={{ marginLeft: '10px', fontSize: '0.74rem', fontWeight: '800', color: '#242424', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    GMS / LIVE FACILITY OPERATIONS
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#237804' }}></span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#237804' }}>DEMO PREVIEW</span>
                </div>
              </div>

              {/* Dashboard Content Interior */}
              <div style={{ padding: '20px', background: '#F8F8F6' }}>
                {/* 4 KPI Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                  {/* KPI 1 */}
                  <div className="gms-kpi-card" style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>Active Members</span>
                      <span style={{ fontSize: '0.95rem' }}>👥</span>
                    </div>
                    <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#242424', lineHeight: 1.1 }}>1,248</div>
                    <div style={{ fontSize: '0.72rem', color: '#237804', fontWeight: '700', marginTop: '4px' }}>
                      ↑ +42 enrolled this month
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="gms-kpi-card" style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>Today's Check-ins</span>
                      <span style={{ fontSize: '0.95rem' }}>📋</span>
                    </div>
                    <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#242424', lineHeight: 1.1 }}>184</div>
                    <div style={{ fontSize: '0.72rem', color: '#A67C00', fontWeight: '700', marginTop: '4px' }}>
                      86.4% peak occupancy
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="gms-kpi-card" style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>Monthly Revenue</span>
                      <span style={{ fontSize: '0.95rem' }}>💳</span>
                    </div>
                    <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#242424', lineHeight: 1.1 }}>$18,420</div>
                    <div style={{ fontSize: '0.72rem', color: '#237804', fontWeight: '700', marginTop: '4px' }}>
                      ↑ 12.4% vs last month
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className="gms-kpi-card" style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>Memberships</span>
                      <span style={{ fontSize: '0.95rem' }}>🏷️</span>
                    </div>
                    <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#242424', lineHeight: 1.1 }}>1,104</div>
                    <div style={{ fontSize: '0.72rem', color: '#237804', fontWeight: '700', marginTop: '4px' }}>
                      92% renewal retention
                    </div>
                  </div>
                </div>

                {/* Sub Panels: Facility Hourly Activity & Live Member Check-ins */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Hourly Activity Bar Chart */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #F0EDE5' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#242424' }}>Facility Hourly Activity</strong>
                      <span style={{ fontSize: '0.68rem', color: '#A67C00', fontWeight: '700' }}>Peak: 6:00 PM</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '90px', paddingTop: '6px' }}>
                      {[
                        { time: '6 AM', h: '45%' },
                        { time: '9 AM', h: '80%' },
                        { time: '12 PM', h: '55%' },
                        { time: '3 PM', h: '40%' },
                        { time: '6 PM', h: '95%', active: true },
                        { time: '9 PM', h: '60%' }
                      ].map((bar, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                          <div style={{
                            width: '24px',
                            height: bar.h,
                            borderRadius: '5px 5px 0 0',
                            background: bar.active ? 'linear-gradient(180deg, #C9A227 0%, #A67C00 100%)' : '#E8D293',
                            boxShadow: bar.active ? '0 2px 6px rgba(201, 162, 39, 0.4)' : 'none',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                          }}></div>
                          <span style={{ fontSize: '0.66rem', color: bar.active ? '#A67C00' : '#707070', fontWeight: bar.active ? '700' : '500' }}>
                            {bar.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Check-in Stream */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8E5DC', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #F0EDE5' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#242424' }}>Live Member Check-ins</strong>
                      <span style={{ fontSize: '0.68rem', color: '#237804', fontWeight: '700' }}>Real-time Feed</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {[
                        { name: 'Alex Mercer', plan: 'Platinum Elite', time: '07:30 AM', status: 'Checked In' },
                        { name: 'Jordan Reed', plan: 'Gold Pro Monthly', time: '07:15 AM', status: 'In Session' },
                        { name: 'Jessica Miller', plan: 'Diamond Annual', time: '06:45 AM', status: 'Present' }
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: '#F8F8F6',
                          border: '1px solid #E8E5DC',
                          fontSize: '0.74rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#237804' }}></span>
                            <strong style={{ color: '#242424' }}>{item.name}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#999890', fontSize: '0.68rem', fontFamily: 'monospace' }}>{item.time}</span>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#EDF7EE', color: '#237804', fontWeight: '700', fontSize: '0.64rem' }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. SECTION B: CORE FEATURES (Scroll-Triggered Fade-Up)
          ------------------------------------------------------------- */}
      <section id="features" ref={featuresRef} style={{
        padding: '80px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E8E5DC',
        borderBottom: '1px solid #E8E5DC'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className={`gms-fade-up ${featuresVisible ? 'visible' : ''}`} style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Built For Modern Gym Operations
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#242424', margin: '8px 0 12px 0', letterSpacing: '-0.5px' }}>
              Everything in One Connected System
            </h2>
            <p style={{ fontSize: '1rem', color: '#707070', lineHeight: 1.6 }}>
              No messy spreadsheets or fragmented tools. Manage every aspect of your facility with fast, secure cloud records.
            </p>
          </div>

          {/* 9 Interactive Feature Cards Grid with Gold Hover Lift & Pop-up Modal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {featuresList.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedFeature(item)}
                className={`gms-feature-card gms-fade-up stagger-${(idx % 6) + 1} ${featuresVisible ? 'visible' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature(item); } }}
                aria-label={`View details for ${item.title}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FAF6ED', color: '#A67C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#A67C00', background: '#FAF6ED', padding: '4px 10px', borderRadius: '20px', border: '1px solid #E8D293' }}>
                      Click to explore
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#242424', marginBottom: '8px', lineHeight: 1.25 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#707070', lineHeight: 1.6, marginBottom: '20px' }}>
                    {item.shortDesc}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #F0EDE5', fontSize: '0.76rem', color: '#A67C00', fontWeight: '700' }}>
                  <span>✓ {item.tag}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. SECTION C: DASHBOARD / PRODUCT PREVIEW
          ------------------------------------------------------------- */}
      <section id="preview" ref={previewRef} style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div className={`gms-fade-up ${previewVisible ? 'visible' : ''}`} style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Full Operational Visibility
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#242424', margin: '8px 0 12px 0', letterSpacing: '-0.5px' }}>
            Total Control for Gym Owners
          </h2>
          <p style={{ fontSize: '1rem', color: '#707070', lineHeight: 1.6 }}>
            Switch seamlessly between operational views to manage registrations, attendance check-ins, and membership finances in real time.
          </p>

          {/* Interactive Preview Switcher Tabs */}
          <div className="pub-preview-tabs-bar" style={{ display: 'inline-flex', background: '#FFFFFF', padding: '4px', borderRadius: '10px', border: '1px solid #E8E5DC', marginTop: '16px', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
            {[
              { id: 'members', label: 'Member Rosters' },
              { id: 'attendance', label: 'Attendance Terminal' },
              { id: 'plans', label: 'Membership Plans' },
              { id: 'payments', label: 'Revenue Ledger' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className="pub-preview-tab-btn"
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: activePreviewTab === tab.id ? '700' : '500',
                  color: activePreviewTab === tab.id ? '#A67C00' : '#707070',
                  background: activePreviewTab === tab.id ? '#FAF6ED' : 'transparent',
                  boxShadow: activePreviewTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  border: activePreviewTab === tab.id ? '1px solid #E8D293' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Showcase Card */}
        <div className={`gms-fade-up stagger-2 ${previewVisible ? 'visible' : ''}`} style={{
          background: '#FFFFFF',
          border: '1px solid #E8E5DC',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
        }}>
          {activePreviewTab === 'members' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#242424', fontWeight: '800' }}>Member Directory Overview</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#707070' }}>Active athletes enrolled with assigned personal trainers</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#FAF6ED', color: '#A67C00', fontSize: '0.78rem', fontWeight: '700' }}>
                  Live Data Store
                </span>
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8E5DC', color: '#707070', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Member Name</th>
                      <th style={{ padding: '10px 12px' }}>Email</th>
                      <th style={{ padding: '10px 12px' }}>Assigned Coach</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F0EDE5' }}>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#242424' }}>Alex Mercer</td>
                      <td style={{ padding: '12px', color: '#707070' }}>alex.mercer@gmail.com</td>
                      <td style={{ padding: '12px', color: '#A67C00', fontWeight: '600' }}>Marcus Vance</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', background: '#EDF7EE', color: '#237804', fontWeight: '700', fontSize: '0.74rem' }}>Active</span></td>
                      <td style={{ padding: '12px', color: '#707070' }}>+1 555-0188</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F0EDE5' }}>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#242424' }}>Jordan Reed</td>
                      <td style={{ padding: '12px', color: '#707070' }}>jordan.reed@gmail.com</td>
                      <td style={{ padding: '12px', color: '#A67C00', fontWeight: '600' }}>Elena Rostova</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', background: '#EDF7EE', color: '#237804', fontWeight: '700', fontSize: '0.74rem' }}>Active</span></td>
                      <td style={{ padding: '12px', color: '#707070' }}>+1 555-0144</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePreviewTab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#242424', fontWeight: '800' }}>Front Desk Attendance Scanner</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#707070' }}>Instant check-in and check-out logs with facility duration tracking</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#EDF7EE', color: '#237804', fontSize: '0.78rem', fontWeight: '700' }}>
                  ✓ Turnstile Ready
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', background: '#F8F8F6', border: '1px solid #E8E5DC' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424' }}>Alex Mercer</div>
                  <div style={{ fontSize: '0.74rem', color: '#707070', marginTop: '4px' }}>Check In: 07:30 AM · In Session</div>
                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#237804', fontWeight: '700' }}>● Current Check-In Active</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '10px', background: '#F8F8F6', border: '1px solid #E8E5DC' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424' }}>Jordan Reed</div>
                  <div style={{ fontSize: '0.74rem', color: '#707070', marginTop: '4px' }}>Check In: 06:30 PM · Check Out: 07:45 PM</div>
                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#707070', fontWeight: '600' }}>Session Complete (75 mins)</div>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'plans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#242424', fontWeight: '800' }}>Configured Membership Packages</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#707070' }}>Custom durations, pricing, and automated renewal criteria</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#FAF6ED', color: '#A67C00', fontSize: '0.78rem', fontWeight: '700' }}>
                  Multi-Tier Plans
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', background: '#FAF6ED', border: '1px solid #E8D293' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#A67C00', textTransform: 'uppercase' }}>Popular</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: '4px 0' }}>Gold Pro Monthly</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#A67C00' }}>$59 <span style={{ fontSize: '0.78rem', color: '#707070', fontWeight: '500' }}>/ month</span></div>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: '#F8F8F6', border: '1px solid #E8E5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>Quarterly</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: '4px 0' }}>Platinum Elite</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#242424' }}>$159 <span style={{ fontSize: '0.78rem', color: '#707070', fontWeight: '500' }}>/ 3 months</span></div>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: '#F8F8F6', border: '1px solid #E8E5DC' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#707070', textTransform: 'uppercase' }}>VIP Annual</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#242424', margin: '4px 0' }}>Diamond All-Access</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#242424' }}>$549 <span style={{ fontSize: '0.78rem', color: '#707070', fontWeight: '500' }}>/ year</span></div>
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'payments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#242424', fontWeight: '800' }}>Financial Transactions & Receipts</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#707070' }}>Audit ledger recording payments, methods, and invoice receipts</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#EDF7EE', color: '#237804', fontSize: '0.78rem', fontWeight: '700' }}>
                  100% Settled
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 14px', borderRadius: '8px', background: '#F8F8F6', border: '1px solid #E8E5DC', fontSize: '0.82rem' }}>
                  <div><strong>INV-2026-001</strong> · Alex Mercer (Platinum Elite)</div>
                  <div><strong style={{ color: '#237804' }}>$159.00</strong> · Credit Card</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 14px', borderRadius: '8px', background: '#F8F8F6', border: '1px solid #E8E5DC', fontSize: '0.82rem' }}>
                  <div><strong>INV-2026-002</strong> · Jordan Reed (Gold Pro Monthly)</div>
                  <div><strong style={{ color: '#237804' }}>$59.00</strong> · UPI / Online</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. SECTION D: HOW IT WORKS (4 STEPS)
          ------------------------------------------------------------- */}
      <section id="how-it-works" ref={howItWorksRef} style={{
        padding: '80px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E8E5DC',
        borderBottom: '1px solid #E8E5DC'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className={`gms-fade-up ${howVisible ? 'visible' : ''}`} style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Simple Onboarding Flow
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#242424', margin: '8px 0 12px 0', letterSpacing: '-0.5px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '1rem', color: '#707070', lineHeight: 1.6 }}>
              Get your facility operational in four straightforward steps with full data security.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {stepsList.map((stepItem, idx) => (
              <div
                key={stepItem.step}
                onClick={() => setSelectedStep(stepItem)}
                className={`gms-step-card gms-fade-up stagger-${(idx % 6) + 1} ${howVisible ? 'visible' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStep(stepItem); } }}
                aria-label={`View step ${stepItem.step}: ${stepItem.title}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div
                    className="gms-step-num"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#FAF6ED',
                      color: '#A67C00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1.05rem',
                      transition: 'all 250ms ease'
                    }}
                  >
                    {stepItem.step}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#A67C00', fontWeight: '700' }}>
                    Click details →
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#242424', marginBottom: '8px' }}>
                  {stepItem.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#707070', lineHeight: 1.6, flex: 1, margin: 0 }}>
                  {stepItem.shortDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. SECTION E: ROLE-BASED ACCESS (ABOUT)
          ------------------------------------------------------------- */}
      <section id="about" ref={aboutRef} style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div className={`gms-fade-up ${aboutVisible ? 'visible' : ''}`} style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Strict Authorization Model
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#242424', margin: '8px 0 12px 0', letterSpacing: '-0.5px' }}>
            Tailored Access for Every Role
          </h2>
          <p style={{ fontSize: '1rem', color: '#707070', lineHeight: 1.6 }}>
            Users see only the features and data they are permitted to view. Verified on the server for complete data privacy.
          </p>
        </div>

        {/* Role Cards Grid with Gold Hover Lift & Pop-up Modal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {rolesList.map((roleItem, idx) => (
            <div
              key={roleItem.role}
              onClick={() => setSelectedRole(roleItem)}
              className={`gms-role-card gms-fade-up stagger-${(idx % 5) + 1} ${aboutVisible ? 'visible' : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRole(roleItem); } }}
              aria-label={`View role details for ${roleItem.role}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: roleItem.badgeColor, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {roleItem.badge}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#A67C00', fontWeight: '700' }}>
                  Details →
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#242424', margin: '4px 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{roleItem.icon}</span> {roleItem.role}
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                {roleItem.shortDesc}
              </p>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #F0EDE5' }}>
                <span style={{ fontSize: '0.74rem', color: '#707070', fontWeight: '600' }}>
                  Click to inspect server permissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. SECTION F: CALL TO ACTION
          ------------------------------------------------------------- */}
      <section ref={ctaRef} style={{
        padding: '70px 24px',
        background: 'linear-gradient(135deg, #FAF6ED 0%, #FFFFFF 100%)',
        borderTop: '1px solid #E8D293',
        borderBottom: '1px solid #E8D293',
        textAlign: 'center'
      }}>
        <div className={`gms-fade-up ${ctaVisible ? 'visible' : ''}`} style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#242424', margin: '0 0 14px 0', letterSpacing: '-0.8px' }}>
            Ready to Simplify Your Gym Management?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#707070', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            Join gym owners who run their facilities with speed, clarity, and security. Set up your facility in minutes.
          </p>
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="gms-btn-primary"
            style={{
              padding: '14px 34px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Get Started
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          8. SECTION G: PROFESSIONAL FOOTER
          ------------------------------------------------------------- */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E8E5DC',
        padding: '50px 28px 30px 28px',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            {/* Col 1: Brand Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  G
                </div>
                <strong style={{ fontSize: '1rem', color: '#242424' }}>Gym Management System</strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#707070', lineHeight: 1.6, margin: 0 }}>
                Simple, reliable, and professional operations platform for gym owners, coaches, and members.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Navigation</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <li><button type="button" onClick={() => scrollToSection('home')} className="gms-footer-link">Home</button></li>
                <li><button type="button" onClick={() => scrollToSection('features')} className="gms-footer-link">Features</button></li>
                <li><button type="button" onClick={() => scrollToSection('how-it-works')} className="gms-footer-link">How It Works</button></li>
                <li><button type="button" onClick={() => scrollToSection('about')} className="gms-footer-link">About</button></li>
              </ul>
            </div>

            {/* Col 3: Portals */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Portals</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <li><button type="button" onClick={() => { scrollToSection('about'); setSelectedRole(rolesList[0]); }} className="gms-footer-link">Gym Owner Dashboard</button></li>
                <li><button type="button" onClick={() => { scrollToSection('about'); setSelectedRole(rolesList[1]); }} className="gms-footer-link">Personal Trainer Roster</button></li>
                <li><button type="button" onClick={() => { scrollToSection('about'); setSelectedRole(rolesList[2]); }} className="gms-footer-link">Athlete Member Pass</button></li>
                <li><button type="button" onClick={() => { scrollToSection('about'); setSelectedRole(rolesList[4]); }} className="gms-footer-link">Front-Desk Terminal</button></li>
              </ul>
            </div>

            {/* Col 4: Account Actions */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#242424', textTransform: 'uppercase', marginBottom: '12px' }}>Get Started</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="gms-footer-link"
                  style={{ textAlign: 'left', fontWeight: '500' }}
                >
                  Log In to Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="gms-footer-link"
                  style={{ textAlign: 'left', color: '#A67C00', fontWeight: '700' }}
                >
                  Create Gym Owner Account →
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div style={{
            borderTop: '1px solid #E8E5DC',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.78rem',
            color: '#707070'
          }}>
            <div>
              © {new Date().getFullYear()} Gym Management System (GMS). Built on Zoho Catalyst Serverless Cloud.
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <Link to="/privacy-policy" className="gms-footer-link">Privacy Policy</Link>
              <Link to="/terms-of-service" className="gms-footer-link">Terms of Service</Link>
              <Link to="/security" className="gms-footer-link">Security</Link>
              <a href="mailto:support@aurum-gms.com" className="gms-footer-link">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* -------------------------------------------------------------
          INTERACTIVE DETAIL MODALS FOR FEATURES, STEPS & ROLES
          ------------------------------------------------------------- */}
      {/* Feature Details Modal */}
      {selectedFeature && (
        <div
          onClick={() => setSelectedFeature(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gms-modal-content"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              border: '1px solid #E8D293',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedFeature(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F8F8F6',
                border: '1px solid #E8E5DC',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#707070',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A227'; e.currentTarget.style.borderColor = '#C9A227'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#707070'; e.currentTarget.style.borderColor = '#E8E5DC'; }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FAF6ED', color: '#A67C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid #E8D293' }}>
                {selectedFeature.icon}
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedFeature.roleAccess}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#242424' }}>
                  {selectedFeature.title}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.94rem', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '20px' }}>
              {selectedFeature.fullDesc}
            </p>

            <div style={{ background: '#FAFAF8', borderRadius: '12px', padding: '18px', border: '1px solid #E8E5DC', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', fontWeight: '800', color: '#242424', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Core Capabilities & Controls
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#4A4A4A', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedFeature.capabilities.map((cap, i) => (
                  <li key={i}>{cap}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#707070' }}>
                Protected by role-based data policies
              </span>
              <button
                type="button"
                onClick={() => { setSelectedFeature(null); setShowSignup(true); }}
                className="gms-btn-primary"
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Access Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Details Modal */}
      {selectedStep && (
        <div
          onClick={() => setSelectedStep(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gms-modal-content"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              padding: '32px',
              border: '1px solid #E8D293',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedStep(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F8F8F6',
                border: '1px solid #E8E5DC',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#707070',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A227'; e.currentTarget.style.borderColor = '#C9A227'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#707070'; e.currentTarget.style.borderColor = '#E8E5DC'; }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C9A227 0%, #A67C00 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: '800',
                boxShadow: '0 4px 12px rgba(201, 162, 39, 0.35)'
              }}>
                {selectedStep.step}
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#A67C00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Step {selectedStep.step} Onboarding Guide
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.45rem', fontWeight: '800', color: '#242424' }}>
                  {selectedStep.title}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.94rem', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '20px' }}>
              {selectedStep.fullDesc}
            </p>

            <div style={{ background: '#FAF6ED', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E8D293', marginBottom: '24px' }}>
              <strong style={{ fontSize: '0.84rem', color: '#A67C00', display: 'block', marginBottom: '4px' }}>
                Key Operational Value:
              </strong>
              <span style={{ fontSize: '0.88rem', color: '#242424', fontWeight: '600' }}>
                {selectedStep.keyTakeaway}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#F8F8F6',
                  border: '1px solid #E8E5DC',
                  fontWeight: '600',
                  color: '#707070',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { setSelectedStep(null); setShowSignup(true); }}
                className="gms-btn-primary"
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {selectedRole && (
        <div
          onClick={() => setSelectedRole(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="gms-modal-content"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              border: '1px solid #E8D293',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedRole(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F8F8F6',
                border: '1px solid #E8E5DC',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#707070',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A227'; e.currentTarget.style.borderColor = '#C9A227'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#707070'; e.currentTarget.style.borderColor = '#E8E5DC'; }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FAF6ED', color: '#A67C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid #E8D293' }}>
                {selectedRole.icon}
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: selectedRole.badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedRole.badge}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#242424' }}>
                  {selectedRole.role}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.94rem', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '20px' }}>
              {selectedRole.fullDesc}
            </p>

            <div style={{ background: '#FAFAF8', borderRadius: '12px', padding: '18px', border: '1px solid #E8E5DC', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', fontWeight: '800', color: '#242424', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Role Responsibilities & Access Boundary
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#4A4A4A', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedRole.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#707070' }}>
                Server-side Catalyst Data Store isolation
              </span>
              <button
                type="button"
                onClick={() => { setSelectedRole(null); setShowLogin(true); }}
                className="gms-btn-primary"
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Log In as {selectedRole.role}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner-Only Registration & Role Login Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
      />
      <OwnerSignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
      />
    </div>
  );
};
