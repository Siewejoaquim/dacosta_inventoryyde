import React, { useState } from 'react';
import api from '../api/client';

export const ChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>Change Password</h2>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="field">
            <label>Current Password</label>
            <input
              className="input"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>New Password</label>
            <input
              className="input"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          {error && <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div style={{ color: '#166534', fontSize: '0.85rem' }}>{success}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
