import { NavLink, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { decodeToken, UserInfo } from '../api/auth';
import { useLang } from '../i18n/LanguageContext';
import {
  RiDashboardLine,
  RiBox3Line,
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiClipboardLine,
  RiBarChartLine,
  RiHistoryLine,
  RiPieChartLine,
  RiTeamLine,
  RiLockPasswordLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiTranslate2,
} from 'react-icons/ri';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

// ── NavSection must be defined OUTSIDE Layout ─────────────────────────────────
const NavSection: React.FC<{ label: string; items: NavItem[]; onClose: () => void }> = ({
  label,
  items,
  onClose,
}) => (
  <>
    <div className="sidebar-section-label">{label}</div>
    {items.map((item) => (
      <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}>
        <span className="nav-icon">{item.icon}</span>
        {item.label}
      </NavLink>
    ))}
  </>
);

// ── Layout ────────────────────────────────────────────────────────────────────
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    setUser(decodeToken());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dacosta_token');
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const close = () => setMobileMenuOpen(false);
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  const SHARED_NAV: NavItem[] = [
    { to: '/',                 label: t('nav_dashboard'),        icon: <RiDashboardLine />, end: true },
    { to: '/products',         label: t('nav_products'),         icon: <RiBox3Line /> },
    { to: '/invoices',         label: t('nav_invoices'),         icon: <RiFileList3Line /> },
    { to: '/expenses',         label: t('nav_expenses'),         icon: <RiMoneyDollarCircleLine /> },
    { to: '/product-requests', label: t('nav_requests'),         icon: <RiClipboardLine /> },
    { to: '/reports',          label: t('nav_reports'),          icon: <RiBarChartLine /> },
  ];

  const ADMIN_NAV: NavItem[] = [
    { to: '/stock-history',    label: t('nav_stock_history'),    icon: <RiHistoryLine /> },
    { to: '/expense-tracking', label: t('nav_expense_tracking'), icon: <RiPieChartLine /> },
    { to: '/users',            label: t('nav_users'),            icon: <RiTeamLine /> },
  ];

  const ACCOUNT_NAV: NavItem[] = [
    { to: '/change-password',  label: t('nav_change_password'),  icon: <RiLockPasswordLine /> },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* ── Header ── */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 5v3h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <div className="sidebar-title">DaCosta</div>
                <div className="sidebar-subtitle">All Motors</div>
              </div>
            </div>
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
            </button>
          </div>

          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials}</div>
              <div>
                <div className="sidebar-user-name">{user.username}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavSection label="Menu" items={SHARED_NAV} onClose={close} />
          {isAdmin && <NavSection label="Admin" items={ADMIN_NAV} onClose={close} />}
          <NavSection label={lang === 'fr' ? 'Compte' : 'Account'} items={ACCOUNT_NAV} onClose={close} />
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          {/* Language toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.6rem',
            padding: '0.4rem 0.5rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <RiTranslate2 size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <button
              onClick={() => setLang('fr')}
              style={{
                flex: 1,
                background: lang === 'fr' ? 'var(--accent)' : 'transparent',
                color: lang === 'fr' ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                flex: 1,
                background: lang === 'en' ? 'var(--accent)' : 'transparent',
                color: lang === 'en' ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              EN
            </button>
          </div>

          <button className="btn secondary" onClick={handleLogout}>
            <RiLogoutBoxLine size={15} />
            {t('nav_logout')}
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
};
