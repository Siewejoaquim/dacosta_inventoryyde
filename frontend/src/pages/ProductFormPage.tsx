import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    category: '',
    supplier: '',
    quantityInStock: 0,
    purchasePrice: 0,
    sellingPrice: 0,
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        setForm(res.data);
      }).catch(() => {
        // If individual endpoint doesn't exist, try fetching all and filtering
        api.get('/products').then((res) => {
          const existing = res.data.find((p: any) => p._id === id);
          if (existing) {
            setForm(existing);
          }
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === 'quantityInStock' || name.endsWith('Price') ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Only send allowed fields to avoid validation errors
      const dataToSend = {
        productName: form.productName,
        category: form.category,
        supplier: form.supplier,
        quantityInStock: form.quantityInStock,
        purchasePrice: form.purchasePrice,
        sellingPrice: form.sellingPrice,
      };
      
      if (isEdit) {
        await api.patch(`/products/${id}`, dataToSend);
      } else {
        await api.post('/products', dataToSend);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>{isEdit ? 'Edit product' : 'Add product'}</h2>
      </div>
      <div className="card">
        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', color: '#c00', borderRadius: '0.375rem' }}>
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}
        >
          <div>
            <label>Product Name</label>
            <input
              className="input"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Category</label>
            <input
              className="input"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Supplier</label>
            <input
              className="input"
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Quantity in stock</label>
            <input
              type="number"
              className="input"
              name="quantityInStock"
              value={form.quantityInStock}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Purchase price</label>
            <input
              type="number"
              className="input"
              name="purchasePrice"
              value={form.purchasePrice}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Selling price</label>
            <input
              type="number"
              className="input"
              name="sellingPrice"
              value={form.sellingPrice}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Save changes' : 'Create product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

