import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
      toast.success(`User "${form.name}" created successfully`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, current: string, name: string) => {
    try {
      await api.patch(`/users/${id}`, { status: current === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
      toast.success(`${name} has been ${current === 'ACTIVE' ? 'disabled' : 'enabled'}`);
      load();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>User management</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Staff accounts</div>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
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
                      onClick={() => toggleStatus(u._id, u.status, u.name)}
                    >
                      {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Create new user</div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Username</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="field">
              <label>Role</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create user'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
