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
import { ReportsPage } from './ReportsPage';
import { UsersPage } from './UsersPage';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: ('ADMIN' | 'STAFF')[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRoles }) => {
  const token = localStorage.getItem('dacosta_token');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const user = decodeToken();
    if (!user || !requiredRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <DashboardPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/products"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <ProductsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/products/new"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <ProductFormPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/products/:id"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <ProductFormPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/invoices"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <InvoicesPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/invoices/new"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <InvoiceCreatePage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth requiredRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <ReportsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth requiredRoles={['ADMIN']}>
            <Layout>
              <UsersPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

