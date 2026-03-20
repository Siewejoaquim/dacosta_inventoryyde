import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';

export const ProductsPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);

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
    const userInfo = decodeToken();
    setUser(userInfo);
    api.get('/products/categories').then((r) => setCategories(r.data));
    load();
  }, []);

  useEffect(() => { load(); }, [showArchived]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this product? It will be hidden but not deleted.')) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch {
      alert('Failed to archive product');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/products/${id}/restore`);
      load();
    } catch {
      alert('Failed to restore product');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Products</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Manage inventory for DaCosta All Motors.</div>
        </div>
        <Link to="/products/new" className="btn">+ Add product</Link>
      </div>

      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input className="input" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn secondary" type="submit">Apply</button>
        {isAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
        )}
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>In Stock</th>
              <th>Reorder</th>
              <th>Purchase</th>
              <th>Selling</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const reorder = p.reorderPoint ?? 5;
              const low = p.quantityInStock < reorder;
              return (
                <tr key={p._id} style={{ opacity: p.isArchived ? 0.5 : 1 }}>
                  <td>
                    {p.productName}
                    {p.isArchived && <span className="pill muted" style={{ marginLeft: 6 }}>archived</span>}
                  </td>
                  <td>{p.category}</td>
                  <td>{p.supplier}</td>
                  <td className={low ? 'low-stock' : ''}>{p.quantityInStock}</td>
                  <td>{reorder}</td>
                  <td>Fr {p.purchasePrice.toLocaleString()}</td>
                  <td>Fr {p.sellingPrice.toLocaleString()}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {!p.isArchived && (
                      <Link to={`/products/${p._id}`} style={{ fontSize: '0.82rem' }}>Edit</Link>
                    )}
                    {isAdmin && !p.isArchived && (
                      <button onClick={() => handleArchive(p._id)}
                        style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                        Archive
                      </button>
                    )}
                    {isAdmin && p.isArchived && (
                      <button onClick={() => handleRestore(p._id)}
                        style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0 }}>
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>No products found</div>
        )}
      </div>
    </div>
  );
};
