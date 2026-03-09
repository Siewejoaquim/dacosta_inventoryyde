import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeToken, UserInfo } from '../api/auth';
import api from '../api/client';

export const InvoicesPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const userInfo = decodeToken();
    setUser(userInfo);
    
    api.get('/invoices').then((res) => setInvoices(res.data));
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const displayInvoices = isAdmin ? invoices : invoices.filter((inv) => inv.createdBy?._id === user?.id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Invoices</h2>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {isAdmin ? 'All sales invoices for DaCosta All Motors.' : 'Your invoices'}
          </div>
        </div>
        <Link to="/invoices/new" className="btn">
          + New invoice
        </Link>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Total</th>
              {isAdmin && <th>Created By</th>}
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {displayInvoices.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.invoiceNumber}</td>
                <td>{inv.customerName}</td>
                <td>Fr {inv.totalAmount.toLocaleString()}</td>
                {isAdmin && <td>{inv.createdBy?.name}</td>}
                <td>{new Date(inv.dateCreated).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayInvoices.length === 0 && (
          <div style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>
            No invoices found
          </div>
        )}
      </div>
    </div>
  );
};

