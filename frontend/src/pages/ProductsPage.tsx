import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { RiCloseLine, RiAddLine } from 'react-icons/ri';

export const ProductsPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Product form state
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    supplier: '',
    quantityInStock: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    reorderPoint: 5,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

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

  const handleArchive = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Archive product?',
      message: `"${name}" will be hidden from active listings but not deleted.`,
      confirmLabel: 'Archive',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(`"${name}" archived successfully`);
      load();
    } catch {
      toast.error('Failed to archive product');
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      await api.patch(`/products/${id}/restore`);
      toast.success(`"${name}" restored successfully`);
      load();
    } catch {
      toast.error('Failed to restore product');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      category: '',
      supplier: '',
      quantityInStock: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      reorderPoint: 5,
      description: '',
    });
    setShowCreatePanel(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      category: product.category || '',
      supplier: product.supplier || '',
      quantityInStock: product.quantityInStock || 0,
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice || 0,
      reorderPoint: product.reorderPoint || 5,
      description: product.description || '',
    });
    setShowCreatePanel(true);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (formData.sellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct._id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      setShowCreatePanel(false);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="page-header">
          <div>
            <h2 style={{ margin: 0 }}>Products</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Manage inventory for DaCosta All Motors.</div>
          </div>
          <button onClick={handleAddProduct} className="btn">
            <RiAddLine size={16} style={{ marginRight: '0.5rem' }} />
            Add product
          </button>
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

        <div className="card" style={{ flex: 1, overflow: 'auto' }}>
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
                        <button onClick={() => handleEditProduct(p)} 
                          style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0 }}>
                          Edit
                        </button>
                      )}
                      {isAdmin && !p.isArchived && (
                        <button onClick={() => handleArchive(p._id, p.productName)}
                          style={{ fontSize: '0.82rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                          Archive
                        </button>
                      )}
                      {isAdmin && p.isArchived && (
                        <button onClick={() => handleRestore(p._id, p.productName)}
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

      {/* Slide-out Panel */}
      {showCreatePanel && (
        <div style={{
          width: '450px',
          background: 'white',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>
            <button
              onClick={() => setShowCreatePanel(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '4px',
                color: '#6b7280'
              }}
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label>Product name *</label>
                  <input
                    className="input"
                    value={formData.productName}
                    onChange={(e) => handleChange('productName', e.target.value)}
                    required
                    maxLength={100}
                    placeholder="e.g., Yaris Shock Absorber"
                  />
                </div>
                <div>
                  <label>Category *</label>
                  <input
                    className="input"
                    list="categories"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                    maxLength={50}
                    placeholder="e.g., Suspension"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label>Supplier</label>
                  <input
                    className="input"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    maxLength={100}
                    placeholder="e.g., Toyota Parts Ltd"
                  />
                </div>
                <div>
                  <label>Quantity in stock *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.quantityInStock}
                    onChange={(e) => handleChange('quantityInStock', Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label>Purchase price (Fr)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                    min={0}
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label>Selling price (Fr) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.sellingPrice}
                    onChange={(e) => handleChange('sellingPrice', Number(e.target.value))}
                    min={0.01}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label>Reorder point</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.reorderPoint}
                    onChange={(e) => handleChange('reorderPoint', Number(e.target.value))}
                    min={0}
                    placeholder="5"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    Alert when stock falls below this number
                  </small>
                </div>
                <div>
                  <label>Description</label>
                  <textarea
                    className="input"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Optional product description..."
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn secondary" onClick={() => setShowCreatePanel(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
