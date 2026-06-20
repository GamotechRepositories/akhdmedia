import { BRAND } from '../config/brand';
import { CERT } from './licenseCertificateTheme';

const PAGE_MARGIN = 16;
const BODY_SIZE = 8;
const BODY_LINE = 3.8;
const BULLET_SIZE = 7.8;
const BULLET_LINE = 3.6;
const BULLET_INDENT = 5;

const writeAt = (doc, text, x, yPos, { size = 10, style = 'normal', color = CERT.body, align = 'left', font = 'helvetica' } = {}) => {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(text), x, yPos, { align });
};

const drawGoldFrame = (doc, pageWidth, pageHeight) => {
  doc.setDrawColor(...CERT.gold);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setFillColor(...CERT.gold);
  doc.rect(10, 10, pageWidth - 20, 1.2, 'F');
};

const drawPolicyPageHeader = (doc, pageWidth, brandName, isFirstPolicyPage = false) => {
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const headerH = isFirstPolicyPage ? 12 : 10;

  doc.setFillColor(...CERT.navy);
  doc.rect(PAGE_MARGIN, 14, contentWidth, headerH, 'F');
  doc.setFillColor(...CERT.gold);
  doc.rect(PAGE_MARGIN, 14 + headerH - 1, contentWidth, 1, 'F');

  writeAt(doc, 'License Agreement & Usage Policy', pageWidth / 2, 20, {
    size: 8.5,
    style: 'bold',
    color: CERT.white,
    align: 'center',
  });

  if (isFirstPolicyPage) {
    writeAt(doc, 'Attached to License Certificate', pageWidth / 2, 24, {
      size: 7,
      color: [200, 210, 225],
      align: 'center',
    });
    return 14 + headerH + 7;
  }

  return 14 + headerH + 5;
};

const getPageBottom = (pageHeight) => pageHeight - 18;

const ensureSpace = (doc, y, needed, pageWidth, pageHeight, brandName) => {
  if (y + needed <= getPageBottom(pageHeight)) return y;
  doc.addPage();
  drawGoldFrame(doc, pageWidth, pageHeight);
  return drawPolicyPageHeader(doc, pageWidth, brandName, false);
};

const renderParagraph = (doc, text, x, y, maxWidth, pageWidth, pageHeight, brandName) => {
  const lines = doc.splitTextToSize(text.replace(/\s+/g, ' ').trim(), maxWidth);
  let cursor = y;
  lines.forEach((line) => {
    cursor = ensureSpace(doc, cursor, BODY_LINE + 1, pageWidth, pageHeight, brandName);
    writeAt(doc, line, x, cursor, { size: BODY_SIZE, color: CERT.body });
    cursor += BODY_LINE;
  });
  return cursor + 2;
};

const renderBullets = (doc, items, x, y, maxWidth, pageWidth, pageHeight, brandName) => {
  let cursor = y;
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item.replace(/\s+/g, ' ').trim(), maxWidth - BULLET_INDENT);
    cursor = ensureSpace(doc, cursor, BULLET_LINE + 1, pageWidth, pageHeight, brandName);
    writeAt(doc, '•', x, cursor, { size: BULLET_SIZE, style: 'bold', color: CERT.navy });
    lines.forEach((line, index) => {
      if (index > 0) {
        cursor = ensureSpace(doc, cursor, BULLET_LINE + 1, pageWidth, pageHeight, brandName);
      }
      writeAt(doc, line, x + BULLET_INDENT, cursor, { size: BULLET_SIZE, color: CERT.body });
      cursor += BULLET_LINE;
    });
    cursor += 1;
  });
  return cursor + 1;
};

const renderDivider = (doc, x, y, width, pageWidth, pageHeight, brandName) => {
  let cursor = ensureSpace(doc, y, 6, pageWidth, pageHeight, brandName);
  doc.setDrawColor(...CERT.border);
  doc.setLineWidth(0.3);
  doc.line(x, cursor, x + width, cursor);
  return cursor + 5;
};

const LICENSE_POLICY_BLOCKS = [
  { type: 'h1', text: 'AKHD MEDIA & CO' },
  { type: 'h2', text: 'Editorial Content License Agreement & Usage Policy' },
  { type: 'h3', text: 'Copyright Notice' },
  {
    type: 'paragraph',
    text: 'All photographs, videos, and related media content ("Content") are the exclusive intellectual property of AKHD MEDIA & CO and are protected under applicable copyright laws. Purchase of any Content does not transfer ownership or copyright. The purchaser is granted only a limited, non-exclusive, non-transferable license to use the Content in accordance with the terms set forth below.',
  },
  { type: 'divider' },
  { type: 'h1', text: '1. Personal Use License' },
  {
    type: 'paragraph',
    text: 'Under the Personal Use License, the purchaser may use the Content solely for private, non-commercial purposes.',
  },
  { type: 'h3', text: 'Permitted Uses' },
  {
    type: 'bullets',
    items: [
      'Download and view the Content for personal enjoyment.',
      'Store the Content in personal archives or collections.',
      'Use the Content in private, non-commercial projects that are not publicly distributed or monetized.',
    ],
  },
  { type: 'h3', text: 'Prohibited Uses' },
  {
    type: 'bullets',
    items: [
      'Reselling, sublicensing, distributing, or sharing the Content with third parties.',
      'Uploading the Content to commercial platforms, websites, marketplaces, or media libraries.',
      'Using the Content for advertising, promotional, marketing, or business-related activities.',
      'Modifying the Content for commercial exploitation.',
      'Claiming ownership or authorship of the Content.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '2. Editorial Use License' },
  {
    type: 'paragraph',
    text: 'The Editorial Use License permits the use of Content for journalistic, informational, commentary, documentary, entertainment news, and reporting purposes only.',
  },
  { type: 'h3', text: 'Permitted Uses' },
  { type: 'paragraph', text: 'The Content may be published or displayed in:' },
  {
    type: 'bullets',
    items: [
      'Newspapers',
      'Magazines',
      'News portals and websites',
      'Entertainment and celebrity news platforms',
      'Editorial blogs',
      'Digital media publications',
      'Television news broadcasts',
      'Documentary productions',
      'Social media channels used for news, commentary, reporting, or informational purposes',
      'YouTube channels focused on news reporting, entertainment commentary, analysis, or public-interest reporting',
    ],
  },
  { type: 'h3', text: 'Examples of Acceptable Editorial Use' },
  {
    type: 'bullets',
    items: [
      'Reporting on celebrity appearances, public events, film promotions, fashion shows, entertainment industry developments, or current affairs.',
      'Publishing news articles, opinion pieces, reviews, commentary, and informational content.',
      'Creating editorial videos discussing public figures, entertainment news, or cultural events.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '3. Prohibited Commercial Uses' },
  {
    type: 'paragraph',
    text: 'Unless expressly authorized in writing by AKHD MEDIA & CO, the Content may not be used for any commercial, promotional, advertising, endorsement, or merchandising purpose.',
  },
  { type: 'h3', text: 'Strictly Prohibited Uses' },
  {
    type: 'bullets',
    items: [
      'Advertisements and advertising campaigns.',
      'Brand promotions and marketing materials.',
      'Sponsored content or paid promotional activities.',
      'Product packaging, labels, or retail displays.',
      'Merchandise of any kind.',
      'Corporate brochures, presentations, or promotional publications.',
      'Influencer marketing campaigns.',
      'Commercial social media advertisements.',
      'Any use implying endorsement, sponsorship, approval, partnership, or affiliation by the individuals depicted in the Content.',
      'Political campaigns or political advertising.',
      'Any unlawful, defamatory, misleading, deceptive, or offensive use.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '4. Celebrity Publicity & Personality Rights' },
  { type: 'paragraph', text: 'Certain Content may feature celebrities, public figures, performers, or other identifiable individuals.' },
  { type: 'paragraph', text: 'Purchasers acknowledge that:' },
  {
    type: 'bullets',
    items: [
      'Copyright ownership of the Content remains with AKHD MEDIA & CO.',
      'Separate publicity, personality, image, privacy, or likeness rights may exist in relation to individuals depicted in the Content.',
      'Commercial use of such Content may require additional permissions, licenses, releases, or clearances from the individuals concerned or their authorized representatives.',
      'AKHD MEDIA & CO does not grant any publicity, endorsement, personality, or trademark rights through this license.',
    ],
  },
  {
    type: 'paragraph',
    text: 'The purchaser assumes full responsibility for obtaining any additional permissions required for their intended use.',
  },
  { type: 'divider' },
  { type: 'h1', text: '5. License Restrictions' },
  { type: 'paragraph', text: 'The purchaser shall not:' },
  {
    type: 'bullets',
    items: [
      'Resell, redistribute, sublicense, assign, or transfer the licensed Content.',
      'Claim ownership of the Content.',
      'Remove copyright notices, watermarks, metadata, or attribution information.',
      'Use the Content in any manner that violates applicable laws or regulations.',
      'Use the Content in a way that harms the reputation of AKHD MEDIA & CO or the individuals depicted.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '6. Copyright Ownership' },
  {
    type: 'paragraph',
    text: 'All copyrights, intellectual property rights, neighboring rights, and related interests in the Content shall remain the sole and exclusive property of AKHD MEDIA & CO.',
  },
  {
    type: 'paragraph',
    text: 'No ownership rights are transferred under this agreement. The purchaser receives only a limited license to use the Content subject to the terms and restrictions contained herein.',
  },
  { type: 'divider' },
  { type: 'h1', text: '7. Commercial Licensing' },
  { type: 'paragraph', text: 'Any use of the Content for:' },
  {
    type: 'bullets',
    items: [
      'Advertising',
      'Marketing',
      'Brand Promotion',
      'Sponsorship Campaigns',
      'Product Endorsements',
      'Merchandise',
      'Corporate Communications',
      'Commercial Productions',
    ],
  },
  {
    type: 'paragraph',
    text: 'requires prior written authorization from AKHD MEDIA & CO and may be subject to additional licensing fees, talent clearances, publicity rights, and legal approvals.',
  },
  {
    type: 'paragraph',
    text: 'For commercial licensing inquiries, please contact AKHD MEDIA & CO directly.',
  },
  { type: 'divider' },
  { type: 'h1', text: '8. Limitation of Liability' },
  {
    type: 'paragraph',
    text: 'AKHD MEDIA & CO shall not be liable for any claims, damages, losses, or expenses arising from unauthorized use of the Content or failure by the purchaser to obtain necessary third-party permissions, releases, or clearances.',
  },
  {
    type: 'paragraph',
    text: 'The purchaser assumes full responsibility for ensuring that their use of the Content complies with all applicable laws and regulations.',
  },
  { type: 'divider' },
  { type: 'h1', text: 'Acceptance of Terms' },
  {
    type: 'paragraph',
    text: 'By purchasing, downloading, accessing, or using any Content supplied by AKHD MEDIA & CO, the purchaser acknowledges that they have read, understood, and agreed to be bound by the terms of this Editorial Content License Agreement and Usage Policy.',
  },
];

const replaceBrand = (text, brandName) =>
  String(text).replace(/AKHD MEDIA & CO/g, brandName);

export const appendLicensePolicyPages = (doc, brandName = BRAND.name) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  doc.addPage();
  drawGoldFrame(doc, pageWidth, pageHeight);
  let y = drawPolicyPageHeader(doc, pageWidth, brandName, true);

  LICENSE_POLICY_BLOCKS.forEach((block) => {
    if (block.type === 'h1') {
      y = ensureSpace(doc, y, 8, pageWidth, pageHeight, brandName);
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 10,
        style: 'bold',
        color: CERT.navy,
      });
      y += 6;
      return;
    }

    if (block.type === 'h2') {
      y = ensureSpace(doc, y, 7, pageWidth, pageHeight, brandName);
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 9.5,
        style: 'bold',
        color: CERT.navyDark,
      });
      y += 5.5;
      return;
    }

    if (block.type === 'h3') {
      y = ensureSpace(doc, y, 6, pageWidth, pageHeight, brandName);
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 8.5,
        style: 'bold',
        color: CERT.navy,
      });
      y += 5;
      return;
    }

    if (block.type === 'paragraph') {
      y = renderParagraph(
        doc,
        replaceBrand(block.text, brandName),
        PAGE_MARGIN,
        y,
        contentWidth,
        pageWidth,
        pageHeight,
        brandName,
      );
      return;
    }

    if (block.type === 'bullets') {
      y = renderBullets(
        doc,
        block.items.map((item) => replaceBrand(item, brandName)),
        PAGE_MARGIN,
        y,
        contentWidth,
        pageWidth,
        pageHeight,
        brandName,
      );
      return;
    }

    if (block.type === 'divider') {
      y = renderDivider(doc, PAGE_MARGIN, y, contentWidth, pageWidth, pageHeight, brandName);
    }
  });
};
