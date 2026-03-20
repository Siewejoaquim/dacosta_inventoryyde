import React, { useEffect, useState } from 'react';
import api from '../api/client';

export const StockHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock/history')
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Stock History</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>All stock movements</div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any) => (
              <tr key={h._id}>
                <td>{new Date(h.date).toLocaleString()}</td>
                <td>{h.productId?.productName ?? '—'}</td>
                <td>
                  <span style={{
                    padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: h.changeType === 'IN' ? '#dcfce7' : '#fee2e2',
                    color: h.changeType === 'IN' ? '#166534' : '#b91c1c',
                  }}>
                    {h.changeType}
                  </span>
                </td>
                <td>{h.quantityChanged}</td>
                <td>{h.userId?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>No stock history found</div>
        )}
      </div>
    </div>
  );
};
