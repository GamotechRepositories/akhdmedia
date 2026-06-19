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
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  const writeLines = (text, { size = 11, style = 'normal', color = [33, 37, 41], lineGap = 6 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), contentWidth);
    lines.forEach((line) => {
      y = ensureSpace(doc, y, margin, lineGap);
      doc.text(line, margin, y);
      y += lineGap;
    });
  };

  const writeHeading = (text, { size = 12, lineGap = 8 } = {}) => {
    y += 2;
    writeLines(text, { size, style: 'bold', lineGap });
  };

  const writeSubheading = (text, { size = 10, lineGap = 6 } = {}) => {
    writeLines(text, { size, style: 'bold', color: [55, 65, 81], lineGap });
  };

  const writeParagraph = (text, options = {}) => {
    writeLines(text, { size: 10, color: [55, 65, 81], lineGap: 5, ...options });
  };

  const writeBullets = (items, { size = 10, lineGap = 5 } = {}) => {
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 4);
      lines.forEach((line, index) => {
        y = ensureSpace(doc, y, margin, lineGap);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        doc.setTextColor(55, 65, 81);
        doc.text(line, margin + (index === 0 ? 0 : 4), y);
        y += lineGap;
      });
    });
  };

  const writeLicensePolicy = () => {
    doc.addPage();
    y = margin;

    const policy = {
      title: { size: 10, lineGap: 6 },
      heading: { size: 8.5, lineGap: 4.5 },
      sub: { size: 7.5, lineGap: 3.5 },
      body: { size: 7, lineGap: 3.5 },
      bullet: { size: 7, lineGap: 3.2 },
    };

    writeHeading('License and editorial policy — read carefully before use', {
      size: policy.title.size,
      lineGap: policy.title.lineGap,
    });

    writeHeading('1) Personal-Use Rights', policy.heading);
    writeParagraph('The buyer may use the content only for personal viewing or personal projects.', policy.body);

    writeSubheading('Allowed:', policy.sub);
    writeBullets(
      ['Download and watch the video.', 'Save the photos for personal collections.'],
      policy.bullet,
    );

    writeSubheading('Not allowed:', policy.sub);
    writeBullets(
      [
        'Re-sell the content.',
        'Upload it to YouTube, Instagram, or commercial websites.',
        'Use it in advertisements or business promotions.',
      ],
      policy.bullet,
    );

    writeHeading('2) Editorial / News-Use Rights', policy.heading);
    writeParagraph(
      'This is common for celebrity, paparazzi, and red-carpet content.',
      policy.body,
    );

    writeSubheading('Allowed:', policy.sub);
    writeBullets(
      [
        'Use in newspapers, magazines, blogs, news websites, and TV news.',
        'Use in articles discussing celebrities, events, entertainment, or current affairs.',
      ],
      policy.bullet,
    );

    writeSubheading('Not allowed:', policy.sub);
    writeBullets(
      [
        'Use in advertisements.',
        'Suggest that a celebrity endorses a product or service.',
        'Use for commercial marketing campaigns.',
      ],
      policy.bullet,
    );

    writeHeading('Use rights', policy.heading);
    writeParagraph(
      'The purchased photos and videos may be used for editorial, news-reporting, informational, commentary, entertainment-news, and media-publication purposes, including:',
      policy.body,
    );
    writeBullets(
      [
        'Newspapers',
        'Magazines',
        'News websites',
        'Entertainment websites',
        'Blogs',
        'Digital media platforms',
        'Social media channels',
        'YouTube news and commentary videos',
        'Television news broadcasts',
      ],
      policy.bullet,
    );

    writeSubheading('The content may not be used:', policy.sub);
    writeBullets(
      [
        'In advertisements or promotional campaigns.',
        'To endorse, promote, or market any product, service, company, brand, or organization.',
        'In a manner that suggests sponsorship, approval, endorsement, or affiliation by the celebrity featured in the content.',
        'On product packaging, merchandise, or commercial products.',
        'In paid advertising, sponsored content, or influencer marketing campaigns.',
        'In any unlawful, defamatory, misleading, or deceptive manner.',
      ],
      policy.bullet,
    );

    writeParagraph(
      `All copyright and ownership rights remain with ${brandName}. The purchaser receives a non-exclusive, non-transferable license to use the content solely for editorial and informational purposes.`,
      policy.body,
    );
    writeParagraph(
      'Any commercial advertising, brand endorsement, promotional, or merchandising use requires separate written permission and may require additional rights and clearances from the individuals depicted in the content.',
      policy.body,
    );
    writeParagraph(
      'Important: Celebrity images and videos may involve publicity and personality rights. Even if you own the copyright in the footage, commercial use may require additional permission from the celebrity or their representatives under Indian law.',
      { ...policy.body, style: 'bold' },
    );

    writeSubheading('What buyers can do:', policy.sub);
    writeBullets(
      [
        'Publish on news websites.',
        'Use in newspapers and magazines.',
        'Post on entertainment blogs.',
        'Use in editorial YouTube videos.',
        'Publish on social media pages for news, commentary, and entertainment reporting.',
        'Include in articles about celebrities, events, fashion, films, and public appearances.',
      ],
      policy.bullet,
    );

    writeSubheading('What buyers cannot do:', policy.sub);
    writeBullets(
      [
        'Use the content in advertisements.',
        'Promote a brand, product, or service.',
        'Claim celebrity endorsement.',
        'Use on product packaging or merchandise.',
        'Resell the original files.',
        'Transfer the license to another party without permission.',
      ],
      policy.bullet,
    );

    writeHeading('Copyright ownership', policy.heading);
    writeParagraph(
      `All copyrights and intellectual property rights in the content remain the property of ${brandName}. The purchaser receives only a limited license to use the content in accordance with this agreement.`,
      policy.body,
    );
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

  writeLicensePolicy();

  const footerY = doc.internal.pageSize.getHeight() - 10;
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`© ${new Date().getFullYear()} ${brandName}. All rights reserved.`, margin, footerY);
    if (pageCount > 1) {
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }
  }

  doc.save(`license-${orderNumber}.pdf`);
};
