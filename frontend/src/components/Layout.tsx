import { NavLink, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { decodeToken, UserInfo } from '../api/auth';
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
} from 'react-icons/ri';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const SHARED_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <RiDashboardLine />, end: true },
  { to: '/products', label: 'Products', icon: <RiBox3Line /> },
  { to: '/invoices', label: 'Invoices', icon: <RiFileList3Line /> },
  { to: '/expenses', label: 'Expenses', icon: <RiMoneyDollarCircleLine /> },
  { to: '/product-requests', label: 'Requests', icon: <RiClipboardLine /> },
  { to: '/reports', label: 'Reports', icon: <RiBarChartLine /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/stock-history', label: 'Stock History', icon: <RiHistoryLine /> },
  { to: '/expense-tracking', label: 'Expense Tracking', icon: <RiPieChartLine /> },
  { to: '/users', label: 'Users', icon: <RiTeamLine /> },
];

const ACCOUNT_NAV: NavItem[] = [
  { to: '/change-password', label: 'Change Password', icon: <RiLockPasswordLine /> },
];

const NavSection: React.FC<{ label: string; items: NavItem[]; onClose: () => void }> = ({ label, items, onClose }) => (
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

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dacosta_token');
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const close = () => setMobileMenuOpen(false);

  // Generate initials from name or username
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="layout">
      <aside className="sidebar">
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

        <nav className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavSection label="Menu" items={SHARED_NAV} onClose={close} />
          {isAdmin && <NavSection label="Admin" items={ADMIN_NAV} onClose={close} />}
          <NavSection label="Account" items={ACCOUNT_NAV} onClose={close} />
        </nav>

        <div className="sidebar-footer">
          <button className="btn secondary" onClick={handleLogout}>
            <RiLogoutBoxLine size={15} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
};
