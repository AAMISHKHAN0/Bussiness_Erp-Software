import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Enterprise PDF Generator for Invoices
 * @param {Object} invoice - The invoice data object
 */
export const generateInvoicePDF = (invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header (Company Info)
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('ERP SYSTEM', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('123 Business Avenue, Suite 100', 20, 32);
    doc.text('New York, NY 10001', 20, 37);
    doc.text('Phone: +1 (555) 123-4567', 20, 42);
    doc.text('Email: billing@erp-system.com', 20, 47);

    // 2. Invoice Label
    doc.setFontSize(30);
    doc.setTextColor(79, 70, 229); // Primary Indigo color
    doc.text('INVOICE', pageWidth - 20, 35, { align: 'right' });

    // 3. Horizontal Line
    doc.setDrawColor(243, 244, 246);
    doc.line(20, 55, pageWidth - 20, 55);

    // 4. Bill To / Invoice Details
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('BILL TO:', 20, 70);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer_name || 'Guest Customer', 20, 78);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Tax ID: ${invoice.tax_id || 'N/A'}`, 20, 85);
    doc.text(`Email: ${invoice.customer_email || '-'}`, 20, 90);

    // Invoice Meta
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text('Invoice Number:', pageWidth - 80, 70);
    doc.text('Date Issued:', pageWidth - 80, 77);
    doc.text('Due Date:', pageWidth - 80, 84);
    doc.text('Status:', pageWidth - 80, 91);

    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_number, pageWidth - 20, 70, { align: 'right' });
    doc.text(new Date(invoice.created_at).toLocaleDateString(), pageWidth - 20, 77, { align: 'right' });
    doc.text(new Date(invoice.due_date || invoice.created_at).toLocaleDateString(), pageWidth - 20, 84, { align: 'right' });
    doc.text(invoice.status?.toUpperCase() || 'UNPAID', pageWidth - 20, 91, { align: 'right' });

    // 5. Items Table
    const tableData = invoice.items?.map(item => [
        item.product_name,
        `$${parseFloat(item.unit_price).toFixed(2)}`,
        item.quantity,
        `$${(item.unit_price * item.quantity).toFixed(2)}`
    ]) || [
            ['Main Service / Product', `$${parseFloat(invoice.grand_total).toFixed(2)}`, '1', `$${parseFloat(invoice.grand_total).toFixed(2)}`]
        ];

    doc.autoTable({
        startY: 110,
        head: [['Description', 'Price', 'Qty', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 10, cellPadding: 5 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'center' },
            3: { halign: 'right' }
        }
    });

    // 6. Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Subtotal:', pageWidth - 80, finalY);
    doc.text('Tax (0%):', pageWidth - 80, finalY + 7);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - 80, finalY + 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${parseFloat(invoice.grand_total).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
    doc.text('$0.00', pageWidth - 20, finalY + 7, { align: 'right' });

    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${parseFloat(invoice.grand_total).toFixed(2)}`, pageWidth - 20, finalY + 18, { align: 'right' });

    // 7. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // 8. Save
    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};
