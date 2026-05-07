import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiUserLine, RiLockLine, RiArrowRightLine, RiErrorWarningLine } from 'react-icons/ri';
import api from '../api/client';
import { useLang } from '../i18n/LanguageContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { lang, setLang, t } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('dacosta_token', res.data.accessToken);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        {/* Logo */}
        <div className="login-card-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 5v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>

        {/* Language toggle on login page */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setLang('fr')}
            style={{
              flex: 1,
              padding: '0.3rem',
              background: lang === 'fr' ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
              color: lang === 'fr' ? 'white' : '#64748b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🇫🇷 Français
          </button>
          <button
            onClick={() => setLang('en')}
            style={{
              flex: 1,
              padding: '0.3rem',
              background: lang === 'en' ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
              color: lang === 'en' ? 'white' : '#64748b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🇬🇧 English
          </button>
        </div>

        <h1>{t('login_welcome')}</h1>
        <p>{t('login_subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('login_username')}</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', display: 'flex' }}>
                <RiUserLine size={16} />
              </span>
              <input
                className="input dark"
                style={{ paddingLeft: '2.25rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t('login_placeholder_u')}
              />
            </div>
          </div>

          <div className="field">
            <label>{t('login_password')}</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', display: 'flex' }}>
                <RiLockLine size={16} />
              </span>
              <input
                type="password"
                className="input dark"
                style={{ paddingLeft: '2.25rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={t('login_placeholder_p')}
              />
            </div>
          </div>

          {error && (
            <div className="error-text">
              <RiErrorWarningLine size={14} />
              {error}
            </div>
          )}

          <button
            className="btn accent"
            style={{ width: '100%', marginTop: '1rem', padding: '0.7rem', fontSize: '0.9rem', borderRadius: '0.6rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? t('login_loading') : (
              <>{t('login_btn')} <RiArrowRightLine size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
