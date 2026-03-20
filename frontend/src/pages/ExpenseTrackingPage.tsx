import React, { useState, useEffect } from 'react';
import api from '../api/client';

type Period = 'monthly' | '6months' | 'yearly' | 'custom';

const PERIOD_LABELS: Record<Period, string> = {
  monthly: 'This Month',
  '6months': 'Last 6 Months',
  yearly: 'This Year',
  custom: 'Custom Range',
};

export const ExpenseTrackingPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async (p: Period, f?: string, t?: string) => {
    setLoading(true);
    try {
      const params: any = { period: p };
      if (p === 'custom' && f && t) { params.from = f; params.to = t; }

      const [expRes, salesRes] = await Promise.all([
        api.get('/expenses/summary', { params }),
        api.get('/reports/custom', {
          params: p === 'custom' && f && t
            ? { from: f, to: t }
            : p === 'monthly'
            ? { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }
            : p === '6months'
            ? { from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }
            : { from: `${new Date().getFullYear()}-01-01`, to: new Date().toISOString().split('T')[0] },
        }),
      ]);
      setData(expRes.data);
      setSalesData(salesRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load('monthly'); }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p !== 'custom') load(p);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load('custom', from, to);
  };

  const revenue = salesData?.totalRevenue ?? 0;
  const expenses = data?.total ?? 0;
  const net = revenue - expenses;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Expense Tracking</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Revenue vs expenses breakdown</div>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button key={p} onClick={() => handlePeriodChange(p)} className="btn secondary"
            style={{ fontSize: '0.82rem', padding: '0.4rem 1rem',
              background: period === p ? '#0f172a' : undefined,
              color: period === p ? 'white' : undefined }}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>From</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>To</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <button className="btn" type="submit" disabled={loading}>Apply</button>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <>
          {/* Summary cards */}
          <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
            <div className="card">
              <div className="card-title">Revenue</div>
              <div className="card-value" style={{ color: '#166534' }}>Fr {revenue.toLocaleString()}</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{salesData?.numberOfInvoices ?? 0} invoices</div>
            </div>
            <div className="card">
              <div className="card-title">Total Expenses</div>
              <div className="card-value" style={{ color: '#b91c1c' }}>Fr {expenses.toLocaleString()}</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{data?.expenses?.length ?? 0} entries</div>
            </div>
            <div className="card">
              <div className="card-title">Net Profit</div>
              <div className="card-value" style={{ color: net >= 0 ? '#166534' : '#b91c1c' }}>
                Fr {net.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                {revenue > 0 ? `${((net / revenue) * 100).toFixed(1)}% margin` : '—'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.2rem' }}>
            {/* By category */}
            <div className="card">
              <div className="card-title">Expenses by Category</div>
              {data?.byCategory && Object.keys(data.byCategory).length > 0 ? (
                <table className="table">
                  <thead><tr><th>Category</th><th>Total</th><th>%</th></tr></thead>
                  <tbody>
                    {Object.entries(data.byCategory)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([cat, amt]) => (
                        <tr key={cat}>
                          <td><span className="pill muted">{cat}</span></td>
                          <td>Fr {(amt as number).toLocaleString()}</td>
                          <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                            {expenses > 0 ? `${(((amt as number) / expenses) * 100).toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No expenses in this period.</div>
              )}
            </div>

            {/* Expense list */}
            <div className="card">
              <div className="card-title">All Expenses</div>
              {data?.expenses?.length > 0 ? (
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>By</th></tr></thead>
                    <tbody>
                      {data.expenses.map((e: any) => (
                        <tr key={e._id}>
                          <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(e.date).toLocaleDateString()}</td>
                          <td><span className="pill muted">{e.category}</span></td>
                          <td>{e.description}</td>
                          <td>Fr {e.amount.toLocaleString()}</td>
                          <td style={{ fontSize: '0.78rem' }}>{e.loggedBy?.name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No expenses in this period.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
