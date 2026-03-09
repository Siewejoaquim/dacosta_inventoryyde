import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import { useDashboardSummary } from '../api/hooks';

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const { data, isLoading } = useDashboardSummary();

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  if (isAdmin && (isLoading || !data)) {
    return <div>Loading dashboard...</div>;
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2 style={{ margin: 0 }}>Welcome</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Staff dashboard - Create and manage invoices
            </div>
          </div>
        </div>
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/invoices/new" className="btn">
              + New Invoice
            </Link>
            <Link to="/invoices" className="btn secondary">
              View Invoices
            </Link>
            <Link to="/products" className="btn secondary">
              View Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Overview of DaCosta All Motors inventory and sales.
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">Total Products</div>
          <div className="card-value">{data?.totalProducts}</div>
        </div>
        <div className="card">
          <div className="card-title">Sales Today</div>
          <div className="card-value">
            Fr {data?.totalSalesToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Weekly Sales</div>
          <div className="card-value">
            Fr {data?.weeklySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Monthly Revenue</div>
          <div className="card-value">
            Fr {data?.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Recent Invoices</div>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentInvoices.map((inv: any) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.customerName}</td>
                  <td>Fr {inv.totalAmount.toLocaleString()}</td>
                  <td>{new Date(inv.dateCreated).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">
            Low Stock Alerts{' '}
            {data?.lowStock && data.lowStock.length > 0 && (
              <span className="badge">{data.lowStock.length} items</span>
            )}
          </div>
          {!data?.lowStock || data.lowStock.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>All stock levels are healthy.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((p: any) => (
                  <tr key={p._id}>
                    <td>{p.productName}</td>
                    <td className="low-stock">{p.quantityInStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

