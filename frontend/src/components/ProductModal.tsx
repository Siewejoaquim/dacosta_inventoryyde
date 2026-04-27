import React, { useEffect, useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import api from '../api/client';
import { useToast } from './Toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess, productId }) => {
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
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const isEditing = !!productId;

  useEffect(() => {
    if (isOpen) {
      api.get('/products/categories').then((res) => setCategories(res.data));
      
      if (productId) {
        api.get(`/products/${productId}`).then((res) => {
          setFormData({
            productName: res.data.productName || '',
            category: res.data.category || '',
            supplier: res.data.supplier || '',
            quantityInStock: res.data.quantityInStock || 0,
            purchasePrice: res.data.purchasePrice || 0,
            sellingPrice: res.data.sellingPrice || 0,
            reorderPoint: res.data.reorderPoint || 5,
            description: res.data.description || '',
          });
        });
      } else {
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
      }
    }
  }, [isOpen, productId]);

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
      if (isEditing) {
        await api.patch(`/products/${productId}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="modal-close" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-form-section">
              <div className="modal-form-grid">
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
              </div>
            </div>

            <div className="modal-form-section">
              <div className="modal-form-grid">
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
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" onClick={handleSubmit} disabled={loading}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};