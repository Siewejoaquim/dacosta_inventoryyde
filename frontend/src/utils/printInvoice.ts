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

// Convert image URL to base64 for use in print window
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// Remove white/near-white background from logo using canvas
async function logoWithTransparentBg(url: string): Promise<string> {
  try {
    const base64 = await imageToBase64(url);
    if (!base64) return '';

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make white and near-white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If pixel is white or near-white (threshold 230)
          if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0; // set alpha to 0 (transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = base64;
    });
  } catch {
    return '';
  }
}

export async function printInvoice(data: PrintInvoiceOptions) {
  const date = new Date(data.dateCreated);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const amountInWords = numberToFrenchWords(Math.round(data.totalAmount));

  // Load logo with transparent background (removes white bg)
  const logoBase64 = await logoWithTransparentBg('/dacosta-logo.jpeg');

  const itemRows = data.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
      <td style="padding:7px 10px;border:1px solid #ddd;font-size:12px;">${item.productName}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:center;font-size:12px;">${item.quantity}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:right;font-size:12px;">${Math.round(item.unitPrice).toLocaleString('fr-FR')}</td>
      <td style="padding:7px 10px;border:1px solid #ddd;text-align:right;font-size:12px;font-weight:700;">${Math.round(item.totalPrice).toLocaleString('fr-FR')}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm;
      height: 297mm;
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #111;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── TOP RED BAR ── */
    .top-bar { height: 5px; background: #cc0000; }

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: center;
      padding: 10px 22px;
      border-bottom: 3px solid #cc0000;
      gap: 0;
    }
    .logo-img {
      width: 120px;
      height: auto;
      object-fit: contain;
      background: transparent;
    }
    .header-divider {
      width: 2px;
      height: 65px;
      background: #ddd;
      margin: 0 18px;
    }
    .company-block { flex: 1; text-align: center; }
    .company-name {
      font-size: 34px;
      font-weight: 900;
      color: #cc0000;
      letter-spacing: 3px;
      font-family: 'Arial Black', Arial, sans-serif;
      line-height: 1;
    }
    .company-brands {
      font-size: 11.5px;
      color: #333;
      font-weight: 600;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }

    /* ── BODY ── */
    .body {
      flex: 1;
      padding: 12px 22px 8px 22px;
      display: flex;
      flex-direction: column;
    }
    .date-text {
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
    .client-line {
      font-size: 12.5px;
      margin-bottom: 10px;
      padding: 5px 10px;
      background: #f9f9f9;
      border-left: 3px solid #cc0000;
    }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    thead tr { background: #1a1a1a; color: #fff; }
    thead th {
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
    }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3),
    thead th:nth-child(4) { text-align: right; }
    .total-row td {
      padding: 7px 10px;
      border: 1px solid #ddd;
      font-weight: 700;
      font-size: 12.5px;
      background: #f0f0f0;
    }
    .total-row td:last-child { text-align: right; color: #cc0000; }

    /* ── AMOUNT WORDS ── */
    .amount-words {
      font-size: 11.5px;
      font-style: italic;
      margin: 8px 0 8px 0;
      padding: 5px 10px;
      border: 1px dashed #ccc;
      background: #fafafa;
    }
    .amount-words strong { font-style: normal; font-weight: 700; }

    /* ── STATUS ── */
    .status-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 3px;
      margin-bottom: 6px;
    }

    /* ── SIGNATURE ── */
    .sig-row {
      display: flex;
      justify-content: flex-end;
      padding-right: 24px;
      margin-top: 6px;
      flex: 1;
      align-items: flex-end;
      padding-bottom: 10px;
    }
    .sig-box { text-align: center; width: 150px; }
    .sig-title {
      font-size: 12px;
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 50px;
    }

    /* ── FOOTER ── */
    .footer {
      background: #000000 !important;
      color: #fff !important;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      border-top: 4px solid #cc0000;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .footer-col { font-size: 10.5px; line-height: 1.75; }
    .footer-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin-bottom: 3px;
    }
    .f-icon { flex-shrink: 0; margin-top: 2px; }
    .f-red { color: #ff5555; font-weight: 700; }
    .footer-sep {
      width: 1px;
      background: rgba(255,255,255,0.12);
      align-self: stretch;
    }

    /* ── FORCE COLORS WHEN PRINTING ── */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .footer {
        background: #000000 !important;
        color: #fff !important;
      }
      .top-bar {
        background: #cc0000 !important;
      }
      thead tr {
        background: #1a1a1a !important;
        color: #fff !important;
      }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="top-bar"></div>

  <!-- HEADER -->
  <div class="header">
    ${logoBase64
      ? `<img src="${logoBase64}" class="logo-img" alt="DaCosta Autos"/>`
      : `<div style="text-align:center;min-width:120px">
           <div style="font-size:22px;font-weight:900;color:#111;font-family:'Arial Black',Arial,sans-serif;">DACOSTA</div>
           <div style="font-size:14px;font-weight:900;color:#cc0000;letter-spacing:3px;font-family:'Arial Black',Arial,sans-serif;">AUTOS</div>
         </div>`
    }
    <div class="header-divider"></div>
    <div class="company-block">
      <div class="company-name">ETS DACOSTA</div>
      <div class="company-brands">IVECO &nbsp;|&nbsp; MAN DIESEL &nbsp;|&nbsp; RENAULT &nbsp;|&nbsp; MERCEDES &nbsp;|&nbsp; TOYOTA</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <div class="date-text">Yaoundé, le ${formattedDate}</div>

    <div class="invoice-title">FACTURE PROFORMA N° ${data.invoiceNumber}</div>

    <div class="client-line">
      <strong>Doit&nbsp;:</strong>&nbsp;${data.customerName}${data.customerPhone ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + data.customerPhone : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:52%">Désignation</th>
          <th style="width:12%;text-align:center">Quantités</th>
          <th style="width:18%;text-align:right">Prix unitaire</th>
          <th style="width:18%;text-align:right">Prix Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3">Total</td>
          <td>${Math.round(data.totalAmount).toLocaleString('fr-FR')}</td>
        </tr>
      </tfoot>
    </table>

    <div class="amount-words">
      Arrêter la présente facture à la somme de <strong>${amountInWords}</strong>.
    </div>

    ${data.status === 'PARTIAL' ? `
    <div class="status-badge" style="background:#fef3c7;color:#92400e;">
      ⚠ Paiement partiel — Payé: ${Math.round(data.amountPaid || 0).toLocaleString('fr-FR')} Fr / Total initial: ${Math.round(data.originalAmount || data.totalAmount).toLocaleString('fr-FR')} Fr
    </div>` : ''}
    ${data.status === 'UNPAID' ? `
    <div class="status-badge" style="background:#fee2e2;color:#991b1b;">
      ✗ IMPAYÉ — Solde dû: ${Math.round(data.totalAmount).toLocaleString('fr-FR')} Fr
    </div>` : ''}
    ${data.status === 'PAID' ? `
    <div class="status-badge" style="background:#dcfce7;color:#166534;">
      ✓ PAYÉ INTÉGRALEMENT
    </div>` : ''}

    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-title">LA DIRECTION</div>
      </div>
    </div>
  </div>

  <!-- FOOTER — dark like the original -->
  <div class="footer">
    <div class="footer-col">
      <div class="footer-item">
        <!-- Phone icon -->
        <svg class="f-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
        </svg>
        <span>Tel: +237 673 99 79 50 / 658 98 84 87<br/>656 22 39 98</span>
      </div>
      <div class="footer-item">
        <!-- Email icon -->
        <svg class="f-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span>geralddacosta2015@gmail.com</span>
      </div>
    </div>

    <div class="footer-sep"></div>

    <div class="footer-col">
      <div class="footer-item">
        <!-- Location icon -->
        <svg class="f-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>
          Douala en face total Dobo BONABERI boutique N°836 Camp D<br/>
          Yaoundé Mimboman liberté en face de beauty Magic
        </span>
      </div>
    </div>

    <div class="footer-sep"></div>

    <div class="footer-col" style="font-size:10px;line-height:2;">
      <div><span class="f-red">RCCM:</span> RC/DLA/2021/A/4514</div>
      <div><span class="f-red">NIU:</span> P118717230679R</div>
    </div>
  </div>

</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 800);
  }
}
