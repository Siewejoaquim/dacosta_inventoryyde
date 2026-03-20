import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import React from 'react';
import { decodeToken, UserInfo } from '../api/auth';
import { Layout } from '../components/Layout';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { ProductsPage } from './ProductsPage';
import { ProductFormPage } from './ProductFormPage';
import { InvoicesPage } from './InvoicesPage';
import { InvoiceCreatePage } from './InvoiceCreatePage';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { ReportsPage } from './ReportsPage';
import { UsersPage } from './UsersPage';
import { StockHistoryPage } from './StockHistoryPage';
import { ChangePasswordPage } from './ChangePasswordPage';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: ('ADMIN' | 'STAFF')[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRoles }) => {
  const token = localStorage.getItem('dacosta_token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRoles && requiredRoles.length > 0) {
    const user = decodeToken();
    if (!user || !requiredRoles.includes(user.role)) return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const wrap = (element: React.ReactNode, roles?: ('ADMIN' | 'STAFF')[]) => (
  <RequireAuth requiredRoles={roles}>
    <Layout>{element}</Layout>
  </RequireAuth>
);

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={wrap(<DashboardPage />)} />
      <Route path="/products" element={wrap(<ProductsPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/products/new" element={wrap(<ProductFormPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/products/:id" element={wrap(<ProductFormPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/invoices" element={wrap(<InvoicesPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/invoices/new" element={wrap(<InvoiceCreatePage />, ['ADMIN', 'STAFF'])} />
      <Route path="/invoices/:id" element={wrap(<InvoiceDetailPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/reports" element={wrap(<ReportsPage />, ['ADMIN', 'STAFF'])} />
      <Route path="/stock-history" element={wrap(<StockHistoryPage />, ['ADMIN'])} />
      <Route path="/users" element={wrap(<UsersPage />, ['ADMIN'])} />
      <Route path="/change-password" element={wrap(<ChangePasswordPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
