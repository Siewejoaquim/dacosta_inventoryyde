import React, { useEffect, useState } from 'react';
import api from '../api/client';

export const ProductRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ productName: '', description: '', customerName: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FULFILLED'>('ALL');

  const load = () => {
    api.get('/product-requests').then((r) => setRequests(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/product-requests', form);
      setForm({ productName: '', description: '', customerName: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const displayed = requests.filter((r) => filter === 'ALL' || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>
            Product Requests
            {pendingCount > 0 && <span className="badge" style={{ marginLeft: 8 }}>{pendingCount} pending</span>}
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Log parts customers asked for that you don't have</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.2rem' }}>
        {/* Form */}
        <div className="card">
          <div className="card-title">Log a request</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Part / Product Name</label>
              <input className="input" placeholder="e.g. Toyota Corolla brake pads" value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Customer Name (optional)</label>
              <input className="input" placeholder="Who asked for it?" value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: 3 }}>Notes (optional)</label>
              <input className="input" placeholder="Any extra details..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log Request'}</button>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {(['ALL', 'PENDING', 'FULFILLED'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="btn secondary"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem',
                  background: filter === f ? '#0f172a' : undefined,
                  color: filter === f ? 'white' : undefined }}>
                {f}
              </button>
            ))}
          </div>
          {displayed.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No requests found.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Customer</th><th>Notes</th><th>Status</th><th>By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {displayed.map((r: any) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.productName}</td>
                    <td>{r.customerName || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>{r.description || '—'}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: r.status === 'FULFILLED' ? '#dcfce7' : '#fef9c3',
                        color: r.status === 'FULFILLED' ? '#166534' : '#854d0e',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.loggedBy?.name ?? '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(r.date).toLocaleDateString()}
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
