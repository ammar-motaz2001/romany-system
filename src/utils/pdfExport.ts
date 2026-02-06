import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configure jsPDF to support Arabic text (RTL)
export const createPDF = () => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set RTL for Arabic support
  pdf.setLanguage('ar');

  return pdf;
};

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

export const generateTablePDF = ({
  title,
  subtitle,
  columns,
  data,
  filename,
  shopName = 'صالون الجمال',
  dateRange,
}: PDFTableOptions) => {
  const pdf = createPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add header with logo/shop name
  pdf.setFontSize(22);
  pdf.setTextColor(168, 85, 247); // Purple color
  pdf.text(shopName, pageWidth / 2, 20, { align: 'center' });

  // Add title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, pageWidth / 2, 30, { align: 'center' });

  // Add subtitle if provided
  let startY = 40;
  if (subtitle) {
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(subtitle, pageWidth / 2, 38, { align: 'center' });
    startY = 45;
  }

  // Add date range if provided
  if (dateRange) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(dateRange, pageWidth / 2, startY, { align: 'center' });
    startY += 5;
  }

  // Add date and time
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
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`تاريخ الطباعة: ${dateStr} - ${timeStr}`, pageWidth / 2, startY + 3, {
    align: 'center',
  });

  // Prepare table data
  const tableColumns = columns.map((col) => col.header);
  const tableData = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.dataKey];
      // Format numbers with Arabic numerals
      if (typeof value === 'number') {
        return value.toLocaleString('ar-EG');
      }
      return value || '-';
    });
  });

  // Generate table
  autoTable(pdf, {
    head: [tableColumns],
    body: tableData,
    startY: startY + 10,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [168, 85, 247], // Purple
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { top: 10, right: 10, bottom: 20, left: 10 },
    tableWidth: 'auto',
    didDrawPage: (data: any) => {
      // Add footer with page number
      const pageCount = (pdf as any).internal.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `صفحة ${data.pageNumber} من ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // Add summary if data exists
  if (data.length > 0) {
    const finalY = (pdf as any).lastAutoTable.finalY || startY + 10;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`إجمالي السجلات: ${data.length}`, 15, finalY + 10);
  }

  // Save PDF
  pdf.save(filename);
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

export const generateInvoicePDF = ({
  invoice,
  shopName = 'Beauty Salon',
  shopPhone = '01234567890',
  shopAddress = 'Cairo, Egypt',
}: InvoicePDFOptions) => {
  const pdf = createPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(168, 85, 247);
  pdf.text(shopName, pageWidth / 2, 20, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(shopAddress, pageWidth / 2, 27, { align: 'center' });
  pdf.text(`Phone: ${shopPhone}`, pageWidth / 2, 32, { align: 'center' });

  // Invoice title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('INVOICE', pageWidth / 2, 45, { align: 'center' });

  // Invoice details
  pdf.setFontSize(11);
  pdf.text(`Invoice #: ${invoice.id}`, 15, 55);
  pdf.text(`Date: ${invoice.date}`, 15, 62);
  pdf.text(`Customer: ${invoice.customer}`, 15, 69);
  if (invoice.customerPhone) {
    pdf.text(`Phone: ${invoice.customerPhone}`, 15, 76);
  }

  // Items table
  let startY = invoice.customerPhone ? 85 : 78;
  
  if (invoice.items && invoice.items.length > 0) {
    const itemsData = invoice.items.map((item) => [
      item.name,
      item.quantity.toString(),
      `${item.price.toFixed(2)} EGP`,
      `${(item.quantity * item.price).toFixed(2)} EGP`,
    ]);

    autoTable(pdf, {
      head: [['Service/Product', 'Qty', 'Price', 'Total']],
      body: itemsData,
      startY: startY,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: 'center',
      },
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { right: 15, left: 15 },
    });

    startY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // Totals
  const subtotal = invoice.amount + (invoice.discount || 0);
  pdf.setFontSize(11);
  pdf.text(`Subtotal: ${subtotal.toFixed(2)} EGP`, pageWidth - 15, startY, {
    align: 'right',
  });
  
  if (invoice.discount && invoice.discount > 0) {
    pdf.text(
      `Discount: ${invoice.discount.toFixed(2)} EGP`,
      pageWidth - 15,
      startY + 7,
      { align: 'right' }
    );
  }

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  const totalY = invoice.discount ? startY + 14 : startY + 7;
  pdf.text(
    `Total: ${invoice.amount.toFixed(2)} EGP`,
    pageWidth - 15,
    totalY,
    { align: 'right' }
  );

  // Payment method
  if (invoice.paymentMethod) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(
      `Payment Method: ${invoice.paymentMethod}`,
      pageWidth - 15,
      totalY + 7,
      { align: 'right' }
    );
  }

  // Notes
  if (invoice.notes) {
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Notes: ${invoice.notes}`, 15, totalY + 15);
  }

  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(168, 85, 247);
  pdf.text('Thank you for your visit', pageWidth / 2, pdf.internal.pageSize.getHeight() - 20, {
    align: 'center',
  });

  // Save PDF
  pdf.save(`Invoice-${invoice.id}.pdf`);
};