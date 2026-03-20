import { NavLink, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { decodeToken, UserInfo } from '../api/auth';

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
  const isStaff = user?.role === 'STAFF';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="sidebar-title">
            DaCosta All Motors
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
              Inventory & Sales Console
            </div>
            {user && (
              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.5rem', fontWeight: 'normal' }}>
                Role: {user.role}
              </div>
            )}
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#e5e7eb',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            ☰
          </button>
        </div>
        <nav className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </NavLink>
          {(isAdmin || isStaff) && (
            <>
              <NavLink to="/products" onClick={() => setMobileMenuOpen(false)}>Products</NavLink>
              <NavLink to="/invoices" onClick={() => setMobileMenuOpen(false)}>Invoices</NavLink>
              <NavLink to="/reports" onClick={() => setMobileMenuOpen(false)}>Reports</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/stock-history" onClick={() => setMobileMenuOpen(false)}>Stock History</NavLink>
              <NavLink to="/users" onClick={() => setMobileMenuOpen(false)}>Users</NavLink>
            </>
          )}
          <NavLink to="/change-password" onClick={() => setMobileMenuOpen(false)}>Change Password</NavLink>
        </nav>
        <button
          className="btn secondary"
          style={{ marginTop: '2rem', width: '100%' }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
};

