import jsPDF from 'jspdf';
import { QuotationLineItem } from '@/types';

// Company details configuration
const COMPANY = {
  name: 'Zen Engineering Solutions',
  tagline: 'Industrial Automation & Safety Solutions',
  address: 'Flat No. 001, Shree Ram Siddhi Apartment, 100 Feet Rd, Near Chetna Petrol Pump, Sangli - 416416, Maharashtra, India',
  phone: '9673727173',
  email: 'darshan@zenengineerings.com',
  gstin: '27AACFZ8216H1ZX',
};

// Terms and conditions
const TERMS = [
  { title: 'Payment Terms', text: '1) 50% advance along with PO. 2) 30% before material dispatch. 3) 15% against running bill. 4) 5% after completion of job within 7 working days.' },
  { title: 'Delivery Time', text: 'As discussed in the proposal or within mutually agreed timelines from receipt of confirmed purchase order and advance payment.' },
  { title: 'Transportation', text: 'Inclusive unless otherwise specified in the quotation.' },
  { title: 'Packing', text: 'Standard packing included.' },
  { title: 'Unloading / Handling', text: 'In client scope unless specifically mentioned.' },
  { title: 'Price Validity', text: '30 days from the date of quotation unless revised in writing.' },
  { title: 'Supply of Material', text: 'As per standard manufacturer packing and specifications.' },
  { title: 'Jurisdiction', text: 'All disputes subject to Sangli jurisdiction.' },
  { title: 'Statutory Variations', text: "Any change in duties / taxes / levies or new impositions by Central / State authorities will be to client's account." },
  { title: 'Scaffolding / Labour Accommodation', text: 'In client scope, wherever required.' },
  { title: 'Return Policy', text: 'Goods once sold will not be taken back.' },
];

interface QuotationData {
  id: string;
  quotation_number: string;
  client?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
  } | null;
  project_title?: string;
  project_description?: string;
  line_items: unknown;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until?: string;
  notes?: string;
  created_at: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', 'Rs. ');
};

const formatCurrencyShort = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

export const generateQuotationPdf = async (quotation: QuotationData): Promise<jsPDF> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const lineItems = (quotation.line_items as unknown as QuotationLineItem[]) || [];

  // Helper functions
  const checkPageBreak = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, width = 0.2) => {
    pdf.setLineWidth(width);
    pdf.line(x1, y1, x2, y2);
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, fill = false) => {
    if (fill) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, yPos, w, h, 'F');
    }
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.2);
    pdf.rect(x, yPos, w, h);
  };

  // ===== HEADER SECTION WITH LOGO =====
  const logoSize = 20; // Logo size in mm
  const logoX = margin;
  const logoY = y;

  // Add logo (load as base64)
  try {
    const logoBase64 = await loadImageAsBase64('/zen-logo.png');
    pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
  } catch (error) {
    console.error('Failed to add logo to PDF', error);
    // Continue without logo if it fails
  }

  // Company details next to logo (left-aligned)
  const textX = logoX + logoSize + 4; // Start text 4mm after logo
  let textY = logoY + 6; // Vertically center with logo

  // Company Name
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(COMPANY.name, textX, textY);

  // Address
  textY += 5;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  const addressLines = pdf.splitTextToSize(COMPANY.address, contentWidth - logoSize - 4);
  addressLines.forEach((line: string) => {
    pdf.text(line, textX, textY);
    textY += 2.8;
  });

  // Contact info
  textY += 0.5;
  pdf.text(`Contact No: ${COMPANY.phone} | Email: ${COMPANY.email}`, textX, textY);

  // GSTIN
  textY += 3.5;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`GSTIN: ${COMPANY.gstin}`, textX, textY);

  // Move y position down past the header
  y = Math.max(logoY + logoSize, textY) + 3;

  // Draw line separator below header
  drawLine(margin, y, margin + contentWidth, y, 0.5);
  y += 5;

  // ===== QUOTATION TITLE =====
  drawRect(margin, y, contentWidth, 8, true);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QUOTATION', pageWidth / 2, y + 5.5, { align: 'center' });
  y += 12;

  // ===== CLIENT & QUOTATION INFO =====
  const infoStartY = y;
  const leftColWidth = contentWidth * 0.55;
  const rowHeight = 5;

  // Left column - Client details
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');

  const clientInfo = [
    { label: "Client's Name", value: quotation.client?.name || '-' },
    { label: 'Address', value: quotation.client?.address || '-' },
    { label: 'City/State', value: [quotation.client?.city, quotation.client?.state].filter(Boolean).join(', ') || '-' },
    { label: 'Contact Person', value: quotation.client?.name || '-' },
    { label: 'Phone No.', value: quotation.client?.phone || '-' },
    { label: 'Email Id', value: quotation.client?.email || '-' },
    { label: 'GSTIN', value: quotation.client?.tax_id || '-' },
  ];

  let infoY = infoStartY;
  clientInfo.forEach((info) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${info.label}`, margin, infoY + 3.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`: ${info.value}`, margin + 28, infoY + 3.5);
    infoY += rowHeight;
  });

  // Right column - Quotation details
  const quotationInfo = [
    { label: 'Quotation No', value: quotation.quotation_number },
    { label: 'Date', value: formatDate(quotation.created_at) },
    { label: 'Valid Until', value: quotation.valid_until ? formatDate(quotation.valid_until) : '30 days' },
    { label: 'Project Name', value: quotation.project_title || '-' },
  ];

  infoY = infoStartY;
  const rightColX = margin + leftColWidth;
  quotationInfo.forEach((info) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${info.label}`, rightColX, infoY + 3.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`: ${info.value}`, rightColX + 25, infoY + 3.5);
    infoY += rowHeight;
  });

  y = Math.max(infoStartY + clientInfo.length * rowHeight, infoStartY + quotationInfo.length * rowHeight) + 5;

  // Reference text
  if (quotation.project_description) {
    checkPageBreak(15);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(`Reference: ${quotation.project_description}`, contentWidth);
    pdf.text(descLines, margin, y);
    y += descLines.length * 4 + 3;
  }

  // ===== LINE ITEMS TABLE =====
  checkPageBreak(30);

  // Table configuration
  const colWidths = {
    sr: 10,
    description: contentWidth - 10 - 15 - 20 - 25 - 20 - 25 - 25,
    unit: 15,
    qty: 20,
    rate: 25,
    taxPercent: 20,
    taxAmount: 25,
    amount: 25,
  };

  const tableX = margin;
  const headerHeight = 10;

  // Draw header
  drawRect(tableX, y, contentWidth, headerHeight, true);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');

  let colX = tableX;
  const headers = [
    { text: 'Sr.', width: colWidths.sr, align: 'center' as const },
    { text: 'Material Description', width: colWidths.description, align: 'left' as const },
    { text: 'Unit', width: colWidths.unit, align: 'center' as const },
    { text: 'Qty', width: colWidths.qty, align: 'center' as const },
    { text: 'Rate', width: colWidths.rate, align: 'right' as const },
    { text: 'Tax %', width: colWidths.taxPercent, align: 'center' as const },
    { text: 'Tax Amt', width: colWidths.taxAmount, align: 'right' as const },
    { text: 'Amount', width: colWidths.amount, align: 'right' as const },
  ];

  headers.forEach((header) => {
    const textX = header.align === 'center' ? colX + header.width / 2 :
      header.align === 'right' ? colX + header.width - 2 : colX + 2;
    pdf.text(header.text, textX, y + 6.5, { align: header.align });
    drawLine(colX + header.width, y, colX + header.width, y + headerHeight);
    colX += header.width;
  });

  y += headerHeight;

  // Draw line items
  pdf.setFont('helvetica', 'normal');
  const taxRate = quotation.tax_rate || 0;

  lineItems.forEach((item, index) => {
    // Calculate row height based on description length
    const descText = item.name || item.description || `Item ${index + 1}`;
    const descLines = pdf.splitTextToSize(descText, colWidths.description - 4);
    const notesLines = item.notes ? pdf.splitTextToSize(item.notes, colWidths.description - 4) : [];
    const totalLines = descLines.length + notesLines.length;
    const itemRowHeight = Math.max(8, totalLines * 3.5 + 4);

    checkPageBreak(itemRowHeight);

    // Draw row border
    drawRect(tableX, y, contentWidth, itemRowHeight);

    colX = tableX;

    // Sr. No
    pdf.text(`${index + 1}`, colX + colWidths.sr / 2, y + 5, { align: 'center' });
    drawLine(colX + colWidths.sr, y, colX + colWidths.sr, y + itemRowHeight);
    colX += colWidths.sr;

    // Description
    pdf.setFontSize(7);
    let descY = y + 4;
    descLines.forEach((line: string) => {
      pdf.text(line, colX + 2, descY);
      descY += 3.2;
    });
    if (notesLines.length > 0) {
      pdf.setTextColor(100);
      notesLines.forEach((line: string) => {
        pdf.text(line, colX + 2, descY);
        descY += 3.2;
      });
      pdf.setTextColor(0);
    }
    pdf.setFontSize(8);
    drawLine(colX + colWidths.description, y, colX + colWidths.description, y + itemRowHeight);
    colX += colWidths.description;

    // Unit
    pdf.text(item.unit || 'Nos', colX + colWidths.unit / 2, y + 5, { align: 'center' });
    drawLine(colX + colWidths.unit, y, colX + colWidths.unit, y + itemRowHeight);
    colX += colWidths.unit;

    // Qty
    pdf.text(`${item.quantity}`, colX + colWidths.qty / 2, y + 5, { align: 'center' });
    drawLine(colX + colWidths.qty, y, colX + colWidths.qty, y + itemRowHeight);
    colX += colWidths.qty;

    // Rate
    pdf.text(formatCurrencyShort(item.unit_price), colX + colWidths.rate - 2, y + 5, { align: 'right' });
    drawLine(colX + colWidths.rate, y, colX + colWidths.rate, y + itemRowHeight);
    colX += colWidths.rate;

    // Tax %
    pdf.text(`${taxRate}%`, colX + colWidths.taxPercent / 2, y + 5, { align: 'center' });
    drawLine(colX + colWidths.taxPercent, y, colX + colWidths.taxPercent, y + itemRowHeight);
    colX += colWidths.taxPercent;

    // Tax Amount
    pdf.text('-', colX + colWidths.taxAmount / 2, y + 5, { align: 'center' });
    drawLine(colX + colWidths.taxAmount, y, colX + colWidths.taxAmount, y + itemRowHeight);
    colX += colWidths.taxAmount;

    // Amount
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrencyShort(item.total), colX + colWidths.amount - 2, y + 5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    y += itemRowHeight;
  });

  // ===== TOTALS SECTION =====
  checkPageBreak(25);

  const totalsWidth = 80;
  const totalsX = margin + contentWidth - totalsWidth;
  const totalsRowHeight = 6;

  y += 2;

  // Subtotal
  drawRect(totalsX, y, totalsWidth, totalsRowHeight);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', totalsX + 2, y + 4);
  pdf.text(formatCurrency(quotation.subtotal), totalsX + totalsWidth - 2, y + 4, { align: 'right' });
  y += totalsRowHeight;

  // Tax
  drawRect(totalsX, y, totalsWidth, totalsRowHeight);
  pdf.text(`Tax (${quotation.tax_rate}%)`, totalsX + 2, y + 4);
  pdf.text(formatCurrency(quotation.tax_amount), totalsX + totalsWidth - 2, y + 4, { align: 'right' });
  y += totalsRowHeight;

  // Grand Total
  drawRect(totalsX, y, totalsWidth, totalsRowHeight + 2, true);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Grand Total', totalsX + 2, y + 5);
  pdf.text(formatCurrency(quotation.total), totalsX + totalsWidth - 2, y + 5, { align: 'right' });
  y += totalsRowHeight + 6;

  // ===== TERMS & CONDITIONS =====
  checkPageBreak(40);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TERMS & CONDITIONS', margin, y);
  y += 5;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');

  TERMS.forEach((term, index) => {
    const termText = `${index + 1}. ${term.title}: ${term.text}`;
    const termLines = pdf.splitTextToSize(termText, contentWidth);

    checkPageBreak(termLines.length * 3.5 + 2);

    termLines.forEach((line: string, lineIndex: number) => {
      pdf.text(line, margin + (lineIndex === 0 ? 0 : 3), y);
      y += 3.2;
    });
    y += 1;
  });

  // ===== NOTES =====
  if (quotation.notes) {
    checkPageBreak(15);
    y += 3;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Special Notes:', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    const notesLines = pdf.splitTextToSize(quotation.notes, contentWidth);
    notesLines.forEach((line: string) => {
      checkPageBreak(5);
      pdf.text(line, margin, y);
      y += 3.5;
    });
  }

  // ===== FOOTER =====
  checkPageBreak(30);
  y += 8;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Thank you for the opportunity to submit this quotation.', margin, y);
  y += 4;
  pdf.text('Kindly sign and return a copy of this document along with your purchase order as acceptance of the above terms.', margin, y);
  y += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text(`For ${COMPANY.name}`, margin + contentWidth - 50, y);
  y += 20;

  drawLine(margin + contentWidth - 60, y, margin + contentWidth, y);
  y += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Authorised Signatory', margin + contentWidth - 40, y);

  return pdf;
};

export { COMPANY, TERMS, formatCurrency, formatCurrencyShort, formatDate };
