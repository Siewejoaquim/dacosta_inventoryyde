import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { useLang } from '../i18n/LanguageContext';
import { RiAddLine } from 'react-icons/ri';

export const ProductsPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const load = async () => {
    const res = await api.get('/products', {
      params: {
        search: search || undefined,
        category: category || undefined,
        includeArchived: showArchived ? 'true' : undefined,
      },
    });
    setProducts(res.data);
  };

  useEffect(() => {
    setUser(decodeToken());
    api.get('/products/categories').then((r) => setCategories(r.data)).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [showArchived]);

  const handleArchive = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('btn_archive') + ' ' + name + '?',
      message: `"${name}" ${lang === 'fr' ? 'sera masqué mais pas supprimé.' : 'will be hidden but not deleted.'}`,
      confirmLabel: t('btn_archive'),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(`"${name}" ${t('btn_archive').toLowerCase()}`);
      load();
    } catch {
      toast.error(t('error'));
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      await api.patch(`/products/${id}/restore`);
      toast.success(`"${name}" ${t('btn_restore').toLowerCase()}`);
      load();
    } catch {
      toast.error(t('error'));
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>{t('prod_title')}</h2>
          <div className="page-header-sub">{t('prod_subtitle')}</div>
        </div>
        {isAdmin && (
          <button className="btn" onClick={() => navigate('/products/new')}>
            <RiAddLine size={16} /> {t('prod_add')}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(); }}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}
      >
        <input
          className="input"
          placeholder={t('prod_search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">{t('prod_all_categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn secondary" type="submit">{t('btn_search')}</button>
        {isAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            {t('prod_show_archived')}
          </label>
        )}
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('prod_name')}</th>
              <th>{t('category')}</th>
              <th>{t('prod_supplier')}</th>
              <th>{t('prod_in_stock')}</th>
              <th>{t('prod_reorder')}</th>
              <th>{t('prod_purchase_price')}</th>
              <th>{t('prod_selling_price')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const reorder = p.reorderPoint ?? 5;
              const low = p.quantityInStock < reorder;
              return (
                <tr key={p.id ?? p._id} style={{ opacity: p.isArchived ? 0.5 : 1 }}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{p.productName}</span>
                    {p.isArchived && <span className="pill muted" style={{ marginLeft: 6 }}>{t('prod_archived')}</span>}
                  </td>
                  <td>{p.category}</td>
                  <td>{p.supplier ?? '—'}</td>
                  <td className={low ? 'low-stock' : ''}>{p.quantityInStock}</td>
                  <td>{reorder}</td>
                  <td>{(p.purchasePrice ?? 0).toLocaleString()}</td>
                  <td>{(p.sellingPrice ?? 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {!p.isArchived && isAdmin && (
                        <button
                          onClick={() => navigate(`/products/${p.id ?? p._id}`)}
                          style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        >
                          {t('btn_edit')}
                        </button>
                      )}
                      {isAdmin && !p.isArchived && (
                        <button
                          onClick={() => handleArchive(p.id ?? p._id, p.productName)}
                          style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                        >
                          {t('btn_archive')}
                        </button>
                      )}
                      {isAdmin && p.isArchived && (
                        <button
                          onClick={() => handleRestore(p.id ?? p._id, p.productName)}
                          style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
                        >
                          {t('btn_restore')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><RiAddLine /></div>
            <div className="empty-state-title">{t('prod_no_products')}</div>
            <div className="empty-state-message">
              {isAdmin ? t('prod_add_first') : t('no_data')}
            </div>
            {isAdmin && (
              <button className="btn" onClick={() => navigate('/products/new')}>
                {t('prod_add')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
