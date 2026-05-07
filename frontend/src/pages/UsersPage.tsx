import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useLang } from '../i18n/LanguageContext';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { t } = useLang();

  const load = async () => {
    const res = await api.get('/users');
    setUsers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      setForm({ name: '', username: '', password: '', role: 'STAFF' });
      toast.success(`"${form.name}" ${t('success').toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, current: string, name: string) => {
    try {
      await api.patch(`/users/${id}`, { status: current === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
      toast.success(`${name} ${current === 'ACTIVE' ? t('usr_disable').toLowerCase() : t('usr_enable').toLowerCase()}`);
      load();
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>{t('usr_title')}</h2>
      </div>
      <div className="page-grid-2">
        <div className="card">
          <div className="card-title">{t('usr_accounts')}</div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('usr_username')}</th>
                <th>{t('usr_role')}</th>
                <th>{t('status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id ?? u._id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td><span className="pill muted">{u.role}</span></td>
                  <td>
                    <span className={u.status === 'ACTIVE' ? 'pill success' : 'pill muted'}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                      onClick={() => toggleStatus(u.id ?? u._id, u.status, u.name)}
                    >
                      {u.status === 'ACTIVE' ? t('usr_disable') : t('usr_enable')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">{t('usr_create')}</div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>{t('name')}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>{t('usr_username')}</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="field">
              <label>{t('usr_password')}</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="field">
              <label>{t('usr_role')}</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? t('usr_creating') : t('usr_create')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
