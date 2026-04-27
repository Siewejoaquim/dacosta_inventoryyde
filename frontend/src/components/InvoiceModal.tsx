import React, { useEffect, useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import api from '../api/client';
import { useToast } from './Toast';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  isPartial: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('UNPAID');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      api.get('/products').then((res) => {
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
      });
    }
  }, [isOpen]);

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
    setPaymentStatus('UNPAID');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const { actualTotal, hasPartialItems } = calculateTotals();

    setLoading(true);
    try {
      let finalStatus = paymentStatus;
      if (hasPartialItems) {
        finalStatus = 'PARTIAL';
      }

      const payload = {
        customerName,
        customerPhone,
        status: finalStatus,
        amountPaid: finalStatus === 'PAID' ? actualTotal : (finalStatus === 'PARTIAL' ? actualTotal : 0),
        items: items.map((it) => ({
          productId: it.productId,
          productName: products.find((p) => p._id === it.productId)?.productName ?? '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };

      const response = await api.post('/invoices', payload);
      toast.success('Invoice created successfully');
      
      createPrintWindow(response.data);
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const createPrintWindow = (invoiceData: any) => {
    const { originalTotal, actualTotal, hasPartialItems } = calculateTotals();
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${invoiceData.invoiceNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
              .header h1 { font-size: 28px; font-weight: bold; margin: 0 0 5px 0; }
              .header p { font-size: 12px; color: #666; margin: 0; }
              .details { margin-bottom: 20px; font-size: 13px; line-height: 1.8; }
              .details p { margin: 5px 0; }
              .details strong { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
              table th { text-align: left; padding: 10px; font-weight: bold; border-bottom: 2px solid #000; }
              table td { padding: 10px; border-bottom: 1px solid #ddd; }
              table td.center { text-align: center; }
              table td.right { text-align: right; }
              .partial-item { background-color: #fef9c3; }
              .total-section { text-align: right; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin-bottom: 20px; }
              .total-label { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
              .total-amount { font-size: 20px; font-weight: bold; }
              .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
              .footer p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>DACOSTA ALL MOTORS</h1>
                <p>INVOICE</p>
              </div>
              
              <div class="details">
                <p><strong>Customer Name:</strong> ${customerName}</p>
                <p><strong>Customer Phone:</strong> ${customerPhone || 'N/A'}</p>
                <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th class="center" style="width: 60px;">Qty</th>
                    <th class="right" style="width: 100px;">Unit Price</th>
                    <th class="right" style="width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const product = products.find((p) => p._id === item.productId);
                    const itemTotal = item.quantity * item.unitPrice;
                    const rowClass = item.isPartial ? 'partial-item' : '';
                    return `
                      <tr class="${rowClass}">
                        <td>
                          ${product?.productName || 'N/A'}
                          ${item.isPartial ? '<br><small style="color:#854d0e;">(Discounted)</small>' : ''}
                        </td>
                        <td class="center">${item.quantity}</td>
                        <td class="right">Fr ${item.unitPrice.toLocaleString()}</td>
                        <td class="right"><strong>Fr ${itemTotal.toLocaleString()}</strong></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              
              <div class="total-section">
                <div class="total-label">TOTAL AMOUNT:</div>
                <div class="total-amount">Fr ${actualTotal.toLocaleString()}</div>
                ${hasPartialItems ? `
                <div style="margin-top:10px; font-size:13px; color:#555;">
                  <div style="text-decoration:line-through; color:#999;">Original Price: Fr ${originalTotal.toLocaleString()}</div>
                  <div style="color:#15803d; font-weight:bold; margin-top:4px;">Final Price: Fr ${actualTotal.toLocaleString()}</div>
                </div>` : ''}
                ${paymentStatus === 'PAID' ? `
                <div style="margin-top:8px; font-size:13px; color:#15803d; font-weight:bold;">PAID IN FULL</div>` : ''}
                ${paymentStatus === 'UNPAID' ? `
                <div style="margin-top:8px; font-size:13px; color:#b91c1c; font-weight:bold;">UNPAID — Balance Due: Fr ${actualTotal.toLocaleString()}</div>` : ''}
                ${hasPartialItems ? `
                <div style="margin-top:8px; font-size:13px; color:#854d0e; font-weight:bold;">PARTIAL PAYMENT APPLIED</div>` : ''}
              </div>
              
              <div class="footer">
                <p>Thank you for your business!</p>
                <p>Please retain this invoice for your records</p>
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (!isOpen) return null;

  const { originalTotal, actualTotal, hasPartialItems } = calculateTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Invoice</h3>
          <button className="modal-close" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-form-section">
              <div className="modal-form-grid">
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

            <div className="modal-form-section">
              <label>Items</label>
              <div className="modal-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Product</th>
                      <th style={{ width: '12%' }}>Qty</th>
                      <th style={{ width: '18%' }}>Unit Price</th>
                      <th style={{ width: '18%' }}>Total</th>
                      <th style={{ width: '12%' }}>Status</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const product = products.find((p) => p._id === item.productId);
                      return (
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
                                Original: Fr {item.originalPrice.toLocaleString()}
                              </small>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Fr {(item.quantity * item.unitPrice).toLocaleString()}
                          </td>
                          <td>
                            {item.isPartial ? (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                color: '#854d0e', 
                                fontWeight: 600,
                                background: '#fef3c7',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                PARTIAL
                              </span>
                            ) : (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                color: '#166534',
                                fontWeight: 600,
                                background: '#dcfce7',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                FULL
                              </span>
                            )}
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
                                  fontSize: '0.75rem',
                                  padding: '2px'
                                }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn secondary" onClick={addRow} style={{ fontSize: '0.85rem' }}>
                + Add Item
              </button>
            </div>

            <div className="modal-summary">
              {hasPartialItems && (
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <span style={{ textDecoration: 'line-through' }}>Original Total: Fr {originalTotal.toLocaleString()}</span>
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
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Save & Print Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};