import { NavLink, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { decodeToken, UserInfo } from '../api/auth';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);

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
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          {(isAdmin || isStaff) && (
            <>
              <NavLink to="/products">Products</NavLink>
              <NavLink to="/invoices">Invoices</NavLink>
              <NavLink to="/reports">Reports</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/users">Users</NavLink>
            </>
          )}
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

