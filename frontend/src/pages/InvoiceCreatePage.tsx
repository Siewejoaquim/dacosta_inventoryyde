import React, { useEffect, useState } from 'react';
import api from '../api/client';

export const InvoiceCreatePage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('UNPAID');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [items, setItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/products').then((res) => {
      setProducts(res.data);
      setItems([{ productId: res.data[0]?._id ?? '', quantity: 1, unitPrice: res.data[0]?.sellingPrice ?? 0 }]);
    });
  }, []);

  useEffect(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setTotal(calculatedTotal);
    if (paymentStatus === 'PAID') setAmountPaid(calculatedTotal);
  }, [items]);

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
        }
      } else {
        (next[index] as any)[field] = Number(value);
      }
      return next;
    });
  };

  const addRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?._id ?? '', quantity: 1, unitPrice: products[0]?.sellingPrice ?? 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerName,
      customerPhone,
      status: paymentStatus,
      amountPaid: paymentStatus === 'PAID' ? total : amountPaid,
      items: items.map((it) => ({
        ...it,
        productName: products.find((p) => p._id === it.productId)?.productName ?? '',
      })),
    };
    try {
      const response = await api.post('/invoices', payload);
      
      // Create a new window for printing
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        const invoiceHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${response.data.invoiceNumber}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  line-height: 1.6;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .header h1 {
                  font-size: 28px;
                  font-weight: bold;
                  margin: 0 0 5px 0;
                }
                .header p {
                  font-size: 12px;
                  color: #666;
                  margin: 0;
                }
                .details {
                  margin-bottom: 20px;
                  font-size: 13px;
                  line-height: 1.8;
                }
                .details p {
                  margin: 5px 0;
                }
                .details strong {
                  font-weight: bold;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: 13px;
                }
                table th {
                  text-align: left;
                  padding: 10px;
                  font-weight: bold;
                  border-bottom: 2px solid #000;
                }
                table td {
                  padding: 10px;
                  border-bottom: 1px solid #ddd;
                }
                table td.center {
                  text-align: center;
                }
                table td.right {
                  text-align: right;
                }
                .total-section {
                  text-align: right;
                  border-top: 2px solid #000;
                  border-bottom: 2px solid #000;
                  padding: 15px 0;
                  margin-bottom: 20px;
                }
                .total-label {
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .total-amount {
                  font-size: 20px;
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                  margin-top: 30px;
                }
                .footer p {
                  margin: 5px 0;
                }
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
                  <p><strong>Invoice Number:</strong> ${response.data.invoiceNumber}</p>
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
                      return `
                        <tr>
                          <td>${product?.productName || 'N/A'}</td>
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
                  <div class="total-amount">Fr ${total.toLocaleString()}</div>
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
    } catch (error) {
      alert('Failed to create invoice');
    }
  };

  return (
    <div>
      {/* Screen View */}
      <div style={{ display: 'print-item' }} className="screen-view">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>Create invoice</h2>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label>Customer name</label>
                <input
                  className="input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Customer phone</label>
                <input
                  className="input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label>Payment status</label>
                <select
                  className="select"
                  value={paymentStatus}
                  onChange={(e) => {
                    const val = e.target.value as 'PAID' | 'UNPAID' | 'PARTIAL';
                    setPaymentStatus(val);
                    if (val === 'PAID') setAmountPaid(total);
                    if (val === 'UNPAID') setAmountPaid(0);
                  }}
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid in full</option>
                  <option value="PARTIAL">Partial payment</option>
                </select>
              </div>
              {paymentStatus === 'PARTIAL' && (
                <div>
                  <label>Amount paid (Fr)</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    max={total}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product</th>
                  <th style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '20%' }}>Unit price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="select"
                        value={item.productId}
                        onChange={(e) =>
                          handleItemChange(idx, 'productId', e.target.value)
                        }
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
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitPrice', e.target.value)
                        }
                      />
                    </td>
                    <td>Fr {item.quantity * item.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn secondary"
              onClick={addRow}
              style={{ marginTop: '0.7rem' }}
            >
              + Add line
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total amount</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                Fr {total.toLocaleString()}
              </div>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button className="btn" type="submit">
                Save &amp; Print invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

