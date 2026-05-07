import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import { useDashboardSummary } from '../api/hooks';
import { useLang } from '../i18n/LanguageContext';
import api from '../api/client';

const fmt = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const StaffExpenseSummary: React.FC = () => {
  const { t, lang } = useLang();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/expenses/today').catch(() => ({ data: [] })),
      api.get('/invoices').catch(() => ({ data: [] })),
    ]).then(([expRes, invRes]) => {
      setExpenses(expRes.data ?? []);
      const today = new Date();
      const sales = ((invRes.data as any[]) ?? [])
        .filter((inv) => {
          const d = new Date(inv.dateCreated);
          return d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate() &&
            inv.status !== 'VOID';
        })
        .reduce((s: number, inv: any) => s + (inv.totalAmount ?? 0), 0);
      setTodaySales(sales);
      setLoading(false);
    });
  }, []);

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const net = todaySales - totalExpenses;

  if (loading) {
    return (
      <div className="card-grid" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: '80%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="card-grid" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
        <div className="card accent-blue">
          <div className="card-title">{t('dash_sales_today')}</div>
          <div className="card-value" style={{ fontSize: '1.1rem' }}>Fr {fmt(todaySales)}</div>
        </div>
        <div className="card accent-red">
          <div className="card-title">{t('dash_expenses_today')}</div>
          <div className="card-value" style={{ fontSize: '1.1rem', color: 'var(--danger)' }}>Fr {fmt(totalExpenses)}</div>
        </div>
        <div className="card accent-green">
          <div className="card-title">{t('dash_net_today')}</div>
          <div className="card-value" style={{ fontSize: '1.1rem', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {fmt(net)}
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div className="card-title" style={{ margin: 0 }}>{t('exp_today')}</div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Fr {fmt(totalExpenses)}</div>
        </div>
        {expenses.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {t('exp_no_expenses')}{' '}
            <Link to="/expenses" style={{ color: 'var(--accent)' }}>{t('exp_log_one')}</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('category')}</th>
                <th>{t('description')}</th>
                <th>{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map((e: any, i: number) => (
                <tr key={e.id ?? i}>
                  <td><span className="pill muted">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td>Fr {fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {expenses.length > 5 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>
            <Link to="/expenses" style={{ color: 'var(--accent)' }}>
              {t('btn_view')} {t('all')} {expenses.length} {t('nav_expenses').toLowerCase()}
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

const AdminDeadStock: React.FC = () => {
  const { t, lang } = useLang();
  const [deadStock, setDeadStock] = useState<any[]>([]);
  useEffect(() => {
    api.get('/products/dead-stock').then((r) => setDeadStock(r.data ?? [])).catch(() => {});
  }, []);
  if (deadStock.length === 0) return null;
  return (
    <div className="card" style={{ marginTop: '1.2rem' }}>
      <div className="card-title">
        {t('dash_dead_stock')} <span className="badge">{deadStock.length} items</span>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.5rem' }}>
      {lang === 'fr'
          ? 'Produits sans mouvement depuis 30+ jours'
          : 'Products with no stock movement in 30+ days'}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>{t('prod_name')}</th>
            <th>{t('category')}</th>
            <th>{t('prod_in_stock')}</th>
            <th>{t('date')}</th>
          </tr>
        </thead>
        <tbody>
          {deadStock.map((p: any, i: number) => (
            <tr key={p.id ?? i}>
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

const DashboardSkeleton: React.FC = () => (
  <div>
    <div className="page-header">
      <div>
        <div className="skeleton" style={{ height: 28, width: 160, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 280 }} />
      </div>
    </div>
    <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card">
          <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 32, width: '80%' }} />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const { data, isLoading } = useDashboardSummary();
  const { t } = useLang();

  useEffect(() => {
    setUser(decodeToken());
    setUserLoaded(true);
  }, []);

  if (!userLoaded) return <DashboardSkeleton />;
  const isAdmin = user?.role === 'ADMIN';
  if (isAdmin && isLoading) return <DashboardSkeleton />;

  if (!isAdmin) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2 style={{ margin: 0 }}>{t('dash_welcome')}, {user?.username ?? 'Staff'}</h2>
            <div className="page-header-sub">{t('dash_staff_subtitle')}</div>
          </div>
        </div>
        <div className="card" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>{t('dash_quick_actions')}</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/invoices/new" className="btn">+ {t('inv_new')}</Link>
            <Link to="/invoices" className="btn secondary">{t('nav_invoices')}</Link>
            <Link to="/products" className="btn secondary">{t('nav_products')}</Link>
            <Link to="/expenses" className="btn secondary">{t('exp_log')}</Link>
            <Link to="/product-requests" className="btn secondary">{t('nav_requests')}</Link>
          </div>
        </div>
        <StaffExpenseSummary />
      </div>
    );
  }

  const totalProducts   = data?.totalProducts ?? 0;
  const totalSalesToday = data?.totalSalesToday ?? 0;
  const expensesToday   = data?.expensesToday ?? 0;
  const netToday        = data?.netToday ?? 0;
  const weeklySales     = data?.weeklySales ?? 0;
  const monthlyRevenue  = data?.monthlyRevenue ?? 0;
  const expensesMonthly = data?.expensesMonthly ?? 0;
  const netMonthly      = data?.netMonthly ?? 0;
  const lowStock        = data?.lowStock ?? [];
  const recentInvoices  = data?.recentInvoices ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('dash_title')}</h2>
          <div className="page-header-sub">{t('dash_subtitle')}</div>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card accent-blue">
          <div className="card-title">{t('dash_total_products')}</div>
          <div className="card-value">{totalProducts}</div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">{t('dash_sales_today')}</div>
          <div className="card-value">Fr {fmt(totalSalesToday)}</div>
          <div className="card-sub">{t('dash_expenses_sub')} Fr {fmt(expensesToday)}</div>
        </div>
        <div className="card accent-green">
          <div className="card-title">{t('dash_net_today')}</div>
          <div className="card-value" style={{ color: netToday >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {fmt(netToday)}
          </div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">{t('dash_weekly_sales')}</div>
          <div className="card-value">Fr {fmt(weeklySales)}</div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">{t('dash_monthly_revenue')}</div>
          <div className="card-value">Fr {fmt(monthlyRevenue)}</div>
          <div className="card-sub">{t('dash_expenses_sub')} Fr {fmt(expensesMonthly)}</div>
        </div>
        <div className="card accent-green">
          <div className="card-title">{t('dash_net_month')}</div>
          <div className="card-value" style={{ color: netMonthly >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {fmt(netMonthly)}
          </div>
        </div>
      </div>

      <div className="page-grid-dashboard">
        <div className="card">
          <div className="card-title">{t('dash_recent_invoices')}</div>
          {recentInvoices.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('dash_no_invoices')}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('inv_number')}</th>
                  <th>{t('inv_customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv: any, i: number) => (
                  <tr key={inv.id ?? i}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} style={{ color: 'var(--accent)' }}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.customerName}</td>
                    <td>Fr {fmt(inv.totalAmount)}</td>
                    <td>{new Date(inv.dateCreated).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            {t('dash_low_stock')}{' '}
            {lowStock.length > 0 && <span className="badge">{lowStock.length} items</span>}
          </div>
          {lowStock.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('dash_healthy_stock')}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('prod_name')}</th>
                  <th>{t('quantity')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p: any, i: number) => (
                  <tr key={p.id ?? i}>
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
