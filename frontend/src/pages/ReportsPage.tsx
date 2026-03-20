import React, { useEffect, useState } from 'react';
import api from '../api/client';

function downloadReportPDF(data: any, from: string, to: string) {
  const rows = data.topProducts.map((p: any) => `
    <tr>
      <td>${p.name}</td>
      <td style="text-align:center">${p.quantity}</td>
      <td style="text-align:right">Fr ${p.revenue.toLocaleString()}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Sales Report ${from} to ${to}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
    .sub { color: #6b7280; font-size: 0.85rem; margin-bottom: 2rem; }
    .summary { display: flex; gap: 2rem; margin-bottom: 2rem; }
    .stat { }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e5e7eb; padding: 0.5rem 0.4rem; }
    td { padding: 0.5rem 0.4rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .footer { margin-top: 3rem; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>DaCosta All Motors — Sales Report</h1>
  <div class="sub">Period: ${from} to ${to}</div>
  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value">Fr ${data.totalRevenue.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Invoices</div>
      <div class="stat-value">${data.numberOfInvoices}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Products Sold</div>
      <div class="stat-value">${data.totalProductsSold}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Product</th><th style="text-align:center">Qty Sold</th><th style="text-align:right">Revenue</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated on ${new Date().toLocaleString()}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${from}-to-${to}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const ReportsPage: React.FC = () => {
  const [weekly, setWeekly] = useState<any | null>(null);
  const [monthly, setMonthly] = useState<any | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingCustom, setLoadingCustom] = useState(false);

  const load = async () => {
    const [w, m] = await Promise.all([
      api.get('/reports/weekly'),
      api.get('/reports/monthly'),
    ]);
    setWeekly(w.data);
    setMonthly(m.data);
  };

  useEffect(() => { load(); }, []);

  const handleCustomReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    setLoadingCustom(true);
    try {
      const res = await api.get('/reports/custom', { params: { from: fromDate, to: toDate } });
      downloadReportPDF(res.data, fromDate, toDate);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to generate report');
    } finally {
      setLoadingCustom(false);
    }
  };

  if (!weekly || !monthly) return <div>Loading reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>Reports</h2>
      </div>

      <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Weekly sales</div>
          <div className="card-value">Fr {weekly.totalSales.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{weekly.numberOfInvoices} invoices this week</div>
        </div>
        <div className="card">
          <div className="card-title">Monthly revenue</div>
          <div className="card-value">Fr {monthly.totalMonthlyRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{monthly.totalProductsSold} products sold</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Weekly top products</div>
          <table className="table">
            <thead><tr><th>Product</th><th>Qty</th></tr></thead>
            <tbody>
              {weekly.topSellingProducts.map((p: any, i: number) => (
                <tr key={i}><td>{p.name}</td><td>{p.quantity}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Monthly best sellers</div>
          <table className="table">
            <thead><tr><th>Product</th><th>Qty</th></tr></thead>
            <tbody>
              {monthly.bestSellingProducts.map((p: any, i: number) => (
                <tr key={i}><td>{p.name}</td><td>{p.quantity}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom date range report */}
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <div className="card-title">Custom date range report</div>
        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          Pick a date range and download a PDF report with revenue, invoice count, and top products.
        </div>
        <form onSubmit={handleCustomReport} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ margin: 0 }}>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>From</label>
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <div style={{ margin: 0 }}>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>To</label>
            <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <button className="btn" type="submit" disabled={loadingCustom}>
            {loadingCustom ? 'Generating...' : '↓ Download Report'}
          </button>
        </form>
      </div>

      {/* Inventory status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div className="card-title" style={{ margin: 0 }}>Inventory status</div>
        </div>
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>In Stock</th><th>Reorder Point</th><th>Status</th></tr>
          </thead>
          <tbody>
            {monthly.inventoryStatus.map((p: any) => {
              const reorder = p.reorderPoint ?? 5;
              const low = p.quantityInStock < reorder;
              return (
                <tr key={p._id}>
                  <td>{p.productName}</td>
                  <td>{p.category}</td>
                  <td className={low ? 'low-stock' : ''}>{p.quantityInStock}</td>
                  <td>{reorder}</td>
                  <td>
                    {low ? (
                      <span className="badge">Low</span>
                    ) : (
                      <span className="pill success">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
