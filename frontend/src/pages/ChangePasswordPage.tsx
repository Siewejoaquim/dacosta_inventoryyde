import React, { useState } from 'react';
import api from '../api/client';
import { useLang } from '../i18n/LanguageContext';

export const ChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const { t, lang } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword !== form.confirm) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas' : 'New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError(lang === 'fr' ? 'Minimum 6 caractères' : 'New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(lang === 'fr' ? 'Mot de passe mis à jour avec succès' : 'Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>{t('pwd_title')}</h2>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="field">
            <label>{t('pwd_current')}</label>
            <input className="input" type="password" value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t('pwd_new')}</label>
            <input className="input" type="password" value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t('pwd_confirm')}</label>
            <input className="input" type="password" value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          {error && <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div style={{ color: '#166534', fontSize: '0.85rem' }}>{success}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? t('saving') : t('pwd_btn')}
          </button>
        </form>
      </div>
    </div>
  );
};
