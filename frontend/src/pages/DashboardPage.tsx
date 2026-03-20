import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import { useDashboardSummary } from '../api/hooks';
import api from '../api/client';

const StaffExpenseSummary: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState(0);

  useEffect(() => {
    api.get('/expenses/today').then((r) => setExpenses(r.data)).catch(() => {});
    api.get('/invoices').then((r) => {
      const today = new Date();
      const sales = (r.data as any[])
        .filter((inv) => {
          const d = new Date(inv.dateCreated);
          return d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate() &&
            inv.status !== 'VOID';
        })
        .reduce((s: number, inv: any) => s + inv.totalAmount, 0);
      setTodaySales(sales);
    }).catch(() => {});
  }, []);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const net = todaySales - totalExpenses;

  return (
    <>
      {/* Net today card */}
      <div className="card-grid" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-title">Sales Today</div>
          <div className="card-value" style={{ fontSize: '1.1rem' }}>Fr {todaySales.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-title">Expenses Today</div>
          <div className="card-value" style={{ fontSize: '1.1rem', color: '#b91c1c' }}>Fr {totalExpenses.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-title">Net Today</div>
          <div className="card-value" style={{ fontSize: '1.1rem', color: net >= 0 ? '#166534' : '#b91c1c' }}>Fr {net.toLocaleString()}</div>
        </div>
      </div>

      {/* Expense list */}
      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div className="card-title" style={{ margin: 0 }}>Today's Expenses</div>
          <div style={{ fontWeight: 700 }}>Fr {totalExpenses.toLocaleString()}</div>
        </div>
        {expenses.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>No expenses logged today. <Link to="/expenses" style={{ color: '#2563eb' }}>Log one</Link></div>
        ) : (
          <table className="table">
            <thead><tr><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {expenses.slice(0, 5).map((e: any) => (
                <tr key={e._id}>
                  <td><span className="pill muted">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td>Fr {e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {expenses.length > 5 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>
            <Link to="/expenses" style={{ color: '#2563eb' }}>View all {expenses.length} expenses</Link>
          </div>
        )}
      </div>
    </>
  );
};

const AdminDeadStock: React.FC = () => {
  const [deadStock, setDeadStock] = useState<any[]>([]);
  useEffect(() => {
    api.get('/products/dead-stock').then((r) => setDeadStock(r.data)).catch(() => {});
  }, []);
  if (deadStock.length === 0) return null;
  return (
    <div className="card" style={{ marginTop: '1.2rem' }}>
      <div className="card-title">
        Dead Stock <span className="badge">{deadStock.length} items</span>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        Products with stock that haven't moved in 30+ days
      </div>
      <table className="table">
        <thead><tr><th>Product</th><th>Category</th><th>In Stock</th><th>Last Updated</th></tr></thead>
        <tbody>
          {deadStock.map((p: any) => (
            <tr key={p._id}>
              <td>{p.productName}</td>
              <td>{p.category}</td>
              <td>{p.quantityInStock}</td>
              <td style={{ color: '#b91c1c', fontSize: '0.82rem' }}>
                {new Date(p.lastUpdated).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
          <div className="page-header-sub">Staff dashboard — create invoices and log expenses</div>
          </div>
        </div>
        <div className="card" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/invoices/new" className="btn">+ New Invoice</Link>
            <Link to="/invoices" className="btn secondary">View Invoices</Link>
            <Link to="/products" className="btn secondary">View Products</Link>
            <Link to="/expenses" className="btn secondary">Log Expense</Link>
            <Link to="/product-requests" className="btn secondary">Product Requests</Link>
          </div>
        </div>
        <StaffExpenseSummary />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div className="page-header-sub">Overview of DaCosta All Motors inventory and sales.</div>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card accent-blue">
          <div className="card-title">Total Products</div>
          <div className="card-value">{data?.totalProducts}</div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">Sales Today</div>
          <div className="card-value">
            Fr {data?.totalSalesToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="card-sub">
            Expenses: Fr {(data?.expensesToday ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card accent-green">
          <div className="card-title">Net Today</div>
          <div className="card-value" style={{ color: (data?.netToday ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {(data?.netToday ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">Weekly Sales</div>
          <div className="card-value">
            Fr {data?.weeklySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">Monthly Revenue</div>
          <div className="card-value">
            Fr {data?.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="card-sub">
            Expenses: Fr {(data?.expensesMonthly ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card accent-green">
          <div className="card-title">Net This Month</div>
          <div className="card-value" style={{ color: (data?.netMonthly ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {(data?.netMonthly ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
      <AdminDeadStock />
    </div>
  );
};

