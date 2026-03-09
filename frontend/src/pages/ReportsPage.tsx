import React, { useEffect, useState } from 'react';
import api from '../api/client';

export const ReportsPage: React.FC = () => {
  const [weekly, setWeekly] = useState<any | null>(null);
  const [monthly, setMonthly] = useState<any | null>(null);

  const load = async () => {
    const [w, m] = await Promise.all([
      api.get('/reports/weekly'),
      api.get('/reports/monthly'),
    ]);
    setWeekly(w.data);
    setMonthly(m.data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!weekly || !monthly) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>Reports</h2>
      </div>
      <div className="card-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Weekly sales</div>
          <div className="card-value">Fr {weekly.totalSales.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {weekly.numberOfInvoices} invoices this week
          </div>
        </div>
        <div className="card">
          <div className="card-title">Monthly revenue</div>
          <div className="card-value">
            Fr {monthly.totalMonthlyRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {monthly.totalProductsSold} products sold
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        <div className="card">
          <div className="card-title">Weekly top products</div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {weekly.topSellingProducts.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Monthly best sellers</div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {monthly.bestSellingProducts.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '1.2rem' }} className="card">
        <div className="card-title">Inventory status</div>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>In stock</th>
            </tr>
          </thead>
          <tbody>
            {monthly.inventoryStatus.map((p: any) => (
              <tr key={p._id}>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>{p.quantityInStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

