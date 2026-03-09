import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';

export const ProductsPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    const res = await api.get('/products', {
      params: { search: search || undefined, category: category || undefined },
    });
    setProducts(res.data);
  };

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
    load();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Products</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Manage inventory for DaCosta All Motors.
          </div>
        </div>
        <Link to="/products/new" className="btn">
          + Add product
        </Link>
      </div>

      <form
        onSubmit={handleFilter}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}
      >
        <input
          className="input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="input"
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button className="btn secondary" type="submit">
          Apply
        </button>
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>In Stock</th>
              <th>Purchase</th>
              <th>Selling</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>{p.supplier}</td>
                <td className={p.quantityInStock < 5 ? 'low-stock' : ''}>
                  {p.quantityInStock}
                </td>
                <td>Fr {p.purchasePrice}</td>
                <td>Fr {p.sellingPrice}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/products/${p._id}`} style={{ fontSize: '0.82rem' }}>
                    Edit
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      style={{
                        fontSize: '0.82rem',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

