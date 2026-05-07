import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { useLang } from '../i18n/LanguageContext';

export const ProductRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ productName: '', description: '', customerName: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FULFILLED'>('ALL');
  const toast = useToast();
  const confirm = useConfirm();
  const { t, lang } = useLang();

  const load = () => {
    api.get('/product-requests').then((r) => setRequests(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      toast.error(t('req_product') + ' *');
      return;
    }
    setSaving(true);
    try {
      await api.post('/product-requests', form);
      setForm({ productName: '', description: '', customerName: '' });
      toast.success(lang === 'fr' ? 'Demande enregistrée' : 'Product request logged successfully');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleFulfill = async (requestId: string, productName: string) => {
    const ok = await confirm({
      title: lang === 'fr' ? 'Marquer comme satisfaite ?' : 'Mark as fulfilled?',
      message: `"${productName}" — ${lang === 'fr' ? 'cette action est irréversible.' : 'This cannot be undone.'}`,
      confirmLabel: t('req_mark_fulfilled'),
    });
    if (!ok) return;
    try {
      try {
        await api.post(`/product-requests/${requestId}/fulfill`, {});
        toast.success(lang === 'fr' ? 'Demande satisfaite' : 'Request marked as fulfilled');
        load();
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.warning(lang === 'fr' ? 'Fonctionnalité en cours de déploiement.' : 'Feature is being deployed. Try again shortly.');
          return;
        }
        throw error;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error'));
    }
  };

  const displayed = requests.filter((r) => filter === 'ALL' || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const filterLabels = {
    ALL:       lang === 'fr' ? 'Tous'        : 'All',
    PENDING:   lang === 'fr' ? 'En attente'  : 'Pending',
    FULFILLED: lang === 'fr' ? 'Satisfaites' : 'Fulfilled',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>
            {t('req_title')}
            {pendingCount > 0 && (
              <span className="badge" style={{ marginLeft: 8 }}>
                {pendingCount} {lang === 'fr' ? 'en attente' : 'pending'}
              </span>
            )}
          </h2>
          <div className="page-header-sub">
            {lang === 'fr'
              ? "Enregistrez les pièces demandées par les clients que vous n'avez pas en stock"
              : "Log parts customers asked for that you don't have"}
          </div>
        </div>
      </div>

      <div className="page-grid-2">
        {/* Form */}
        <div className="card">
          <div className="card-title">{t('req_log')}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="field">
              <label>{t('req_product')}</label>
              <input className="input"
                placeholder={lang === 'fr' ? 'ex. Plaquettes de frein Toyota Corolla' : 'e.g. Toyota Corolla brake pads'}
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
            </div>
            <div className="field">
              <label>{t('req_customer')} ({lang === 'fr' ? 'optionnel' : 'optional'})</label>
              <input className="input"
                placeholder={lang === 'fr' ? 'Qui a demandé ?' : 'Who asked for it?'}
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="field">
              <label>{lang === 'fr' ? 'Notes' : 'Notes'} ({lang === 'fr' ? 'optionnel' : 'optional'})</label>
              <input className="input"
                placeholder={lang === 'fr' ? 'Détails supplémentaires...' : 'Any extra details...'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? t('saving') : t('req_log')}
            </button>
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
                {filterLabels[f]}
              </button>
            ))}
          </div>

          {displayed.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{t('no_data')}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('req_product')}</th>
                  <th>{t('req_customer')}</th>
                  <th>{lang === 'fr' ? 'Notes' : 'Notes'}</th>
                  <th>{t('status')}</th>
                  <th>{lang === 'fr' ? 'Par' : 'By'}</th>
                  <th>{t('date')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r: any) => (
                  <tr key={r.id ?? r._id}>
                    <td style={{ fontWeight: 600 }}>{r.productName}</td>
                    <td>{r.customerName || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>{r.description || '—'}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: r.status === 'FULFILLED' ? '#dcfce7' : '#fef9c3',
                        color: r.status === 'FULFILLED' ? '#166534' : '#854d0e',
                      }}>
                        {r.status === 'FULFILLED'
                          ? (lang === 'fr' ? 'SATISFAITE' : 'FULFILLED')
                          : (lang === 'fr' ? 'EN ATTENTE' : 'PENDING')}
                      </span>
                    </td>
                    <td>{r.loggedBy?.name ?? '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td>
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleFulfill(r.id ?? r._id, r.productName)}
                          style={{ fontSize: '0.78rem', background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          {t('req_mark_fulfilled')}
                        </button>
                      )}
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
