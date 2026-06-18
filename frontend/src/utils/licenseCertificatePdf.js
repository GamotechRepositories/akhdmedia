import { jsPDF } from 'jspdf';

const ensureSpace = (doc, y, margin, needed = 12) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return y;
};

export const downloadLicenseCertificatePdf = ({
  brandName,
  orderNumber,
  orderDateLabel,
  customerName,
  customerEmail,
  subtotalLabel,
  gstLabel,
  orderTotalLabel,
  orderItems = [],
}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  const writeLines = (text, { size = 11, style = 'normal', color = [33, 37, 41], lineGap = 6 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2);
    lines.forEach((line) => {
      y = ensureSpace(doc, y, margin, lineGap);
      doc.text(line, margin, y);
      y += lineGap;
    });
  };

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(brandName, margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('LICENSE CERTIFICATE', margin, 30);

  y = 58;
  writeLines('License Issued', { size: 18, style: 'bold', lineGap: 9 });
  writeLines(`Order #${orderNumber}`, { size: 12, color: [75, 85, 99], lineGap: 10 });

  writeLines('PURCHASE DETAILS', { size: 10, style: 'bold', color: [107, 114, 128], lineGap: 7 });
  writeLines(`Date: ${orderDateLabel}`);
  writeLines(`Licensed to: ${customerName || '—'}`);
  writeLines(`Email: ${customerEmail || '—'}`);
  writeLines(`Subtotal: ${subtotalLabel}`);
  writeLines(`GST: ${gstLabel}`);
  writeLines(`Total paid: ${orderTotalLabel}`);
  y += 4;

  writeLines('LICENSED CONTENT', { size: 10, style: 'bold', color: [107, 114, 128], lineGap: 7 });

  orderItems.forEach((item, index) => {
    y += 2;
    writeLines(`${index + 1}. ${item.name}`, { style: 'bold', lineGap: 6 });
    writeLines(`Clip ID: ${item.clipId || '—'}`, { size: 10, lineGap: 5 });
    writeLines(`License tier: ${item.imageSize || 'Standard'}`, { size: 10, lineGap: 5 });
    writeLines(`License No: ${item.licenseNumber || '—'}`, { size: 10, lineGap: 8 });
  });

  y += 4;
  writeLines(
    'This certificate confirms your purchase and license rights. Video download links are sent to your email only.',
    { size: 10, color: [75, 85, 99], lineGap: 6 },
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`© ${new Date().getFullYear()} ${brandName}. All rights reserved.`, margin, 287);

  doc.save(`license-${orderNumber}.pdf`);
};
