import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useLang } from '../i18n/LanguageContext';

export const StockHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();

  useEffect(() => {
    api.get('/stock/history')
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('stock_title')}</h2>
          <div className="page-header-sub">
            {lang === 'fr' ? 'Tous les mouvements de stock' : 'All stock movements'}
          </div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('prod_name')}</th>
              <th>{t('stock_action')}</th>
              <th>{t('quantity')}</th>
              <th>{t('stock_performed_by')}</th>
              <th>{t('stock_note')}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any) => (
              <tr key={h.id ?? h._id}>
                <td style={{ fontSize: '0.82rem' }}>{new Date(h.createdAt ?? h.date).toLocaleString()}</td>
                <td>{h.product?.productName ?? h.productId?.productName ?? '—'}</td>
                <td>
                  <span style={{
                    padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: h.action === 'INCREASE' || h.changeType === 'IN' ? '#dcfce7' : '#fee2e2',
                    color: h.action === 'INCREASE' || h.changeType === 'IN' ? '#166534' : '#b91c1c',
                  }}>
                    {h.action === 'INCREASE' || h.changeType === 'IN'
                      ? (lang === 'fr' ? 'ENTRÉE' : 'IN')
                      : (lang === 'fr' ? 'SORTIE' : 'OUT')}
                  </span>
                </td>
                <td>{h.quantity ?? h.quantityChanged}</td>
                <td>{h.performedBy?.name ?? h.userId?.name ?? '—'}</td>
                <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>{h.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">{t('no_data')}</div>
          </div>
        )}
      </div>
    </div>
  );
};
