import React, { useEffect, useState } from 'react';
import { RiEditLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import api from '../api/client';
import { decodeToken } from '../api/auth';
import { useToast } from '../components/Toast';
import { useLang } from '../i18n/LanguageContext';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', category: 'Food' });
  const [editSaving, setEditSaving] = useState(false);
  const { t, lang } = useLang();

  const user = decodeToken();
  const isAdmin = user?.role === 'ADMIN';
  const userId = user?.id;
  const toast = useToast();

  // Categories translated
  const CATEGORIES = lang === 'fr'
    ? ['Nourriture', 'Transport', 'Fournitures', 'Services', 'Autre']
    : ['Food', 'Transport', 'Supplies', 'Utilities', 'Other'];

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
      setForm({ description: '', amount: '', category: CATEGORIES[0] });
      toast.success(lang === 'fr' ? 'Dépense enregistrée' : 'Expense logged successfully');
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? t('error');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (e: any) => {
    setEditingId(e.id ?? e._id);
    setEditForm({ description: e.description, amount: String(e.amount), category: e.category });
  };

  const cancelEdit = () => setEditingId(null);

  const handleEditSave = async (id: string) => {
    setEditSaving(true);
    try {
      await api.patch(`/expenses/${id}`, { ...editForm, amount: Number(editForm.amount) });
      setEditingId(null);
      toast.success(lang === 'fr' ? 'Dépense mise à jour' : 'Expense updated');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? t('error'));
    } finally {
      setEditSaving(false);
    }
  };

  const canEdit = (e: any) => {
    if (isAdmin) return true;
    const loggedById = e.loggedBy?.id ?? e.loggedBy?._id ?? e.loggedBy;
    return loggedById === userId;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('exp_title')}</h2>
          <div className="page-header-sub">
            {lang === 'fr' ? 'Saisir les dépenses du jour' : "Log today's shop expenses"}
          </div>
        </div>
      </div>

      <div className="page-grid-2">
        {/* Log form */}
        <div className="card">
          <div className="card-title">{t('exp_log')}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="field">
              <label>{t('category')}</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('description')}</label>
              <input className="input"
                placeholder={lang === 'fr' ? 'ex. Déjeuner personnel, papier imprimante...' : 'e.g. Staff lunch, printer paper...'}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="field">
              <label>{t('amount')} (Fr)</label>
              <input className="input" type="number" min={0} step="0.01" placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: '0.82rem' }}>{error}</div>}
            <button className="btn" type="submit" disabled={saving}>
              {saving ? t('saving') : t('exp_log')}
            </button>
          </form>
        </div>

        {/* Today's list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="card-title" style={{ margin: 0 }}>{t('exp_today')}</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Fr {total.toLocaleString()}</div>
          </div>
          {expenses.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{t('exp_no_expenses')}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('category')}</th>
                  <th>{t('description')}</th>
                  <th>{t('amount')}</th>
                  <th>{lang === 'fr' ? 'Par' : 'By'}</th>
                  <th>{lang === 'fr' ? 'Heure' : 'Time'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  editingId === (e.id ?? e._id) ? (
                    <tr key={e.id ?? e._id}>
                      <td>
                        <select className="select" value={editForm.category}
                          onChange={(ev) => setEditForm({ ...editForm, category: ev.target.value })}>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td>
                        <input className="input" value={editForm.description}
                          onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })} />
                      </td>
                      <td>
                        <input className="input" type="number" min={0} value={editForm.amount}
                          onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })} style={{ width: 80 }} />
                      </td>
                      <td>{e.loggedBy?.name ?? '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn" style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={() => handleEditSave(e.id ?? e._id)} disabled={editSaving}>
                            <RiCheckLine />
                          </button>
                          <button className="btn secondary" style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={cancelEdit}>
                            <RiCloseLine />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={e.id ?? e._id}>
                      <td><span className="pill muted">{e.category}</span></td>
                      <td>{e.description}</td>
                      <td>Fr {e.amount.toLocaleString()}</td>
                      <td>{e.loggedBy?.name ?? '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        {canEdit(e) && (
                          <button className="btn secondary" style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            onClick={() => startEdit(e)} title={t('btn_edit')}>
                            <RiEditLine />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
