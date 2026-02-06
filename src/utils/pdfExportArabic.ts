import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFTableColumn {
  header: string;
  dataKey: string;
}

interface PDFTableOptions {
  title: string;
  subtitle?: string;
  columns: PDFTableColumn[];
  data: any[];
  filename: string;
  shopName?: string;
  dateRange?: string;
}

export const generateTablePDF = async ({
  title,
  subtitle,
  columns,
  data,
  filename,
  shopName = 'صالون الجمال',
  dateRange,
}: PDFTableOptions) => {
  // Create an isolated iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create iframe document');
  }

  // Build HTML content
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Cairo', Arial, sans-serif;
          background-color: #ffffff;
          padding: 20mm;
          width: 210mm;
          color: #000000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .shop-name {
          color: #a855f7;
          font-size: 28px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        .report-title {
          color: #000000;
          font-size: 20px;
          margin: 10px 0;
          font-weight: bold;
        }
        .subtitle {
          color: #666666;
          font-size: 14px;
          margin: 5px 0;
        }
        .date-range {
          color: #666666;
          font-size: 12px;
          margin: 5px 0;
        }
        .print-date {
          color: #999999;
          font-size: 11px;
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        thead tr {
          background-color: #a855f7;
          color: #ffffff;
        }
        th {
          padding: 12px;
          border: 1px solid #dddddd;
          text-align: center;
          font-weight: bold;
        }
        td {
          padding: 10px;
          border: 1px solid #dddddd;
          text-align: center;
        }
        tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #333333;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="shop-name">${shopName}</h1>
        <h2 class="report-title">${title}</h2>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        ${dateRange ? `<p class="date-range">${dateRange}</p>` : ''}
        <p class="print-date">تاريخ الطباعة: ${dateStr} - ${timeStr}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                const value = row[col.dataKey];
                const displayValue = value != null ? value : '-';
                return `<td>${displayValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <strong>إجمالي السجلات: ${data.length}</strong>
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: iframeDoc.body.scrollWidth,
      windowHeight: iframeDoc.body.scrollHeight,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add extra pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(iframe);
  }
};

// Export invoice as PDF with full details (ENGLISH VERSION)
interface InvoiceData {
  id: string;
  customer: string;
  customerPhone?: string;
  date: string;
  items?: { name: string; quantity: number; price: number }[];
  amount: number;
  discount?: number;
  paymentMethod?: string;
  notes?: string;
}

interface InvoicePDFOptions {
  invoice: InvoiceData;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const generateInvoicePDF = async ({
  invoice,
  shopName = 'Beauty Salon',
  shopPhone = '01234567890',
  shopAddress = 'Cairo, Egypt',
}: InvoicePDFOptions) => {
  // Create an isolated iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create iframe document');
  }

  const subtotal = invoice.amount + (invoice.discount || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          padding: 20mm;
          width: 210mm;
          color: #000000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .shop-name {
          color: #a855f7;
          font-size: 32px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        .shop-info {
          color: #666666;
          font-size: 12px;
          margin: 5px 0;
        }
        .invoice-title {
          color: #000000;
          font-size: 24px;
          margin: 20px 0;
          font-weight: bold;
        }
        .invoice-info {
          margin-bottom: 20px;
          font-size: 13px;
        }
        .invoice-info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }
        thead tr {
          background-color: #a855f7;
          color: #ffffff;
        }
        th {
          padding: 12px;
          border: 1px solid #dddddd;
          font-weight: bold;
        }
        th.left { text-align: left; }
        th.center { text-align: center; }
        th.right { text-align: right; }
        td {
          padding: 10px;
          border: 1px solid #dddddd;
        }
        td.left { text-align: left; }
        td.center { text-align: center; }
        td.right { text-align: right; }
        tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        .totals {
          text-align: right;
          margin-top: 30px;
          font-size: 13px;
        }
        .totals p {
          margin: 5px 0;
        }
        .total-line {
          margin: 10px 0;
          font-size: 16px;
        }
        .notes {
          margin-top: 20px;
          font-size: 11px;
          color: #666666;
        }
        .thank-you {
          text-align: center;
          margin-top: 50px;
          color: #a855f7;
          font-size: 14px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="shop-name">${shopName}</h1>
        <p class="shop-info">${shopAddress}</p>
        <p class="shop-info">Phone: ${shopPhone}</p>
        <h2 class="invoice-title">INVOICE</h2>
      </div>
      
      <div class="invoice-info">
        <p><strong>Invoice #:</strong> ${invoice.id}</p>
        <p><strong>Date:</strong> ${invoice.date}</p>
        <p><strong>Customer:</strong> ${invoice.customer}</p>
        ${invoice.customerPhone ? `<p><strong>Phone:</strong> ${invoice.customerPhone}</p>` : ''}
      </div>
      
      ${invoice.items && invoice.items.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th class="left">Service/Product</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td class="left">${item.name}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${item.price.toFixed(2)} EGP</td>
                <td class="right">${(item.quantity * item.price).toFixed(2)} EGP</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <div class="totals">
        <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)} EGP</p>
        ${invoice.discount && invoice.discount > 0 ? `<p><strong>Discount:</strong> ${invoice.discount.toFixed(2)} EGP</p>` : ''}
        <p class="total-line"><strong>Total:</strong> ${invoice.amount.toFixed(2)} EGP</p>
        ${invoice.paymentMethod ? `<p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>` : ''}
      </div>
      
      ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
      
      <div class="thank-you">
        Thank you for your visit
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: iframeDoc.body.scrollWidth,
      windowHeight: iframeDoc.body.scrollHeight,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    pdf.save(`Invoice-${invoice.id}.pdf`);
  } finally {
    // Clean up
    document.body.removeChild(iframe);
  }
};
