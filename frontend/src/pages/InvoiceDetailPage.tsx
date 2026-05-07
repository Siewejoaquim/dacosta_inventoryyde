import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiDownloadLine, RiArrowLeftLine } from 'react-icons/ri';
import api from '../api/client';
import { decodeToken } from '../api/auth';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { useLang } from '../i18n/LanguageContext';
import { saveInvoicePDF } from '../utils/saveInvoicePDF';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const user = decodeToken();
  const isAdmin = user?.role === 'ADMIN';
  const toast = useToast();
  const confirm = useConfirm();
  const { t, lang } = useLang();

  const load = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
      setAmountPaid(String(res.data.amountPaid ?? 0));
    } catch {
      toast.error('Invoice not found');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/invoices/${id}/payment`, { amountPaid: Number(amountPaid) });
      toast.success('Payment updated successfully');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async () => {
    const ok = await confirm({
      title: t('inv_void_confirm'),
      message: t('inv_void_message'),
      confirmLabel: t('btn_void'),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/invoices/${id}/void`);
      toast.success('Invoice voided and stock restored');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to void invoice');
    }
  };

  const [savingPDF, setSavingPDF] = useState(false);

  const getInvoiceData = () => ({
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    dateCreated: invoice.dateCreated,
    items: (invoice.items ?? invoice.itemsPurchased ?? []).map((it: any) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      guarantee: it.guarantee ?? undefined,
    })),
    totalAmount: invoice.totalAmount,
    originalAmount: invoice.originalAmount,
    amountPaid: invoice.amountPaid,
    status: invoice.status,
    guarantee: invoice.guarantee ?? undefined,
  });

  const handlePrint = async () => {
    if (!invoice) return;
    await printInvoice(getInvoiceData());
  };

  const handleSavePDF = async () => {
    if (!invoice) return;
    setSavingPDF(true);
    try {
      await saveInvoicePDF(getInvoiceData());
      toast.success('PDF saved — check your downloads folder!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setSavingPDF(false);
    }
  };

  if (loading) return <div>{t('loading')}</div>;
  if (!invoice) return null;

  const balance = invoice.totalAmount - (invoice.amountPaid ?? 0);
  const statusColors: Record<string, string> = {
    PAID: '#dcfce7', UNPAID: '#fee2e2', PARTIAL: '#fef9c3', VOID: '#e5e7eb',
  };
  const statusText: Record<string, string> = {
    PAID: '#166534', UNPAID: '#b91c1c', PARTIAL: '#854d0e', VOID: '#374151',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{invoice.invoiceNumber}</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {new Date(invoice.dateCreated).toLocaleString()}
            {invoice.createdBy && ` · Created by ${invoice.createdBy.name}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={handleSavePDF}
            disabled={savingPDF}
            style={{ background: '#16a34a' }}
          >
            <RiDownloadLine size={15} />
            {savingPDF ? t('saving') : t('btn_save_pdf')}
          </button>
          {isAdmin && invoice.status !== 'VOID' && (
            <button className="btn danger" onClick={handleVoid}>
              {t('btn_void')}
            </button>
          )}
          <button className="btn secondary" onClick={() => navigate('/invoices')}>
            <RiArrowLeftLine size={14} /> {t('btn_back')}
          </button>
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <div className="card-title">Items</div>
          <table className="table">
            <thead>
              <tr><th>{t('inv_product')}</th><th>{t('inv_qty')}</th><th>{t('inv_unit_price')}</th><th>{t('total')}</th></tr>
            </thead>
            <tbody>
              {(invoice.items ?? invoice.itemsPurchased ?? []).map((item: any, i: number) => (
                <tr key={i}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>Fr {(item.unitPrice ?? 0).toLocaleString()}</td>
                  <td>Fr {(item.totalPrice ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            {invoice.status === 'PARTIAL' && (invoice as any).originalAmount && (
              <div style={{ fontSize: '0.85rem', color: '#999', textDecoration: 'line-through', marginBottom: 4 }}>
                Original: Fr {((invoice as any).originalAmount).toLocaleString()}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {invoice.status === 'PARTIAL' ? 'Discounted Price' : 'Total'}: Fr {(invoice.totalAmount ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-title">{t('inv_customer')}</div>
            <div style={{ fontWeight: 600 }}>{invoice.customerName}</div>
            {invoice.customerPhone && <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{invoice.customerPhone}</div>}
            {/* Guarantee */}
            {invoice.guarantee && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>
                🛡️ {lang === 'fr' ? `Garantie : ${invoice.guarantee}` : `Guarantee: ${invoice.guarantee}`}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">{t('inv_payment')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{
                padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                background: statusColors[invoice.status] ?? '#e5e7eb',
                color: statusText[invoice.status] ?? '#374151',
              }}>{invoice.status}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              {t('inv_amount_paid')}: Fr {(invoice.amountPaid ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: balance > 0 ? '#b91c1c' : '#166534', fontWeight: 600 }}>
              {t('inv_balance')}: Fr {balance.toLocaleString()}
            </div>

            {invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
              <form onSubmit={handlePayment} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={invoice.totalAmount}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={t('inv_amount_paid')}
                />
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? t('saving') : t('btn_save')}
                </button>
              </form>
            )}
          </div>

          {invoice.status === 'VOID' && (
            <div className="card" style={{ background: '#f9fafb' }}>
              <div style={{ color: '#b91c1c', fontWeight: 600 }}>{t('inv_voided')}</div>
              {invoice.voidedAt && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {new Date(invoice.voidedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
