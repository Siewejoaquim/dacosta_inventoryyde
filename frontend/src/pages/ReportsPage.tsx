import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useLang } from '../i18n/LanguageContext';

const fmt = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

function downloadReport(data: any, from: string, to: string, lang: string) {
  const rows = (data.topProducts ?? []).map((p: any) => `
    <tr>
      <td>${p.productName ?? p.name ?? '—'}</td>
      <td style="text-align:center">${p._sum?.quantity ?? p.quantity ?? 0}</td>
      <td style="text-align:right">Fr ${fmt(p._sum?.totalPrice ?? p.revenue ?? 0)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>DaCosta Report ${from} - ${to}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
    .sub { color: #6b7280; font-size: 0.85rem; margin-bottom: 2rem; }
    .summary { display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e5e7eb; padding: 0.5rem 0.4rem; }
    td { padding: 0.5rem 0.4rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .footer { margin-top: 3rem; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>DaCosta All Motors — ${lang === 'fr' ? 'Rapport de ventes' : 'Sales Report'}</h1>
  <div class="sub">${lang === 'fr' ? 'Période' : 'Period'}: ${from} → ${to}</div>
  <div class="summary">
    <div class="stat">
      <div class="stat-label">${lang === 'fr' ? 'Revenus' : 'Revenue'}</div>
      <div class="stat-value">Fr ${fmt(data.totalSales)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">${lang === 'fr' ? 'Dépenses' : 'Expenses'}</div>
      <div class="stat-value">Fr ${fmt(data.totalExpenses)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">${lang === 'fr' ? 'Bénéfice net' : 'Net Profit'}</div>
      <div class="stat-value">Fr ${fmt(data.netProfit)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">${lang === 'fr' ? 'Factures' : 'Invoices'}</div>
      <div class="stat-value">${data.invoiceCount ?? 0}</div>
    </div>
  </div>
  ${rows ? `
  <h2 style="font-size:1rem;margin-bottom:0.5rem;">${lang === 'fr' ? 'Top produits' : 'Top Products'}</h2>
  <table>
    <thead><tr>
      <th>${lang === 'fr' ? 'Produit' : 'Product'}</th>
      <th style="text-align:center">${lang === 'fr' ? 'Qté vendue' : 'Qty Sold'}</th>
      <th style="text-align:right">${lang === 'fr' ? 'Revenus' : 'Revenue'}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>` : ''}
  <div class="footer">${lang === 'fr' ? 'Généré le' : 'Generated on'} ${new Date().toLocaleString()}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dacosta-report-${from}-to-${to}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const ReportsPage: React.FC = () => {
  const [weekly, setWeekly]   = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [loadingCustom, setLoadingCustom] = useState(false);
  const { t, lang } = useLang();

  useEffect(() => {
    Promise.all([
      api.get('/reports/weekly').catch(() => ({ data: {} })),
      api.get('/reports/monthly').catch(() => ({ data: {} })),
    ]).then(([w, m]) => {
      setWeekly(w.data ?? {});
      setMonthly(m.data ?? {});
      setLoading(false);
    });
  }, []);

  const handleCustomReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    setLoadingCustom(true);
    try {
      const res = await api.get('/reports/custom', { params: { from: fromDate, to: toDate } });
      downloadReport(res.data, fromDate, toDate, lang);
    } catch (err: any) {
      alert(err.response?.data?.message ?? t('error'));
    } finally {
      setLoadingCustom(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h2 style={{ margin: 0 }}>{t('rep_title')}</h2></div>
        <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 32, width: '70%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weeklySales    = weekly?.totalSales ?? 0;
  const weeklyCount    = weekly?.invoiceCount ?? 0;
  const weeklyTop      = weekly?.topProducts ?? [];
  const monthlySales   = monthly?.totalSales ?? 0;
  const monthlyExpenses = monthly?.totalExpenses ?? 0;
  const monthlyNet     = monthly?.netProfit ?? 0;
  const monthlyCount   = monthly?.invoiceCount ?? 0;
  const monthlyTop     = monthly?.topProducts ?? [];
  const lowStock       = monthly?.lowStock ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('rep_title')}</h2>
          <div className="page-header-sub">{t('rep_subtitle')}</div>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="card accent-blue">
          <div className="card-title">{t('rep_weekly')}</div>
          <div className="card-value">Fr {fmt(weeklySales)}</div>
          <div className="card-sub">{weeklyCount} {t('rep_invoices_week')}</div>
        </div>
        <div className="card accent-blue">
          <div className="card-title">{t('rep_monthly')}</div>
          <div className="card-value">Fr {fmt(monthlySales)}</div>
          <div className="card-sub">{monthlyCount} {t('rep_invoices_month')}</div>
        </div>
        <div className="card accent-green">
          <div className="card-title">{t('rep_net_profit')}</div>
          <div className="card-value" style={{ color: monthlyNet >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Fr {fmt(monthlyNet)}
          </div>
          <div className="card-sub">{t('dash_expenses_sub')} Fr {fmt(monthlyExpenses)}</div>
        </div>
      </div>

      <div className="page-grid-2" style={{ marginBottom: '1.2rem' }}>
        <div className="card">
          <div className="card-title">{t('rep_weekly_top')}</div>
          {weeklyTop.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('rep_no_sales_week')}</div>
          ) : (
            <table className="table">
              <thead><tr><th>{t('prod_name')}</th><th>{t('quantity')}</th><th>{t('rep_monthly')}</th></tr></thead>
              <tbody>
                {weeklyTop.map((p: any, i: number) => (
                  <tr key={i}>
                    <td>{p.productName ?? p.name ?? '—'}</td>
                    <td>{p._sum?.quantity ?? p.quantity ?? 0}</td>
                    <td>Fr {fmt(p._sum?.totalPrice ?? p.revenue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card-title">{t('rep_monthly_top')}</div>
          {monthlyTop.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('rep_no_sales_month')}</div>
          ) : (
            <table className="table">
              <thead><tr><th>{t('prod_name')}</th><th>{t('quantity')}</th><th>{t('amount')}</th></tr></thead>
              <tbody>
                {monthlyTop.map((p: any, i: number) => (
                  <tr key={i}>
                    <td>{p.productName ?? p.name ?? '—'}</td>
                    <td>{p._sum?.quantity ?? p.quantity ?? 0}</td>
                    <td>Fr {fmt(p._sum?.totalPrice ?? p.revenue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-title">{t('rep_custom')}</div>
        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>{t('rep_custom_hint')}</div>
        <form onSubmit={handleCustomReport} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('rep_from')}</label>
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('rep_to')}</label>
            <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <button className="btn" type="submit" disabled={loadingCustom}>
            {loadingCustom ? t('rep_generating') : `↓ ${t('btn_download')}`}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">
          {t('rep_low_stock')}
          {lowStock.length > 0 && <span className="badge" style={{ marginLeft: 8 }}>{lowStock.length}</span>}
        </div>
        {lowStock.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t('dash_healthy_stock')}</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('prod_name')}</th>
                <th>{t('prod_in_stock')}</th>
                <th>{t('prod_reorder')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.productName}</td>
                  <td className="low-stock">{p.quantityInStock}</td>
                  <td>{p.reorderPoint ?? 5}</td>
                  <td><span className="badge">{t('rep_low_stock')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
