import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';
import { RiCloseLine, RiAddLine, RiPrinterLine } from 'react-icons/ri';
import { useToast } from '../components/Toast';
import { printInvoice } from '../utils/printInvoice';

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  isPartial: boolean;
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: '#dcfce7', color: '#166534' },
  UNPAID:  { bg: '#fee2e2', color: '#b91c1c' },
  PARTIAL: { bg: '#fef9c3', color: '#854d0e' },
  VOID:    { bg: '#e5e7eb', color: '#374151' },
};

export const InvoicesPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  
  // Invoice creation form state
  const [products, setProducts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
    loadInvoices();
    loadProducts();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
      if (res.data.length > 0) {
        setItems([{ 
          productId: res.data[0]._id, 
          quantity: 1, 
          unitPrice: res.data[0].sellingPrice,
          originalPrice: res.data[0].sellingPrice,
          isPartial: false
        }]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const calculateTotals = () => {
    const originalTotal = items.reduce((sum, item) => sum + item.quantity * item.originalPrice, 0);
    const actualTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const hasPartialItems = items.some(item => item.isPartial);
    
    return { originalTotal, actualTotal, hasPartialItems };
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'quantity' | 'unitPrice',
    value: string,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const selected = products.find((p) => p._id === value);
        next[index].productId = value;
        if (selected) {
          next[index].unitPrice = selected.sellingPrice;
          next[index].originalPrice = selected.sellingPrice;
          next[index].isPartial = false;
        }
      } else if (field === 'unitPrice') {
        const newPrice = Number(value);
        next[index].unitPrice = newPrice;
        next[index].isPartial = newPrice < next[index].originalPrice;
      } else {
        (next[index] as any)[field] = Number(value);
      }
      return next;
    });
  };

  const addRow = () => {
    if (products.length > 0) {
      setItems((prev) => [...prev, { 
        productId: products[0]._id, 
        quantity: 1, 
        unitPrice: products[0].sellingPrice,
        originalPrice: products[0].sellingPrice,
        isPartial: false
      }]);
    }
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    if (products.length > 0) {
      setItems([{ 
        productId: products[0]._id, 
        quantity: 1, 
        unitPrice: products[0].sellingPrice,
        originalPrice: products[0].sellingPrice,
        isPartial: false
      }]);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const { actualTotal, hasPartialItems } = calculateTotals();

    setLoading(true);
    try {
      let finalStatus = 'UNPAID';
      if (hasPartialItems) {
        finalStatus = 'PARTIAL';
      }

      const payload = {
        customerName,
        customerPhone,
        status: finalStatus,
        amountPaid: finalStatus === 'PARTIAL' ? actualTotal : 0,
        items: items.map((it) => ({
          productId: it.productId,
          productName: products.find((p) => p._id === it.productId)?.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };

      const response = await api.post('/invoices', payload);
      toast.success('Invoice created successfully');

      // Print the invoice in DaCosta format
      printInvoice({
        invoiceNumber: response.data.invoiceNumber,
        customerName,
        customerPhone,
        dateCreated: response.data.dateCreated || new Date().toISOString(),
        items: items.map((it) => ({
          productName: products.find((p) => p._id === it.productId)?.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.quantity * it.unitPrice,
        })),
        totalAmount: actualTotal,
        originalAmount: hasPartialItems ? originalTotal : undefined,
        amountPaid: hasPartialItems ? actualTotal : undefined,
        status: finalStatus,
      });
      
      resetForm();
      setShowCreatePanel(false);
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const displayed = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (!isAdmin && inv.createdBy?._id !== user?.id) return false;
    return true;
  });

  const { originalTotal, actualTotal, hasPartialItems } = calculateTotals();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="page-header">
          <div>
            <h2 style={{ margin: 0 }}>Invoices</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {isAdmin ? 'All sales invoices' : 'Your invoices'}
            </div>
          </div>
          <button onClick={() => setShowCreatePanel(true)} className="btn">
            <RiAddLine size={16} style={{ marginRight: '0.5rem' }} />
            New invoice
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['', 'UNPAID', 'PARTIAL', 'PAID', 'VOID'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="btn secondary"
              style={{
                background: statusFilter === s ? '#0f172a' : undefined,
                color: statusFilter === s ? 'white' : undefined,
                fontSize: '0.8rem', padding: '0.35rem 0.9rem',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="card" style={{ flex: 1, overflow: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                {isAdmin && <th>Created By</th>}
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((inv) => {
                const s = statusStyle[inv.status] ?? statusStyle.UNPAID;
                return (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.customerName}</td>
                    <td>Fr {inv.totalAmount.toLocaleString()}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.55rem', borderRadius: 999,
                        fontSize: '0.72rem', fontWeight: 600,
                        background: s.bg, color: s.color,
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    {isAdmin && <td>{inv.createdBy?.name}</td>}
                    <td>{new Date(inv.dateCreated).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/invoices/${inv._id}`} style={{ color: '#2563eb', fontSize: '0.8rem', marginRight: '0.75rem' }}>
                        View
                      </Link>
                      <button
                        onClick={() => printInvoice({
                          invoiceNumber: inv.invoiceNumber,
                          customerName: inv.customerName,
                          customerPhone: inv.customerPhone,
                          dateCreated: inv.dateCreated,
                          items: (inv.itemsPurchased || inv.items || []).map((it: any) => ({
                            productName: it.productName,
                            quantity: it.quantity,
                            unitPrice: it.unitPrice,
                            totalPrice: it.totalPrice,
                          })),
                          totalAmount: inv.totalAmount,
                          originalAmount: inv.originalAmount,
                          amountPaid: inv.amountPaid,
                          status: inv.status,
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                        title="Print invoice"
                      >
                        <RiPrinterLine size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>No invoices found</div>
          )}
        </div>
      </div>

      {/* Slide-out Panel */}
      {showCreatePanel && (
        <div style={{
          width: '500px',
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
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create Invoice</h3>
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
            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label>Customer name *</label>
                    <input
                      className="input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label>Customer phone</label>
                    <input
                      className="input"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label>Items</label>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px', 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  marginBottom: '1rem'
                }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Product</th>
                        <th style={{ width: '15%' }}>Qty</th>
                        <th style={{ width: '25%' }}>Price</th>
                        <th style={{ width: '15%' }}>Total</th>
                        <th style={{ width: '5%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ backgroundColor: item.isPartial ? '#fef9c3' : 'transparent' }}>
                          <td>
                            <select
                              className="select"
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              required
                              style={{ fontSize: '0.85rem' }}
                            >
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.productName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              min={1}
                              required
                              style={{ fontSize: '0.85rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              min={0}
                              required
                              style={{ fontSize: '0.85rem' }}
                            />
                            {item.isPartial && (
                              <small style={{ color: '#854d0e', fontSize: '0.7rem', display: 'block' }}>
                                Was: Fr {item.originalPrice.toLocaleString()}
                              </small>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Fr {(item.quantity * item.unitPrice).toLocaleString()}
                          </td>
                          <td>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#ef4444', 
                                  cursor: 'pointer', 
                                  fontSize: '0.75rem'
                                }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn secondary" onClick={addRow} style={{ fontSize: '0.85rem' }}>
                  + Add Item
                </button>
              </div>

              <div style={{ 
                background: '#f9fafb', 
                padding: '1rem', 
                borderRadius: '6px', 
                marginBottom: '1.5rem' 
              }}>
                {hasPartialItems && (
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <span style={{ textDecoration: 'line-through' }}>Original: Fr {originalTotal.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.25rem' }}>
                  {hasPartialItems ? 'Final Total (with discounts)' : 'Total Amount'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  Fr {actualTotal.toLocaleString()}
                </div>
                {hasPartialItems && (
                  <div style={{ fontSize: '0.8rem', color: '#854d0e', marginTop: '0.5rem', fontWeight: 600 }}>
                    Savings: Fr {(originalTotal - actualTotal).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn secondary" onClick={() => setShowCreatePanel(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
