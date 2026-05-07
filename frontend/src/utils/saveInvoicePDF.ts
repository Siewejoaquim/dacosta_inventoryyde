import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { numberToFrenchWords } from './numberToWords';

interface PrintItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  guarantee?: string; // per-item guarantee
}

interface SaveInvoiceOptions {
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  dateCreated: string;
  items: PrintItem[];
  totalAmount: number;
  originalAmount?: number;
  amountPaid?: number;
  status: string;
  guarantee?: string; // global guarantee
}

// Remove white background from logo using canvas
async function logoWithTransparentBg(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64: string = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < d.data.length; i += 4) {
          if (d.data[i] > 230 && d.data[i + 1] > 230 && d.data[i + 2] > 230) {
            d.data[i + 3] = 0;
          }
        }
        ctx.putImageData(d, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = base64;
    });
  } catch {
    return '';
  }
}

export async function saveInvoicePDF(data: SaveInvoiceOptions): Promise<void> {
  const date = new Date(data.dateCreated);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const amountInWords = numberToFrenchWords(Math.round(data.totalAmount));
  const logoBase64    = await logoWithTransparentBg('/dacosta-logo.jpeg');

  // ── Bigger font sizes for readability ──────────────────────────────────────
  const itemRows = data.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f5f5f5'}">
      <td style="padding:9px 12px;border:1px solid #ddd;font-size:14px;">
        ${item.productName}
        ${item.guarantee ? `<br/><span style="font-size:11px;color:#166534;font-weight:700;background:#dcfce7;padding:1px 6px;border-radius:3px;">🛡️ ${item.guarantee}</span>` : ''}
      </td>
      <td style="padding:9px 12px;border:1px solid #ddd;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:9px 12px;border:1px solid #ddd;text-align:right;font-size:14px;">${Math.round(item.unitPrice).toLocaleString('fr-FR')}</td>
      <td style="padding:9px 12px;border:1px solid #ddd;text-align:right;font-size:14px;font-weight:700;">${Math.round(item.totalPrice).toLocaleString('fr-FR')}</td>
    </tr>
  `).join('');

  // ── Container: fixed width 794px (A4 at 96dpi), height = auto (no min-height) ──
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -99999px;
    left: -99999px;
    width: 794px;
    background: white;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    overflow: hidden;
  `;

  container.innerHTML = `
    <div id="inv-root" style="width:794px;background:#fff;display:flex;flex-direction:column;min-height:1123px;">

      <!-- Red top bar -->
      <div style="height:6px;background:#cc0000;"></div>

      <!-- Header -->
      <div style="display:flex;align-items:center;padding:12px 26px;border-bottom:3px solid #cc0000;background:#fff;gap:0;">
        ${logoBase64
          ? `<img src="${logoBase64}" style="width:110px;height:auto;object-fit:contain;background:transparent;" alt="Logo"/>`
          : `<div style="text-align:center;min-width:110px;">
               <div style="font-size:20px;font-weight:900;color:#111;font-family:Arial Black,Arial,sans-serif;">DACOSTA</div>
               <div style="font-size:13px;font-weight:900;color:#cc0000;letter-spacing:3px;">AUTOS</div>
             </div>`
        }
        <div style="width:2px;height:60px;background:#ddd;margin:0 20px;flex-shrink:0;"></div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#cc0000;letter-spacing:3px;font-family:Arial Black,Arial,sans-serif;line-height:1;">ETS DACOSTA</div>
          <div style="font-size:12px;color:#333;font-weight:600;margin-top:5px;letter-spacing:0.5px;">IVECO &nbsp;|&nbsp; MAN DIESEL &nbsp;|&nbsp; RENAULT &nbsp;|&nbsp; MERCEDES &nbsp;|&nbsp; TOYOTA</div>
        </div>
      </div>

      <!-- Body -->
      <div style="padding:14px 26px 10px 26px;flex:1;display:flex;flex-direction:column;">

        <div style="text-align:right;font-size:13px;color:#444;margin-bottom:10px;">
          Yaoundé, le ${formattedDate}
        </div>

        <div style="text-align:center;font-size:16px;font-weight:700;text-decoration:underline;letter-spacing:1px;margin-bottom:12px;">
          FACTURE PROFORMA N° ${data.invoiceNumber}
        </div>

        <div style="font-size:14px;margin-bottom:12px;padding:7px 12px;background:#f9f9f9;border-left:4px solid #cc0000;">
          <strong>Doit :</strong>&nbsp;${data.customerName}${data.customerPhone ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + data.customerPhone : ''}
        </div>

        <!-- Items table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <thead>
            <tr style="background:#1a1a1a;color:#fff;">
              <th style="padding:10px 12px;font-size:13px;font-weight:700;text-align:left;width:50%;">Désignation</th>
              <th style="padding:10px 12px;font-size:13px;font-weight:700;text-align:center;width:12%;">Qté</th>
              <th style="padding:10px 12px;font-size:13px;font-weight:700;text-align:right;width:19%;">Prix unitaire</th>
              <th style="padding:10px 12px;font-size:13px;font-weight:700;text-align:right;width:19%;">Prix Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:9px 12px;border:1px solid #ddd;font-weight:700;font-size:14px;background:#efefef;">Total</td>
              <td style="padding:9px 12px;border:1px solid #ddd;font-weight:700;font-size:15px;background:#efefef;text-align:right;color:#cc0000;">
                ${Math.round(data.totalAmount).toLocaleString('fr-FR')} Fr
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount in words -->
        <div style="font-size:13px;font-style:italic;margin:10px 0;padding:7px 12px;border:1px dashed #ccc;background:#fafafa;">
          Arrêter la présente facture à la somme de&nbsp;<strong style="font-style:normal;font-weight:700;">${amountInWords}</strong>.
        </div>

        <!-- Status badge -->
        ${data.status === 'PARTIAL' ? `
        <div style="display:inline-block;font-size:13px;font-weight:700;padding:5px 12px;border-radius:4px;margin-bottom:8px;background:#fef3c7;color:#92400e;">
          ⚠ Paiement partiel — Payé: ${Math.round(data.amountPaid || 0).toLocaleString('fr-FR')} Fr &nbsp;/&nbsp; Total initial: ${Math.round(data.originalAmount || data.totalAmount).toLocaleString('fr-FR')} Fr
        </div>` : ''}
        ${data.status === 'UNPAID' ? `
        <div style="display:inline-block;font-size:13px;font-weight:700;padding:5px 12px;border-radius:4px;margin-bottom:8px;background:#fee2e2;color:#991b1b;">
          ✗ IMPAYÉ — Solde dû: ${Math.round(data.totalAmount).toLocaleString('fr-FR')} Fr
        </div>` : ''}
        ${data.status === 'PAID' ? `
        <div style="display:inline-block;font-size:13px;font-weight:700;padding:5px 12px;border-radius:4px;margin-bottom:8px;background:#dcfce7;color:#166534;">
          ✓ PAYÉ INTÉGRALEMENT
        </div>` : ''}

        <!-- Guarantee section -->
        ${data.guarantee ? `
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:7px 12px;border-radius:4px;margin-bottom:8px;background:#f0fdf4;border:1.5px solid #86efac;color:#166534;">
          🛡️ Garantie : ${data.guarantee}
        </div>` : ''}
        ${!data.guarantee && data.items.some(it => it.guarantee) ? `
        <div style="font-size:12px;color:#166534;font-weight:600;margin-bottom:6px;">
          🛡️ Garanties par article — voir tableau ci-dessus
        </div>` : ''}

        <!-- Signature — pushed to bottom -->
        <div style="margin-top:auto;display:flex;justify-content:flex-end;padding-right:28px;padding-top:18px;padding-bottom:14px;">
          <div style="text-align:center;width:160px;">
            <div style="font-size:13px;font-weight:700;text-decoration:underline;margin-bottom:44px;">LA DIRECTION</div>
          </div>
        </div>
      </div>

      <!-- Footer — solid black -->
      <div style="background:#000000;color:#fff;padding:12px 22px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-top:4px solid #cc0000;">

        <div style="font-size:11.5px;line-height:1.8;color:#fff;">
          <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            <span style="color:#fff;">+237 673 99 79 50 / 658 98 84 87 / 656 22 39 98</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:7px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style="color:#fff;">geralddacosta2015@gmail.com</span>
          </div>
        </div>

        <div style="width:1px;background:rgba(255,255,255,0.15);align-self:stretch;"></div>

        <div style="font-size:11.5px;line-height:1.8;color:#fff;">
          <div style="display:flex;align-items:flex-start;gap:7px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style="color:#fff;">Douala BONABERI boutique N°836 Camp D<br/>Yaoundé Mimboman liberté</span>
          </div>
        </div>

        <div style="width:1px;background:rgba(255,255,255,0.15);align-self:stretch;"></div>

        <div style="font-size:11px;line-height:2;color:#fff;">
          <div><span style="color:#ff5555;font-weight:700;">RCCM:</span> RC/DLA/2021/A/4514</div>
          <div><span style="color:#ff5555;font-weight:700;">NIU:</span> P118717230679R</div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const element = container.querySelector('#inv-root') as HTMLElement;

    // Capture at 2x scale for sharpness
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    // A4 = 210 × 297 mm
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297

    // Scale the canvas to fit exactly within one A4 page
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const ratio   = canvasW / canvasH;

    let imgW = pageW;
    let imgH = pageW / ratio;

    // If still taller than page, scale down to fit height
    if (imgH > pageH) {
      imgH = pageH;
      imgW = pageH * ratio;
    }

    // Center horizontally if narrower than page
    const xOffset = (pageW - imgW) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.97);
    pdf.addImage(imgData, 'JPEG', xOffset, 0, imgW, imgH);

    const filename = `Facture-${data.invoiceNumber}-${data.customerName.replace(/\s+/g, '-')}.pdf`;
    pdf.save(filename);

  } finally {
    document.body.removeChild(container);
  }
}
