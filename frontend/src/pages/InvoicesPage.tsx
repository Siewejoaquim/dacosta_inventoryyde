import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';

const statusStyle: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: '#dcfce7', color: '#166534' },
  UNPAID:  { bg: '#fee2e2', color: '#b91c1c' },
  PARTIAL: { bg: '#fef9c3', color: '#854d0e' },
  VOID:    { bg: '#e5e7eb', color: '#374151' },
};

export const InvoicesPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
    api.get('/invoices').then((res) => setInvoices(res.data));
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const displayed = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (!isAdmin && inv.createdBy?._id !== user?.id) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Invoices</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {isAdmin ? 'All sales invoices' : 'Your invoices'}
          </div>
        </div>
        <Link to="/invoices/new" className="btn">+ New invoice</Link>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['', 'UNPAID', 'PARTIAL', 'PAID', 'VOID'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="btn secondary"
            style={{
              background: statusFilter === s ? '#0f172a' : undefined,
              color: statusFilter === s ? 'white' : undefined,
              fontSize: '0.8rem', padding: '0.35rem 0.9rem',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              {isAdmin && <th>Created By</th>}
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((inv) => {
              const s = statusStyle[inv.status] ?? statusStyle.UNPAID;
              return (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.customerName}</td>
                  <td>Fr {inv.totalAmount.toLocaleString()}</td>
                  <td>
                    <span style={{
                      padding: '0.15rem 0.55rem', borderRadius: 999,
                      fontSize: '0.72rem', fontWeight: 600,
                      background: s.bg, color: s.color,
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  {isAdmin && <td>{inv.createdBy?.name}</td>}
                  <td>{new Date(inv.dateCreated).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/invoices/${inv._id}`} style={{ color: '#2563eb', fontSize: '0.8rem' }}>
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>No invoices found</div>
        )}
      </div>
    </div>
  );
};
