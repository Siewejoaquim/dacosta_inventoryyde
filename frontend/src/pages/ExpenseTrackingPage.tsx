import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useLang } from '../i18n/LanguageContext';

type Period = 'monthly' | '6months' | 'yearly' | 'custom';

export const ExpenseTrackingPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLang();

  const PERIOD_LABELS: Record<Period, string> = {
    monthly:  lang === 'fr' ? 'Ce mois'         : 'This Month',
    '6months':lang === 'fr' ? '6 derniers mois' : 'Last 6 Months',
    yearly:   lang === 'fr' ? 'Cette année'      : 'This Year',
    custom:   lang === 'fr' ? 'Personnalisé'     : 'Custom Range',
  };

  const load = async (p: Period, f?: string, tDate?: string) => {
    setLoading(true);
    try {
      const params: any = { period: p };
      if (p === 'custom' && f && tDate) { params.from = f; params.to = tDate; }

      const [expRes, salesRes] = await Promise.all([
        api.get('/expenses/summary', { params }),
        api.get('/reports/custom', {
          params: p === 'custom' && f && tDate
            ? { from: f, to: tDate }
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

  const revenue  = salesData?.totalSales ?? 0;
  const expenses = data?.total ?? 0;
  const net      = revenue - expenses;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('nav_expense_tracking')}</h2>
          <div className="page-header-sub">
            {lang === 'fr' ? 'Revenus vs dépenses' : 'Revenue vs expenses breakdown'}
          </div>
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
        <form onSubmit={(e) => { e.preventDefault(); load('custom', from, to); }}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>{t('rep_from')}</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>{t('rep_to')}</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} required style={{ width: 'auto' }} />
          </div>
          <button className="btn" type="submit" disabled={loading}>{t('btn_apply')}</button>
        </form>
      )}

      {loading ? (
        <div style={{ color: '#6b7280' }}>{t('loading')}</div>
      ) : (
        <>
          <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
            <div className="card accent-blue">
              <div className="card-title">{lang === 'fr' ? 'Revenus' : 'Revenue'}</div>
              <div className="card-value" style={{ color: '#166534' }}>Fr {revenue.toLocaleString()}</div>
              <div className="card-sub">{salesData?.invoiceCount ?? 0} {lang === 'fr' ? 'factures' : 'invoices'}</div>
            </div>
            <div className="card accent-red">
              <div className="card-title">{lang === 'fr' ? 'Total dépenses' : 'Total Expenses'}</div>
              <div className="card-value" style={{ color: '#b91c1c' }}>Fr {expenses.toLocaleString()}</div>
              <div className="card-sub">{data?.expenses?.length ?? 0} {lang === 'fr' ? 'entrées' : 'entries'}</div>
            </div>
            <div className="card accent-green">
              <div className="card-title">{lang === 'fr' ? 'Bénéfice net' : 'Net Profit'}</div>
              <div className="card-value" style={{ color: net >= 0 ? '#166534' : '#b91c1c' }}>
                Fr {net.toLocaleString()}
              </div>
              <div className="card-sub">
                {revenue > 0 ? `${((net / revenue) * 100).toFixed(1)}% ${lang === 'fr' ? 'marge' : 'margin'}` : '—'}
              </div>
            </div>
          </div>

          <div className="page-grid-2">
            <div className="card">
              <div className="card-title">{lang === 'fr' ? 'Dépenses par catégorie' : 'Expenses by Category'}</div>
              {data?.byCategory && Object.keys(data.byCategory).length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('category')}</th>
                      <th>{t('total')}</th>
                      <th>%</th>
                    </tr>
                  </thead>
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
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  {lang === 'fr' ? 'Aucune dépense sur cette période.' : 'No expenses in this period.'}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">{lang === 'fr' ? 'Toutes les dépenses' : 'All Expenses'}</div>
              {data?.expenses?.length > 0 ? (
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('date')}</th>
                        <th>{t('category')}</th>
                        <th>{t('description')}</th>
                        <th>{t('amount')}</th>
                        <th>{lang === 'fr' ? 'Par' : 'By'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenses.map((e: any) => (
                        <tr key={e.id ?? e._id}>
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
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  {lang === 'fr' ? 'Aucune dépense sur cette période.' : 'No expenses in this period.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
