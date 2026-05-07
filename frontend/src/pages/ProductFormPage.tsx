import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useLang } from '../i18n/LanguageContext';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t, lang } = useLang();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    productName: '', category: '', supplier: '',
    quantityInStock: 0, purchasePrice: 0, sellingPrice: 0,
    reorderPoint: 5, description: '',
  });

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      api.get(`/products/${id}`)
        .then((res) => setForm({
          productName: res.data.productName ?? '',
          category: res.data.category ?? '',
          supplier: res.data.supplier ?? '',
          quantityInStock: res.data.quantityInStock ?? 0,
          purchasePrice: res.data.purchasePrice ?? 0,
          sellingPrice: res.data.sellingPrice ?? 0,
          reorderPoint: res.data.reorderPoint ?? 5,
          description: res.data.description ?? '',
        }))
        .catch(() => { toast.error(t('error')); navigate('/products'); });
    }
  }, [id]);

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = t('prod_name') + ' *';
    if (!form.category.trim()) e.category = t('category') + ' *';
    if (form.sellingPrice <= 0) e.sellingPrice = t('prod_selling_price') + ' > 0';
    if (form.quantityInStock < 0) e.quantityInStock = t('quantity') + ' >= 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        productName: form.productName, category: form.category,
        supplier: form.supplier || undefined, quantityInStock: form.quantityInStock,
        purchasePrice: form.purchasePrice, sellingPrice: form.sellingPrice,
        reorderPoint: form.reorderPoint, description: form.description || undefined,
      };
      if (isEdit) {
        await api.patch(`/products/${id}`, payload);
        toast.success(t('prod_name') + ' ' + t('success').toLowerCase());
      } else {
        await api.post('/products', payload);
        toast.success(t('prod_name') + ' ' + t('success').toLowerCase());
      }
      navigate('/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <button className="btn secondary" onClick={() => navigate('/products')} style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }}>
            <RiArrowLeftLine size={14} /> {t('btn_back')}
          </button>
          <h2 style={{ margin: 0 }}>{isEdit ? t('prod_edit') : t('prod_add_new')}</h2>
          <div className="page-header-sub">
            {isEdit ? lang === 'fr' ? 'Modifier les détails du produit.' : 'Update the product details below.'
                    : lang === 'fr' ? 'Remplissez les informations pour ajouter un produit.' : 'Fill in the details to add a new product.'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{t('prod_info')}</div>
          <div className="form-grid">
            <div className="field">
              <label>{t('prod_name')} <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className={`input ${errors.productName ? 'error' : ''}`} value={form.productName}
                onChange={(e) => { set('productName', e.target.value); setErrors((p) => ({ ...p, productName: '' })); }}
                placeholder="e.g., Yaris Shock Absorber" maxLength={100} />
              {errors.productName && <div className="input-error">{errors.productName}</div>}
            </div>
            <div className="field">
              <label>{t('category')} <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className={`input ${errors.category ? 'error' : ''}`} list="cat-list" value={form.category}
                onChange={(e) => { set('category', e.target.value); setErrors((p) => ({ ...p, category: '' })); }}
                placeholder="e.g., Suspension" maxLength={50} />
              <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              {errors.category && <div className="input-error">{errors.category}</div>}
            </div>
            <div className="field">
              <label>{t('prod_supplier')}</label>
              <input className="input" value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
                placeholder="e.g., Toyota Parts Ltd" maxLength={100} />
            </div>
            <div className="field">
              <label>{t('quantity')} <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="number" className={`input ${errors.quantityInStock ? 'error' : ''}`}
                value={form.quantityInStock}
                onChange={(e) => { set('quantityInStock', Number(e.target.value)); setErrors((p) => ({ ...p, quantityInStock: '' })); }}
                min={0} />
              {errors.quantityInStock && <div className="input-error">{errors.quantityInStock}</div>}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{t('prod_pricing')}</div>
          <div className="form-grid">
            <div className="field">
              <label>{t('prod_purchase_price')} (Fr)</label>
              <input type="number" className="input" value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', Number(e.target.value))} min={0} step="1" placeholder="0" />
              <div className="input-hint">{t('prod_cost_hint')}</div>
            </div>
            <div className="field">
              <label>{t('prod_selling_price')} (Fr) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="number" className={`input ${errors.sellingPrice ? 'error' : ''}`}
                value={form.sellingPrice}
                onChange={(e) => { set('sellingPrice', Number(e.target.value)); setErrors((p) => ({ ...p, sellingPrice: '' })); }}
                min={1} step="1" />
              {errors.sellingPrice && <div className="input-error">{errors.sellingPrice}</div>}
            </div>
            <div className="field">
              <label>{t('prod_reorder')}</label>
              <input type="number" className="input" value={form.reorderPoint}
                onChange={(e) => set('reorderPoint', Number(e.target.value))} min={0} />
              <div className="input-hint">{t('prod_reorder_hint')}</div>
            </div>
            {form.purchasePrice > 0 && form.sellingPrice > 0 && (
              <div className="field">
                <label>{t('prod_profit_margin')}</label>
                <div style={{ padding: '0.65rem 0.95rem', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: '#166534' }}>
                  Fr {(form.sellingPrice - form.purchasePrice).toLocaleString()} &nbsp;
                  ({(((form.sellingPrice - form.purchasePrice) / form.purchasePrice) * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{t('prod_additional')}</div>
          <div className="field">
            <label>{t('description')}</label>
            <textarea className="input" value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3} maxLength={500}
              placeholder={lang === 'fr' ? 'Notes optionnelles sur ce produit...' : 'Optional notes about this product...'}
              style={{ resize: 'vertical', minHeight: 80 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={() => navigate('/products')} disabled={loading}>
            {t('btn_cancel')}
          </button>
          <button type="submit" className="btn" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? t('saving') : (isEdit ? t('btn_save') : t('btn_create'))}
          </button>
        </div>
      </form>
    </div>
  );
};
