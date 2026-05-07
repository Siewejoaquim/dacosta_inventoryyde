import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useLang } from '../i18n/LanguageContext';
import { saveInvoicePDF } from '../utils/saveInvoicePDF';

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  guarantee: string; // per-item guarantee
}

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t, lang } = useLang();

  const [products, setProducts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('UNPAID');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [guarantee, setGuarantee] = useState(''); // global guarantee
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/products').then((res) => {
      setProducts(res.data);
      if (res.data.length > 0) {
        setItems([{ productId: res.data[0].id, quantity: 1, unitPrice: res.data[0].sellingPrice ?? 0, originalPrice: res.data[0].sellingPrice ?? 0, guarantee: '' }]);
      }
    }).catch(() => {});
  }, []);

  const calculatedTotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const originalTotal   = items.reduce((s, it) => s + it.quantity * it.originalPrice, 0);
  const isDiscounted    = calculatedTotal < originalTotal;
  const displayTotal    = paymentStatus === 'PARTIAL' ? amountPaid : calculatedTotal;

  const handleItemChange = (idx: number, field: keyof InvoiceItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const p = products.find((p) => p.id === value);
        next[idx] = { ...next[idx], productId: value, unitPrice: p?.sellingPrice ?? 0, originalPrice: p?.sellingPrice ?? 0 };
      } else if (field === 'guarantee') {
        next[idx].guarantee = value;
      } else {
        (next[idx] as any)[field] = Number(value);
      }
      return next;
    });
  };

  const addRow = () => {
    if (products.length === 0) return;
    setItems((prev) => [...prev, { productId: products[0].id, quantity: 1, unitPrice: products[0].sellingPrice ?? 0, originalPrice: products[0].sellingPrice ?? 0, guarantee: '' }]);
  };

  const removeRow = (idx: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = t('inv_customer_name') + ' *';
    if (paymentStatus === 'PARTIAL' && amountPaid <= 0) e.amountPaid = t('inv_amount_paid') + ' > 0';
    if (paymentStatus === 'PARTIAL' && amountPaid >= calculatedTotal) e.amountPaid = t('pay_partial');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalAmountPaid = paymentStatus === 'PAID' ? calculatedTotal : paymentStatus === 'PARTIAL' ? amountPaid : 0;

    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone: customerPhone || undefined,
        status: paymentStatus,
        amountPaid: finalAmountPaid,
        guarantee: guarantee || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          productName: products.find((p) => p.id === it.productId)?.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          guarantee: it.guarantee || undefined,
        })),
      };

      const res = await api.post('/invoices', payload);
      toast.success(t('success'));

      // Save as PDF directly — no print dialog
      await saveInvoicePDF({
        invoiceNumber: res.data.invoiceNumber,
        customerName,
        customerPhone,
        dateCreated: res.data.dateCreated ?? new Date().toISOString(),
        items: items.map((it) => ({
          productName: products.find((p) => p.id === it.productId)?.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.quantity * it.unitPrice,
          guarantee: it.guarantee || undefined,
        })),
        totalAmount: paymentStatus === 'PARTIAL' ? amountPaid : calculatedTotal,
        originalAmount: isDiscounted ? originalTotal : undefined,
        amountPaid: finalAmountPaid,
        status: paymentStatus,
        guarantee: guarantee || undefined,
      });

      toast.info(lang === 'fr' ? 'PDF enregistré — vérifiez vos téléchargements !' : 'PDF saved — check your downloads!');
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <button className="btn secondary" onClick={() => navigate('/invoices')} style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }}>
            <RiArrowLeftLine size={14} /> {t('btn_back')}
          </button>
          <h2 style={{ margin: 0 }}>{t('inv_create_title')}</h2>
          <div className="page-header-sub">{t('inv_create_subtitle')}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{t('inv_customer_details')}</div>
          <div className="form-grid">
            <div className="field">
              <label>{t('inv_customer_name')} <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className={`input ${errors.customerName ? 'error' : ''}`} value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: '' })); }}
                placeholder="e.g., Jean-Pierre Mbarga" maxLength={100} />
              {errors.customerName && <div className="input-error">{errors.customerName}</div>}
            </div>
            <div className="field">
              <label>{t('inv_customer_phone')}</label>
              <input className="input" value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +237 6XX XXX XXX" maxLength={30} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title" style={{ margin: 0 }}>{t('inv_items')}</div>
            <button type="button" className="btn secondary" onClick={addRow} style={{ fontSize: '0.82rem' }}>
              <RiAddLine size={14} /> {t('inv_add_item')}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>{t('inv_product')}</th>
                  <th style={{ width: '10%' }}>{t('inv_qty')}</th>
                  <th style={{ width: '18%' }}>{t('inv_unit_price')} (Fr)</th>
                  <th style={{ width: '15%' }}>{t('total')}</th>
                  <th style={{ width: '20%' }}>{lang === 'fr' ? 'Garantie' : 'Guarantee'}</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isReduced = item.unitPrice < item.originalPrice;
                  return (
                    <tr key={idx} style={{ background: isReduced ? '#fef9c3' : undefined }}>
                      <td>
                        <select className="select" value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)} required>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" className="input" value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} min={1} required />
                      </td>
                      <td>
                        <input type="number" className="input" value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} min={0} required />
                        {isReduced && (
                          <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: 2 }}>
                            {t('inv_original')} Fr {item.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>Fr {(item.quantity * item.unitPrice).toLocaleString()}</td>
                      <td>
                        {/* Per-item guarantee */}
                        <select
                          className="select"
                          value={item.guarantee}
                          onChange={(e) => handleItemChange(idx, 'guarantee', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">{lang === 'fr' ? 'Aucune' : 'None'}</option>
                          <option value="1 semaine">1 {lang === 'fr' ? 'semaine' : 'week'}</option>
                          <option value="2 semaines">2 {lang === 'fr' ? 'semaines' : 'weeks'}</option>
                          <option value="1 mois">1 {lang === 'fr' ? 'mois' : 'month'}</option>
                          <option value="3 mois">3 {lang === 'fr' ? 'mois' : 'months'}</option>
                          <option value="6 mois">6 {lang === 'fr' ? 'mois' : 'months'}</option>
                          <option value="1 an">1 {lang === 'fr' ? 'an' : 'year'}</option>
                          <option value="2 ans">2 {lang === 'fr' ? 'ans' : 'years'}</option>
                        </select>
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeRow(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, display: 'flex' }}>
                            <RiDeleteBinLine size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{t('inv_payment')}</div>
          <div className="form-grid">
            <div className="field">
              <label>{t('inv_payment_status')}</label>
              <select className="select" value={paymentStatus}
                onChange={(e) => {
                  const v = e.target.value as 'PAID' | 'UNPAID' | 'PARTIAL';
                  setPaymentStatus(v);
                  if (v === 'PAID') setAmountPaid(calculatedTotal);
                  if (v === 'UNPAID') setAmountPaid(0);
                  setErrors((p) => ({ ...p, amountPaid: '' }));
                }}>
                <option value="UNPAID">{t('pay_unpaid')}</option>
                <option value="PAID">{t('pay_paid')}</option>
                <option value="PARTIAL">{t('pay_partial')}</option>
              </select>
            </div>
            {paymentStatus === 'PARTIAL' && (
              <div className="field">
                <label>{t('inv_amount_paid')} (Fr) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="number" className={`input ${errors.amountPaid ? 'error' : ''}`}
                  value={amountPaid || ''}
                  onChange={(e) => { setAmountPaid(Number(e.target.value)); setErrors((p) => ({ ...p, amountPaid: '' })); }}
                  min={1} max={calculatedTotal - 1} />
                {errors.amountPaid && <div className="input-error">{errors.amountPaid}</div>}
                <div className="input-hint">{t('pay_full_hint')} Fr {calculatedTotal.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Global guarantee */}
          <div className="field" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🛡️ {lang === 'fr' ? 'Garantie globale (optionnel)' : 'Global Guarantee (optional)'}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['', '1 semaine', '2 semaines', '1 mois', '3 mois', '6 mois', '1 an', '2 ans'].map((g) => {
                const label = g === '' ? (lang === 'fr' ? 'Aucune' : 'None')
                  : g.replace('semaine', lang === 'fr' ? 'semaine' : 'week')
                     .replace('semaines', lang === 'fr' ? 'semaines' : 'weeks')
                     .replace('mois', lang === 'fr' ? 'mois' : 'month(s)')
                     .replace('an', lang === 'fr' ? 'an' : 'year')
                     .replace('ans', lang === 'fr' ? 'ans' : 'years');
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGuarantee(g)}
                    className="btn secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.3rem 0.85rem',
                      background: guarantee === g ? '#0f172a' : undefined,
                      color: guarantee === g ? 'white' : undefined,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {guarantee && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                🛡️ {lang === 'fr' ? `Garantie : ${guarantee}` : `Guarantee: ${guarantee}`}
              </div>
            )}
          </div>

          {/* Total summary */}
          <div className="inv-total-row" style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  {t('inv_original')} Fr {originalTotal.toLocaleString()}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {paymentStatus === 'PARTIAL' ? t('inv_discounted') : t('inv_total_amount')}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
              Fr {displayTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={() => navigate('/invoices')} disabled={loading}>
            {t('btn_cancel')}
          </button>
          <button type="submit" className="btn" disabled={loading} style={{ minWidth: 180 }}>
            {loading ? t('saving') : t('btn_save_pdf')}
          </button>
        </div>
      </form>
    </div>
  );
};
