import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiPrinterLine, RiArrowLeftLine, RiDownloadLine } from 'react-icons/ri';
import api from '../api/client';
import { numberToFrenchWords } from '../utils/numberToWords';

export const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/invoices/${id}`)
        .then((res) => {
          setInvoice(res.data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          navigate('/invoices');
        });
    }
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner dark" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const date = new Date(invoice.dateCreated);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const amountInWords = numberToFrenchWords(Math.round(invoice.totalAmount));

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print-controls no-print">
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn secondary" onClick={() => navigate('/invoices')}>
              <RiArrowLeftLine size={16} />
              Back to Invoices
            </button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn" onClick={handlePrint}>
                <RiPrinterLine size={16} />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="invoice-document">
        <div className="invoice-page">
          {/* Top Red Bar */}
          <div className="invoice-top-bar"></div>

          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-logo">
              <img src="/dacosta-logo.jpeg" alt="DaCosta Autos" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'block';
              }} />
              <div style={{ display: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#111', fontFamily: 'Arial Black, Arial, sans-serif' }}>DACOSTA</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#cc0000', letterSpacing: '3px', fontFamily: 'Arial Black, Arial, sans-serif' }}>AUTOS</div>
              </div>
            </div>
            <div className="invoice-header-divider"></div>
            <div className="invoice-company">
              <div className="invoice-company-name">ETS DACOSTA</div>
              <div className="invoice-company-brands">IVECO | MAN DIESEL | RENAULT | MERCEDES | TOYOTA</div>
            </div>
          </div>

          {/* Body */}
          <div className="invoice-body">
            <div className="invoice-date">Yaoundé, le {formattedDate}</div>

            <div className="invoice-title">FACTURE PROFORMA N° {invoice.invoiceNumber}</div>

            <div className="invoice-client">
              <strong>Doit :</strong> {invoice.customerName}
              {invoice.customerPhone && <> | {invoice.customerPhone}</>}
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '52%' }}>Désignation</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Quantités</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Prix Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td>{item.productName}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(item.unitPrice).toLocaleString('fr-FR')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(item.totalPrice).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="invoice-total-row">
                  <td colSpan={3}>Total</td>
                  <td style={{ textAlign: 'right' }}>{Math.round(invoice.totalAmount).toLocaleString('fr-FR')}</td>
                </tr>
              </tfoot>
            </table>

            <div className="invoice-amount-words">
              Arrêter la présente facture à la somme de <strong>{amountInWords}</strong>.
            </div>

            {/* Status Badges */}
            {invoice.status === 'PARTIAL' && (
              <div className="invoice-status-badge partial">
                ⚠ Paiement partiel — Payé: {Math.round(invoice.amountPaid || 0).toLocaleString('fr-FR')} Fr / Total initial: {Math.round(invoice.originalAmount || invoice.totalAmount).toLocaleString('fr-FR')} Fr
              </div>
            )}
            {invoice.status === 'UNPAID' && (
              <div className="invoice-status-badge unpaid">
                ✗ IMPAYÉ — Solde dû: {Math.round(invoice.totalAmount).toLocaleString('fr-FR')} Fr
              </div>
            )}
            {invoice.status === 'PAID' && (
              <div className="invoice-status-badge paid">
                ✓ PAYÉ INTÉGRALEMENT
              </div>
            )}

            {/* Signature */}
            <div className="invoice-signature">
              <div className="invoice-sig-box">
                <div className="invoice-sig-title">LA DIRECTION</div>
                <div className="invoice-sig-stamp">
                  ETS DACOSTA<br />AUTOS<br />YAOUNDÉ<br />CAMEROUN
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="invoice-footer-col">
              <div className="invoice-footer-item">
                <svg className="invoice-footer-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                </svg>
                <span>Tel: +237 673 99 79 50 / 658 98 84 87<br />656 22 39 98</span>
              </div>
              <div className="invoice-footer-item">
                <svg className="invoice-footer-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>geralddacosta2015@gmail.com</span>
              </div>
            </div>

            <div className="invoice-footer-sep"></div>

            <div className="invoice-footer-col">
              <div className="invoice-footer-item">
                <svg className="invoice-footer-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  Douala en face total Dobo BONABERI boutique N°836 Camp D<br />
                  Yaoundé Mimboman liberté en face de beauty Magic
                </span>
              </div>
            </div>

            <div className="invoice-footer-sep"></div>

            <div className="invoice-footer-col" style={{ fontSize: '10px', lineHeight: 2 }}>
              <div><span style={{ color: '#ff5555', fontWeight: 700 }}>RCCM:</span> RC/DLA/2021/A/4514</div>
              <div><span style={{ color: '#ff5555', fontWeight: 700 }}>NIU:</span> P118717230679R</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .invoice-document {
            margin: 0;
            box-shadow: none;
          }
        }

        .print-controls {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .invoice-document {
          max-width: 900px;
          margin: 2rem auto;
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.1);
        }

        .invoice-page {
          width: 100%;
          background: white;
          display: flex;
          flex-direction: column;
        }

        .invoice-top-bar {
          height: 5px;
          background: #cc0000;
        }

        .invoice-header {
          display: flex;
          align-items: center;
          padding: 10px 22px;
          border-bottom: 3px solid #cc0000;
          gap: 0;
        }

        .invoice-logo img {
          width: 120px;
          height: auto;
          object-fit: contain;
        }

        .invoice-header-divider {
          width: 2px;
          height: 65px;
          background: #ddd;
          margin: 0 18px;
        }

        .invoice-company {
          flex: 1;
          text-align: center;
        }

        .invoice-company-name {
          font-size: 34px;
          font-weight: 900;
          color: #cc0000;
          letter-spacing: 3px;
          font-family: 'Arial Black', Arial, sans-serif;
          line-height: 1;
        }

        .invoice-company-brands {
          font-size: 11.5px;
          color: #333;
          font-weight: 600;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }

        .invoice-body {
          flex: 1;
          padding: 12px 22px 8px 22px;
          display: flex;
          flex-direction: column;
        }

        .invoice-date {
          text-align: right;
          font-size: 12px;
          color: #444;
          margin-bottom: 8px;
        }

        .invoice-title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          text-decoration: underline;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }

        .invoice-client {
          font-size: 12.5px;
          margin-bottom: 10px;
          padding: 5px 10px;
          background: #f9f9f9;
          border-left: 3px solid #cc0000;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
        }

        .invoice-table thead tr {
          background: #1a1a1a;
          color: #fff;
        }

        .invoice-table thead th {
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
        }

        .invoice-table tbody td {
          padding: 7px 10px;
          border: 1px solid #ddd;
          font-size: 12px;
        }

        .invoice-total-row td {
          padding: 7px 10px;
          border: 1px solid #ddd;
          font-weight: 700;
          font-size: 12.5px;
          background: #f0f0f0;
        }

        .invoice-total-row td:last-child {
          color: #cc0000;
        }

        .invoice-amount-words {
          font-size: 11.5px;
          font-style: italic;
          margin: 8px 0;
          padding: 5px 10px;
          border: 1px dashed #ccc;
          background: #fafafa;
        }

        .invoice-amount-words strong {
          font-style: normal;
          font-weight: 700;
        }

        .invoice-status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 3px;
          margin-bottom: 6px;
        }

        .invoice-status-badge.partial {
          background: #fef3c7;
          color: #92400e;
        }

        .invoice-status-badge.unpaid {
          background: #fee2e2;
          color: #991b1b;
        }

        .invoice-status-badge.paid {
          background: #dcfce7;
          color: #166534;
        }

        .invoice-signature {
          display: flex;
          justify-content: flex-end;
          padding-right: 24px;
          margin-top: 6px;
          flex: 1;
          align-items: flex-end;
          padding-bottom: 10px;
        }

        .invoice-sig-box {
          text-align: center;
          width: 150px;
        }

        .invoice-sig-title {
          font-size: 12px;
          font-weight: 700;
          text-decoration: underline;
          margin-bottom: 38px;
        }

        .invoice-sig-stamp {
          width: 88px;
          height: 88px;
          border: 2.5px solid #1a3a8f;
          border-radius: 50%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a3a8f;
          font-size: 8.5px;
          font-weight: 700;
          text-align: center;
          padding: 8px;
          line-height: 1.5;
        }

        .invoice-footer {
          background: #1a1a1a;
          color: #fff;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          border-top: 4px solid #cc0000;
        }

        .invoice-footer-col {
          font-size: 10.5px;
          line-height: 1.75;
        }

        .invoice-footer-item {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-bottom: 3px;
        }

        .invoice-footer-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .invoice-footer-sep {
          width: 1px;
          background: rgba(255,255,255,0.12);
          align-self: stretch;
        }

        @media (max-width: 768px) {
          .invoice-document {
            margin: 0;
            box-shadow: none;
          }

          .print-controls .container {
            padding: 0.75rem;
          }

          .invoice-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .invoice-header-divider {
            display: none;
          }

          .invoice-footer {
            flex-direction: column;
          }

          .invoice-footer-sep {
            display: none;
          }
        }
      `}</style>
    </>
  );
};
