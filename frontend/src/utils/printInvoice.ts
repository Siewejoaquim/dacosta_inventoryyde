import { numberToFrenchWords } from './numberToWords';

interface PrintItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PrintInvoiceOptions {
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  dateCreated: string;
  items: PrintItem[];
  totalAmount: number;
  originalAmount?: number;
  amountPaid?: number;
  status: string;
}

export function printInvoice(data: PrintInvoiceOptions) {
  const date = new Date(data.dateCreated);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const amountInWords = numberToFrenchWords(data.totalAmount);

  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #ccc; font-size: 13px;">${item.productName}</td>
      <td style="padding: 8px 10px; border: 1px solid #ccc; text-align: center; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 8px 10px; border: 1px solid #ccc; text-align: right; font-size: 13px;">${Math.round(item.unitPrice).toLocaleString('fr-FR')}</td>
      <td style="padding: 8px 10px; border: 1px solid #ccc; text-align: right; font-size: 13px; font-weight: bold;">${Math.round(item.totalPrice).toLocaleString('fr-FR')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Facture ${data.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: white;
          color: #000;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        /* ── HEADER ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 4px solid #cc0000;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-box {
          border: 3px solid #cc0000;
          padding: 6px 10px;
          text-align: center;
        }
        .logo-box .dacosta {
          font-size: 22px;
          font-weight: 900;
          color: #cc0000;
          letter-spacing: 1px;
        }
        .logo-box .autos {
          font-size: 13px;
          font-weight: 700;
          color: #cc0000;
        }
        .car-icon {
          font-size: 28px;
          color: #cc0000;
        }
        .company-info {
          text-align: center;
          flex: 1;
          padding: 0 20px;
        }
        .company-info h1 {
          font-size: 32px;
          font-weight: 900;
          color: #cc0000;
          letter-spacing: 2px;
        }
        .company-info .brands {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-top: 2px;
        }

        /* ── BODY ── */
        .body {
          flex: 1;
          padding: 20px 25px;
        }
        .date-line {
          text-align: right;
          font-size: 13px;
          margin-bottom: 15px;
          color: #333;
        }
        .invoice-title {
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          text-decoration: underline;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }
        .client-line {
          font-size: 13px;
          margin-bottom: 15px;
        }
        .client-line strong {
          font-weight: 700;
        }

        /* ── TABLE ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        thead tr {
          background: #f0f0f0;
        }
        thead th {
          padding: 8px 10px;
          border: 1px solid #ccc;
          font-size: 13px;
          font-weight: 700;
          text-align: left;
        }
        thead th:nth-child(2),
        thead th:nth-child(3),
        thead th:nth-child(4) {
          text-align: center;
        }
        .total-row td {
          padding: 8px 10px;
          border: 1px solid #ccc;
          font-weight: 700;
          font-size: 13px;
        }
        .total-row td:last-child {
          text-align: right;
        }

        /* ── AMOUNT IN WORDS ── */
        .amount-words {
          font-size: 12px;
          margin: 15px 0 30px 0;
          font-style: italic;
        }
        .amount-words strong {
          font-style: normal;
          font-weight: 700;
        }

        /* ── STATUS BADGE ── */
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        /* ── SIGNATURE ── */
        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          margin-bottom: 40px;
          padding-right: 30px;
        }
        .signature-box {
          text-align: center;
          width: 180px;
        }
        .signature-box .title {
          font-size: 13px;
          font-weight: 700;
          text-decoration: underline;
          margin-bottom: 50px;
        }
        .signature-box .stamp-circle {
          width: 100px;
          height: 100px;
          border: 2px solid #1a3a8f;
          border-radius: 50%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a3a8f;
          font-size: 9px;
          font-weight: 700;
          text-align: center;
          padding: 10px;
          line-height: 1.3;
        }

        /* ── FOOTER ── */
        .footer {
          background: #1a1a1a;
          color: white;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-top: auto;
        }
        .footer-col {
          font-size: 11px;
          line-height: 1.8;
        }
        .footer-col .label {
          color: #ff4444;
          font-weight: 700;
        }
        .footer-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 3px;
        }
        .footer-icon {
          color: #ff4444;
          font-size: 13px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        @media print {
          body { margin: 0; }
          .page { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- HEADER -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-box">
              <div class="dacosta">DACOSTA</div>
              <div class="autos">AUTOS</div>
            </div>
          </div>
          <div class="company-info">
            <h1>ETS DACOSTA</h1>
            <div class="brands">IVECO MAN DIESEL, RENAULT, MERCEDES, TOYOTA</div>
          </div>
        </div>

        <!-- BODY -->
        <div class="body">
          <div class="date-line">Yaoundé, le ${formattedDate}</div>

          <div class="invoice-title">FACTURE PROFOMA N° ${data.invoiceNumber}</div>

          <div class="client-line">
            <strong>Doit :</strong> ${data.customerName}${data.customerPhone ? ' — ' + data.customerPhone : ''}
          </div>

          <!-- ITEMS TABLE -->
          <table>
            <thead>
              <tr>
                <th style="width: 55%;">Désignation</th>
                <th style="width: 12%; text-align: center;">Quantités</th>
                <th style="width: 16%; text-align: right;">Prix unitaire</th>
                <th style="width: 17%; text-align: right;">Prix Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="font-weight: 700; padding: 8px 10px; border: 1px solid #ccc;">Total</td>
                <td style="text-align: right; padding: 8px 10px; border: 1px solid #ccc; font-weight: 700;">
                  ${Math.round(data.totalAmount).toLocaleString('fr-FR')}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- AMOUNT IN WORDS -->
          <div class="amount-words">
            Arrêter la présente facture à la somme de <strong>${amountInWords}</strong>.
          </div>

          ${data.status === 'PARTIAL' ? `
          <div style="font-size: 12px; color: #854d0e; margin-bottom: 10px;">
            ⚠️ Paiement partiel — Montant payé: <strong>${Math.round(data.amountPaid || 0).toLocaleString('fr-FR')} Fr</strong> 
            sur <strong>${Math.round(data.originalAmount || data.totalAmount).toLocaleString('fr-FR')} Fr</strong>
          </div>` : ''}

          ${data.status === 'UNPAID' ? `
          <div style="font-size: 12px; color: #b91c1c; margin-bottom: 10px;">
            ⚠️ IMPAYÉ — Solde dû: <strong>${Math.round(data.totalAmount).toLocaleString('fr-FR')} Fr</strong>
          </div>` : ''}

          <!-- SIGNATURE -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="title">LA DIRECTION</div>
              <div class="stamp-circle">
                ETS DACOSTA<br/>AUTOS<br/>YAOUNDÉ<br/>CAMEROUN
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-col">
            <div class="footer-item">
              <span class="footer-icon">📞</span>
              <span>Tel: +237 673 99 79 50 / 658 98 84 87<br/>656 22 39 98</span>
            </div>
            <div class="footer-item">
              <span class="footer-icon">✉️</span>
              <span>geralddacosta2015@gmail.com</span>
            </div>
          </div>
          <div class="footer-col">
            <div class="footer-item">
              <span class="footer-icon">📍</span>
              <div>
                Douala en face total Dobo BONABERI boutique N°836 Camp D<br/>
                Yaoundé Mimboman liberté en face de beauty Magic
              </div>
            </div>
          </div>
          <div class="footer-col" style="font-size: 10px; line-height: 1.6;">
            <div><span class="label">RCCM:</span> RC/DLA/2021/A/4514</div>
            <div><span class="label">NIU:</span> P118717230679R</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 600);
  }
}
