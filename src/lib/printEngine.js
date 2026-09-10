/**
 * NEXIS ERP - Enterprise Print & PDF Engine
 * Generates isolated, pristine printable documents for Invoices and Thermal Receipts.
 * Guaranteed: NO background UI, NO toast notifications, NO modal cut-offs, 100% clean formatting.
 * Powered by digitalerena.com
 */

import { formatCurrency } from './currency';

/**
 * Isolated Print Driver - Uses hidden iframe for zero layout leakage
 */
function executePrint(htmlContent, title = 'Document') {
  // Remove any existing print iframes
  const existingFrame = document.getElementById('nexis-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'nexis-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
    // Clean up after print dialog finishes
    setTimeout(() => {
      if (document.getElementById('nexis-print-frame')) {
        document.getElementById('nexis-print-frame').remove();
      }
    }, 2000);
  }, 250);
}

/**
 * Print POS Thermal Receipt (80mm standard paper)
 */
export function printReceipt(sale) {
  if (!sale) return;

  const receiptNumber = sale.receipt_number || sale.id || 'REC-POS';
  const saleDate = sale.sale_date ? new Date(sale.sale_date).toLocaleString() : new Date().toLocaleString();
  const cashier = sale.cashier_name || 'Counter Cashier';
  const customer = sale.customer_name || 'Walk-in Retail Client';
  const subtotal = Number(sale.subtotal) || Number(sale.total_amount) || 0;
  const discount = Number(sale.discount_amount) || 0;
  const tax = Number(sale.tax_amount) || 0;
  const total = Number(sale.total_amount) || 0;
  const paymentMethod = sale.payment_method || 'Cash';
  const tendered = Number(sale.amount_tendered) || Number(sale.tendered_amount) || total;
  const change = Number(sale.change_amount) || Number(sale.change_due) || 0;
  const items = sale.items || [];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${receiptNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm 4mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
            color: #000000;
            background: #ffffff;
            width: 72mm;
            margin: 0 auto;
            padding: 4px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-mono { font-family: "Courier New", Courier, monospace; }
          .brand-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 10px;
            color: #333;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 2px;
          }
          .item-row {
            margin-bottom: 4px;
          }
          .item-top {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
          }
          .item-sub {
            font-size: 9px;
            color: #444;
          }
          .totals-table {
            width: 100%;
            margin-top: 4px;
          }
          .totals-table td {
            padding: 1.5px 0;
          }
          .grand-total {
            font-size: 14px;
            font-weight: 900;
          }
          .footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            text-align: center;
            font-size: 9.5px;
          }
          .powered-by {
            margin-top: 4px;
            font-weight: 700;
            font-size: 9px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .barcode-mock {
            letter-spacing: 3px;
            font-family: monospace;
            font-size: 10px;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="brand-title">NEXIS BUSINESS ERP</div>
          <div class="brand-sub">Retail Counter & Point of Sale</div>
          <div class="brand-sub">NTN: 8934201-9 · Lahore, Pakistan</div>
          <div class="brand-sub">Tel: +92 (21) 3582-9100</div>
        </div>

        <div class="divider"></div>

        <div class="meta-row">
          <span>Receipt #:</span>
          <span class="font-bold">${receiptNumber}</span>
        </div>
        <div class="meta-row">
          <span>Date/Time:</span>
          <span>${saleDate}</span>
        </div>
        <div class="meta-row">
          <span>Cashier:</span>
          <span>${cashier}</span>
        </div>
        <div class="meta-row">
          <span>Customer:</span>
          <span class="font-bold">${customer}</span>
        </div>

        <div class="divider"></div>

        <div>
          ${items.map(item => `
            <div class="item-row">
              <div class="item-top">
                <span style="max-width: 68%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
                <span class="font-mono font-bold">${formatCurrency(item.total || (item.quantity * item.unit_price))}</span>
              </div>
              <div class="item-sub font-mono">
                ${item.quantity} x ${formatCurrency(item.unit_price)}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right font-mono">${formatCurrency(subtotal)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td>Discount:</td>
            <td class="text-right font-mono">-${formatCurrency(discount)}</td>
          </tr>` : ''}
          <tr>
            <td>Sales Tax (GST 18%):</td>
            <td class="text-right font-mono">${formatCurrency(tax)}</td>
          </tr>
          <tr class="grand-total">
            <td style="padding-top: 4px;">TOTAL PAID:</td>
            <td class="text-right font-mono" style="padding-top: 4px;">${formatCurrency(total)}</td>
          </tr>
          <tr>
            <td style="padding-top: 4px; font-size: 10px;">Payment Tender:</td>
            <td class="text-right font-mono font-bold" style="padding-top: 4px; font-size: 10px;">${paymentMethod}</td>
          </tr>
          ${paymentMethod.toLowerCase().includes('cash') ? `
          <tr>
            <td style="font-size: 10px;">Amount Tendered:</td>
            <td class="text-right font-mono" style="font-size: 10px;">${formatCurrency(tendered)}</td>
          </tr>
          <tr>
            <td style="font-size: 10px;">Change Returned:</td>
            <td class="text-right font-mono font-bold" style="font-size: 10px;">${formatCurrency(change)}</td>
          </tr>` : ''}
        </table>

        <div class="footer">
          <div>Thank you for your business!</div>
          <div>Returns/Exchange within 7 days with original slip.</div>
          <div class="barcode-mock">*${receiptNumber}*</div>
          <div class="powered-by">Powered by digitalerena.com</div>
        </div>
      </body>
    </html>
  `;

  executePrint(html, `Receipt-${receiptNumber}`);
}

/**
 * Print Corporate Commercial Invoice (Standard A4 Format)
 */
export function printInvoice(invoice, companySettings = {}) {
  if (!invoice) return;

  const invoiceNumber = invoice.invoice_number || invoice.id || 'INV-COMM';
  const invoiceDate = invoice.invoice_date || new Date().toISOString().slice(0, 10);
  const dueDate = invoice.due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const status = invoice.status || 'Issued';
  const customerName = invoice.customer_name || 'Commercial Client';
  const customerEmail = invoice.customer_email || 'N/A';
  const customerPhone = invoice.customer_phone || 'N/A';
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal) || (Number(invoice.total_amount) - (Number(invoice.tax_amount) || 0));
  const discount = Number(invoice.discount_amount) || 0;
  const tax = Number(invoice.tax_amount) || 0;
  const grandTotal = Number(invoice.total_amount) || 0;
  const amountPaid = Number(invoice.amount_paid) || 0;
  const balanceDue = Number(invoice.balance_due) ?? (grandTotal - amountPaid);
  const terms = invoice.terms || 'Payment due within 30 days of invoice date.';
  const notes = invoice.notes || 'Official electronic commercial invoice.';

  const companyName = companySettings.company_name || 'NEXIS Enterprise Technologies Ltd.';
  const companyTaxId = companySettings.tax_id || 'NTN-4892011-7 · STRN: 32778761-0';
  const companyAddress = companySettings.address || 'Level 14, Executive Tower, Clifton Block 4, Karachi, Pakistan';
  const companyEmail = companySettings.company_email || 'finance@nexiserp.com';
  const companyPhone = companySettings.company_phone || '+92 (21) 3582-9100';

  const statusColor = status === 'Paid' ? '#059669' : status === 'Overdue' ? '#dc2626' : status === 'Draft' ? '#475569' : '#2563eb';
  const statusBg = status === 'Paid' ? '#ecfdf5' : status === 'Overdue' ? '#fef2f2' : status === 'Draft' ? '#f1f5f9' : '#eff6ff';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.4;
          }
          .invoice-box {
            max-width: 100%;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
          }
          .logo-text {
            font-size: 22px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .logo-sub {
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .invoice-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid ${statusColor};
            color: ${statusColor};
            background: ${statusBg};
          }
          .invoice-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            text-align: right;
          }
          .invoice-num {
            font-family: "Courier New", Courier, monospace;
            font-size: 13px;
            font-weight: 700;
            color: #2563eb;
            text-align: right;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 20px;
          }
          .meta-card {
            width: 48%;
            vertical-align: top;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .meta-heading {
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
          }
          .meta-client {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background: #0f172a;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
          }
          .items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10.5px;
          }
          .items-table tr:nth-child(even) td {
            background: #f8fafc;
          }
          .font-mono { font-family: "Courier New", Courier, monospace; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .summary-table {
            width: 100%;
            margin-bottom: 20px;
          }
          .instructions-box {
            width: 52%;
            vertical-align: top;
            padding-right: 20px;
          }
          .bank-box {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 9.5px;
            margin-top: 6px;
          }
          .calc-box {
            width: 48%;
            vertical-align: top;
          }
          .calc-table {
            width: 100%;
            border-collapse: collapse;
          }
          .calc-table td {
            padding: 4px 6px;
            font-size: 11px;
          }
          .calc-table tr.total-row td {
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
            font-size: 13px;
            font-weight: 900;
            color: #1e3a8a;
            padding: 6px;
          }
          .calc-table tr.balance-row td {
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            font-weight: 800;
            color: #dc2626;
            padding: 6px;
          }
          .footer-section {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5px;
            color: #64748b;
          }
          .powered-link {
            font-weight: 800;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: middle;">
                <div class="logo-text">NEXIS ERP</div>
                <div class="logo-sub">Enterprise Operating Cloud &middot; Commercial Operations</div>
              </td>
              <td style="vertical-align: middle; text-align: right;">
                <div class="invoice-badge">${status}</div>
                <div class="invoice-title">COMMERCIAL INVOICE</div>
                <div class="invoice-num">${invoiceNumber}</div>
              </td>
            </tr>
          </table>

          <!-- Billed By & Billed To Meta Block -->
          <table class="meta-table">
            <tr>
              <td class="meta-card">
                <div class="meta-heading">BILLED BY / ISSUING ENTITY</div>
                <div class="meta-client">${companyName}</div>
                <div>${companyTaxId}</div>
                <div>${companyAddress}</div>
                <div>Email: ${companyEmail} &middot; Tel: ${companyPhone}</div>
              </td>
              <td style="width: 4%;"></td>
              <td class="meta-card">
                <div class="meta-heading">BILLED TO / CORPORATE CLIENT</div>
                <div class="meta-client">${customerName}</div>
                <div>Phone: ${customerPhone} &middot; Email: ${customerEmail}</div>
                <div style="margin-top: 4px; font-size: 10px;">
                  <span class="font-bold">Invoice Date:</span> ${invoiceDate} &nbsp;|&nbsp; 
                  <span class="font-bold">Due Date:</span> ${dueDate}
                </div>
              </td>
            </tr>
          </table>

          <!-- Line Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 55%;">Product / Service Description</th>
                <th style="width: 10%;" class="text-center">Qty</th>
                <th style="width: 15%;" class="text-right">Unit Price</th>
                <th style="width: 15%;" class="text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td>
                    <div class="font-bold">${item.name}</div>
                    ${item.sku ? `<div style="font-size: 9px; color: #64748b;" class="font-mono">SKU: ${item.sku}</div>` : ''}
                  </td>
                  <td class="text-center font-mono font-bold">${item.quantity}</td>
                  <td class="text-right font-mono">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right font-mono font-bold">${formatCurrency(item.total || (item.quantity * item.unit_price))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Summary & Payment Instructions Block -->
          <table class="summary-table">
            <tr>
              <td class="instructions-box">
                <div class="meta-heading">PAYMENT TERMS & BANK SETTLEMENT</div>
                <div style="font-size: 10px;">${terms}</div>
                <div class="bank-box">
                  <div class="font-bold" style="color: #0f172a;">Direct Bank Wire Instructions:</div>
                  <div><span class="font-bold">Bank:</span> Habib Bank Limited (HBL) - Corporate Branch</div>
                  <div><span class="font-bold">Account Title:</span> NEXIS Enterprise Technologies Ltd.</div>
                  <div class="font-mono"><span class="font-bold">Account / IBAN:</span> PK36HABB00012345678901</div>
                </div>
                ${notes ? `<div style="margin-top: 6px; font-size: 9.5px; color: #64748b;"><span class="font-bold">Notes:</span> ${notes}</div>` : ''}
              </td>
              <td class="calc-box">
                <table class="calc-table">
                  <tr>
                    <td>Gross Subtotal:</td>
                    <td class="text-right font-mono font-bold">${formatCurrency(subtotal)}</td>
                  </tr>
                  ${discount > 0 ? `
                  <tr>
                    <td style="color: #dc2626;">Discount Allowance:</td>
                    <td class="text-right font-mono font-bold" style="color: #dc2626;">-${formatCurrency(discount)}</td>
                  </tr>` : ''}
                  <tr>
                    <td>Sales Tax (18% GST):</td>
                    <td class="text-right font-mono font-bold">${formatCurrency(tax)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>TOTAL INVOICE (PKR):</td>
                    <td class="text-right font-mono">${formatCurrency(grandTotal)}</td>
                  </tr>
                  <tr>
                    <td style="color: #059669;">Amount Paid / Settled:</td>
                    <td class="text-right font-mono font-bold" style="color: #059669;">${formatCurrency(amountPaid)}</td>
                  </tr>
                  <tr class="balance-row">
                    <td>BALANCE DUE:</td>
                    <td class="text-right font-mono font-bold">${formatCurrency(balanceDue)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Footer & Attribution -->
          <div class="footer-section">
            <div>
              This is a verified computer-generated commercial tax invoice under GAAP accounting standards.
            </div>
            <div class="powered-link">
              Powered by digitalerena.com
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  executePrint(html, `Invoice-${invoiceNumber}`);
}
