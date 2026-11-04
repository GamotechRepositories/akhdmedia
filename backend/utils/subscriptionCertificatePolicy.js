import { BRAND } from '../config/brand.js'
import { CERT } from './licenseCertificateTheme.js'

const PAGE_MARGIN = 16
const BODY_SIZE = 8
const BODY_LINE = 3.8
const BULLET_SIZE = 7.8
const BULLET_LINE = 3.6
const BULLET_INDENT = 5

const writeAt = (doc, text, x, yPos, { size = 10, style = 'normal', color = CERT.body, align = 'left', font = 'helvetica' } = {}) => {
  doc.setFont(font, style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
  doc.text(String(text), x, yPos, { align })
}

const drawGoldFrame = (doc, pageWidth, pageHeight) => {
  doc.setDrawColor(...CERT.gold)
  doc.setLineWidth(0.8)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
  doc.setFillColor(...CERT.gold)
  doc.rect(10, 10, pageWidth - 20, 1.2, 'F')
}

const drawPolicyPageHeader = (doc, pageWidth, brandName, isFirstPolicyPage = false) => {
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const headerH = isFirstPolicyPage ? 12 : 10

  doc.setFillColor(...CERT.navy)
  doc.rect(PAGE_MARGIN, 14, contentWidth, headerH, 'F')
  doc.setFillColor(...CERT.gold)
  doc.rect(PAGE_MARGIN, 14 + headerH - 1, contentWidth, 1, 'F')

  writeAt(doc, 'Subscription Terms & Editorial Content Usage Policy', pageWidth / 2, 20, {
    size: 8.5,
    style: 'bold',
    color: CERT.white,
    align: 'center',
  })

  if (isFirstPolicyPage) {
    writeAt(doc, 'Attached to Subscription Tax Invoice & License Certificate', pageWidth / 2, 24, {
      size: 7,
      color: [200, 210, 225],
      align: 'center',
    })
    return 14 + headerH + 7
  }

  return 14 + headerH + 5
}

const getPageBottom = (pageHeight) => pageHeight - 18

const ensureSpace = (doc, y, needed, pageWidth, pageHeight, brandName) => {
  if (y + needed <= getPageBottom(pageHeight)) return y
  doc.addPage()
  drawGoldFrame(doc, pageWidth, pageHeight)
  return drawPolicyPageHeader(doc, pageWidth, brandName, false)
}

const renderParagraph = (doc, text, x, y, maxWidth, pageWidth, pageHeight, brandName) => {
  const lines = doc.splitTextToSize(text.replace(/\s+/g, ' ').trim(), maxWidth)
  let cursor = y
  lines.forEach((line) => {
    cursor = ensureSpace(doc, cursor, BODY_LINE + 1, pageWidth, pageHeight, brandName)
    writeAt(doc, line, x, cursor, { size: BODY_SIZE, color: CERT.body })
    cursor += BODY_LINE
  })
  return cursor + 2
}

const renderBullets = (doc, items, x, y, maxWidth, pageWidth, pageHeight, brandName) => {
  let cursor = y
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item.replace(/\s+/g, ' ').trim(), maxWidth - BULLET_INDENT)
    cursor = ensureSpace(doc, cursor, BULLET_LINE + 1, pageWidth, pageHeight, brandName)
    writeAt(doc, '•', x, cursor, { size: BULLET_SIZE, style: 'bold', color: CERT.navy })
    lines.forEach((line, index) => {
      if (index > 0) {
        cursor = ensureSpace(doc, cursor, BULLET_LINE + 1, pageWidth, pageHeight, brandName)
      }
      writeAt(doc, line, x + BULLET_INDENT, cursor, { size: BULLET_SIZE, color: CERT.body })
      cursor += BULLET_LINE
    })
    cursor += 1
  })
  return cursor + 1
}

const renderDivider = (doc, x, y, width, pageWidth, pageHeight, brandName) => {
  let cursor = ensureSpace(doc, y, 6, pageWidth, pageHeight, brandName)
  doc.setDrawColor(...CERT.border)
  doc.setLineWidth(0.3)
  doc.line(x, cursor, x + width, cursor)
  return cursor + 5
}

const SUBSCRIPTION_POLICY_BLOCKS = [
  { type: 'h1', text: 'AKHD MEDIA & CO' },
  { type: 'h2', text: 'Subscription Terms & Editorial Content Usage Policy' },
  { type: 'h3', text: 'Preamble & Effective Terms' },
  {
    type: 'paragraph',
    text: 'AKHD Media & Co. provides premium editorial video content to media professionals, digital publishers, news channels, and content creators. Our subscription memberships are designed to provide lawful access to high-resolution editorial footage, including celebrity appearances, red carpet events, paparazzi coverage, airport sightings, fashion events, press conferences, and entertainment activities. By purchasing a subscription, the subscriber agrees to all terms set forth below.',
  },
  { type: 'divider' },
  { type: 'h1', text: '1. Subscription Overview & Quotas' },
  {
    type: 'paragraph',
    text: 'AKHD Media & Co. subscription plans provide continuous access to licensed editorial video footage. Subscribers are entitled to daily media updates and website video download credits as defined in their plan (e.g. 20 to 250 videos per cycle).',
  },
  {
    type: 'bullets',
    items: [
      'Subscribers gain access to high-definition and 4K-UHD master footage for editorial production.',
      'Subscription access is personal to the subscribing individual or media organization and cannot be shared across unauthorized third parties.',
      'Active subscription status must be maintained to download footage from the website quota.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '2. Subscription Activation & Dedicated Delivery' },
  {
    type: 'paragraph',
    text: 'Upon payment confirmation, subscription processing commences immediately:',
  },
  {
    type: 'bullets',
    items: [
      'A dedicated WhatsApp broadcast group is initiated within 6 hours of payment confirmation using the subscriber\'s provided WhatsApp mobile number.',
      'Subscribers are responsible for providing an active, valid WhatsApp mobile number during checkout.',
      'Website quota download credits are credited to the user account immediately upon payment verification.',
      'Master video links are delivered securely via email and WhatsApp for high-speed editorial turnaround.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '3. Scope of Daily Editorial Coverage' },
  {
    type: 'paragraph',
    text: 'The editorial footage provided throughout the subscription encompasses:',
  },
  {
    type: 'bullets',
    items: [
      'Celebrity Spotting & Paparazzi Videos',
      'Airport Arrival & Departure Footage',
      'Red Carpet Events, Film Premieres & Award Shows',
      'Fashion Shows, Designer Showcases & Runway Events',
      'Press Conferences, Media Briefings & Celebrity Interviews',
      'Celebrity Public Appearances, Festivals & Cultural Events',
      'Entertainment & Media Event Broadcast Coverage',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '4. Editorial Use Only (Strict License Scope)' },
  {
    type: 'paragraph',
    text: 'ALL FOOTAGE AND CONTENT PROVIDED UNDER THE SUBSCRIPTION IS LICENSED STRICTLY FOR EDITORIAL USE ONLY. Permitted editorial purposes include:',
  },
  {
    type: 'bullets',
    items: [
      'News reporting in print, digital, and broadcast television media.',
      'Digital news websites, entertainment portals, and media publications.',
      'Television news broadcasts, cable networks, and journalistic programs.',
      'Documentary productions and public-interest commentary films.',
      'Editorial social media channels and YouTube news/entertainment commentary channels.',
      'Informational, critical, educational, and public commentary publications.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '5. Prohibited Commercial Uses' },
  {
    type: 'paragraph',
    text: 'The following commercial and advertising uses are STRICTLY PROHIBITED unless separately authorized in writing by AKHD Media & Co. and the respective personality rights holders:',
  },
  {
    type: 'bullets',
    items: [
      'Commercial advertising, paid promotions, brand advertisements, or TV commercials.',
      'Commercial brand marketing campaigns, billboards, and corporate promos.',
      'Product endorsements implying celebrity sponsorship, partnership, or brand affiliation.',
      'Selling merchandise featuring personalities from the footage without explicit authorization.',
      'Any non-editorial commercial branding, promotional video, or sponsored business marketing.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '6. Copyright & Intellectual Property Protection' },
  {
    type: 'paragraph',
    text: 'All videos, master footage, raw files, and related media content remain the exclusive intellectual property of AKHD Media & Co. and are protected under Indian and international copyright laws.',
  },
  {
    type: 'bullets',
    items: [
      'A subscription grants a limited, non-exclusive editorial usage license. It does NOT transfer ownership or copyright.',
      'Subscribers are strictly prohibited from reselling, licensing, distributing, or sublicensing the footage to third parties.',
      'Uploading footage to third-party stock video websites, libraries, or marketplaces is strictly forbidden.',
      'Watermarks and copyright identifiers on preview files must not be altered, removed, or obfuscated.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '7. Subscription Duration & AutoPay Renewal' },
  {
    type: 'bullets',
    items: [
      'Each subscription is valid for the duration selected at purchase (30 days for Monthly, 365 days for Yearly).',
      'Where recurring payment (AutoPay) is active, subscriptions renew automatically at each cycle end unless cancelled before the renewal date.',
      'Subscribers may manage or cancel active renewals at any time via their profile settings without cancellation fees.',
      'Download credits expire at the end of the subscription period unless the membership is renewed.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '8. Payment, Non-Refundable Nature & Digital Delivery' },
  {
    type: 'bullets',
    items: [
      'All payments are processed securely via authorized payment gateways (Razorpay, PayPal).',
      'Due to the digital nature of immediate video access, subscription fees are non-refundable once content delivery and WhatsApp setup have commenced.',
      'Billing queries must be reported to AKHD Media & Co. within 48 hours of payment for resolution.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '9. Subscriber Responsibilities' },
  {
    type: 'bullets',
    items: [
      'Subscribers agree to provide truthful identity, email, and WhatsApp contact information.',
      'Subscribers must maintain strict confidentiality of their account credentials and download tokens.',
      'Subscribers are solely responsible for ensuring their publication complies with all applicable privacy, defamation, and media laws.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '10. Suspension, Termination & Legal Action' },
  {
    type: 'bullets',
    items: [
      'AKHD Media & Co. reserves the right to immediately suspend or terminate subscription access without refund if a subscriber engages in copyright infringement, unauthorized reselling, or prohibited commercial usage.',
      'In cases of severe breach, AKHD Media & Co. will pursue statutory copyright remedies and legal claims in appropriate judicial jurisdictions.',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '11. Official Contact & Verification' },
  {
    type: 'paragraph',
    text: 'For licensing inquiries, editorial rights clarification, WhatsApp delivery support, or invoice queries, contact AKHD Media & Co.:',
  },
  {
    type: 'bullets',
    items: [
      'Licensor: AKHD Media & Co.',
      `GSTIN: ${BRAND.gstNumber}`,
      `Address: ${BRAND.companyAddress}`,
      'Email: support@akhdmedia.com / admin@akhdmedia.com',
      'Official Portal: https://www.akhdmedia.com',
    ],
  },
  { type: 'divider' },
  { type: 'h1', text: '12. Acceptance & Legal Validity' },
  {
    type: 'paragraph',
    text: 'Payment of the subscription fee and downloading of any licensed assets constitutes full and unconditional acceptance of this Subscription Terms & Editorial Content Usage Policy. This document serves as legal proof of licensed editorial membership.',
  },
]

const replaceBrand = (text, brandName) => text.replace(/AKHD Media & Co\./g, brandName).replace(/AKHD MEDIA & CO/g, brandName.toUpperCase())

export const appendSubscriptionPolicyPages = (doc, brandName) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - PAGE_MARGIN * 2

  doc.addPage()
  drawGoldFrame(doc, pageWidth, pageHeight)
  let y = drawPolicyPageHeader(doc, pageWidth, brandName, true)

  SUBSCRIPTION_POLICY_BLOCKS.forEach((block) => {
    if (block.type === 'h1') {
      y = ensureSpace(doc, y, 9, pageWidth, pageHeight, brandName)
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 10,
        style: 'bold',
        color: CERT.navy,
      })
      y += 6
      return
    }

    if (block.type === 'h2') {
      y = ensureSpace(doc, y, 7, pageWidth, pageHeight, brandName)
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 9.5,
        style: 'bold',
        color: CERT.navyDark,
      })
      y += 5.5
      return
    }

    if (block.type === 'h3') {
      y = ensureSpace(doc, y, 6, pageWidth, pageHeight, brandName)
      writeAt(doc, replaceBrand(block.text, brandName), PAGE_MARGIN, y, {
        size: 8.5,
        style: 'bold',
        color: CERT.navy,
      })
      y += 5
      return
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
      )
      return
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
      )
      return
    }

    if (block.type === 'divider') {
      y = renderDivider(doc, PAGE_MARGIN, y, contentWidth, pageWidth, pageHeight, brandName)
    }
  })
}

