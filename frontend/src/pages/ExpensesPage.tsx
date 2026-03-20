import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { decodeToken } from '../api/auth';

const CATEGORIES = ['Food', 'Transport', 'Supplies', 'Utilities', 'Other'];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const user = decodeToken();
  const isAdmin = user?.role === 'ADMIN';

  const load = () => {
    api.get('/expenses/today').then((r) => setExpenses(r.data));
  };

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setForm({ description: '', amount: '', category: 'Food' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to log expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Daily Expenses</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Log today's shop expenses</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1.5fr' : '1fr 1.5fr', gap: '1.2rem' }}>
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log an expense</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Description</label>
              <input className="input" placeholder="e.g. Staff lunch, printer paper..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Amount (Fr)</label>
              <input className="input" type="number" min={0} step="0.01" placeholder="0" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: '0.82rem' }}>{error}</div>}
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log Expense'}</button>
          </form>
        </div>

        {/* Today's list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="card-title" style={{ margin: 0 }}>Today's expenses</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Fr {total.toLocaleString()}</div>
          </div>
          {expenses.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No expenses logged today.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Category</th><th>Description</th><th>Amount</th><th>By</th><th>Time</th></tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e._id}>
                    <td>
                      <span className="pill muted">{e.category}</span>
                    </td>
                    <td>{e.description}</td>
                    <td>Fr {e.amount.toLocaleString()}</td>
                    <td>{e.loggedBy?.name ?? '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
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
