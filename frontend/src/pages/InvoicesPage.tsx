import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';
import { RiAddLine, RiDownloadLine } from 'react-icons/ri';
import { useLang } from '../i18n/LanguageContext';
import { saveInvoicePDF } from '../utils/saveInvoicePDF';

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
  const navigate = useNavigate();
  const { t, lang } = useLang();

  useEffect(() => {
    setUser(decodeToken());
    api.get('/invoices').then((res) => setInvoices(res.data)).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  const displayed = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (!isAdmin && inv.createdBy?.id !== user?.id && inv.createdBy?._id !== user?.id) return false;
    return true;
  });

  // Translate status labels
  const statusLabel: Record<string, string> = lang === 'fr'
    ? { PAID: 'PAYÉ', UNPAID: 'IMPAYÉ', PARTIAL: 'PARTIEL', VOID: 'ANNULÉ' }
    : { PAID: 'PAID', UNPAID: 'UNPAID', PARTIAL: 'PARTIAL', VOID: 'VOID' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('inv_title')}</h2>
          <div className="page-header-sub">
            {isAdmin ? t('inv_all') : t('inv_mine')}
          </div>
        </div>
        <button className="btn" onClick={() => navigate('/invoices/new')}>
          <RiAddLine size={16} /> {t('inv_new')}
        </button>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['', 'UNPAID', 'PARTIAL', 'PAID', 'VOID'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="btn secondary"
            style={{
              background: statusFilter === s ? '#0f172a' : undefined,
              color: statusFilter === s ? 'white' : undefined,
              fontSize: '0.8rem',
              padding: '0.35rem 0.9rem',
            }}
          >
            {s ? (statusLabel[s] ?? s) : t('all')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('inv_number')}</th>
              <th>{t('inv_customer')}</th>
              <th>{t('total')}</th>
              <th>{t('status')}</th>
              {isAdmin && <th>{t('inv_created_by')}</th>}
              <th>{t('date')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((inv) => {
              const s = statusStyle[inv.status] ?? statusStyle.UNPAID;
              return (
                <tr key={inv.id ?? inv._id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td>{inv.customerName}</td>
                  <td>Fr {(inv.totalAmount ?? 0).toLocaleString()}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: s.bg,
                      color: s.color,
                    }}>
                      {statusLabel[inv.status] ?? inv.status}
                    </span>
                  </td>
                  {isAdmin && <td>{inv.createdBy?.name ?? '—'}</td>}
                  <td>{new Date(inv.dateCreated).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <Link
                        to={`/invoices/${inv.id ?? inv._id}`}
                        style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 500 }}
                      >
                        {t('btn_view')}
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await saveInvoicePDF({
                              invoiceNumber: inv.invoiceNumber,
                              customerName: inv.customerName,
                              customerPhone: inv.customerPhone,
                              dateCreated: inv.dateCreated,
                              items: (inv.items ?? inv.itemsPurchased ?? []).map((it: any) => ({
                                productName: it.productName,
                                quantity: it.quantity,
                                unitPrice: it.unitPrice,
                                totalPrice: it.totalPrice,
                              })),
                              totalAmount: inv.totalAmount,
                              originalAmount: inv.originalAmount,
                              amountPaid: inv.amountPaid,
                              status: inv.status,
                            });
                          } catch { /* silent */ }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 0, display: 'flex' }}
                        title={t('btn_save_pdf')}
                      >
                        <RiDownloadLine size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><RiAddLine /></div>
            <div className="empty-state-title">{t('inv_no_invoices')}</div>
            <div className="empty-state-message">{t('inv_create_first')}</div>
            <button className="btn" onClick={() => navigate('/invoices/new')}>
              + {t('inv_new')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
