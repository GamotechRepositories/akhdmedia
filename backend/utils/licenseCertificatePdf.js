import { jsPDF } from 'jspdf'
import { BRAND } from '../config/brand.js'
import { CERT } from './licenseCertificateTheme.js'
import { appendLicensePolicyPages } from './licenseCertificatePolicy.js'

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

const drawNavyHeader = (doc, margin, y, contentWidth, pageWidth, brandName) => {
  const headerH = 24

  doc.setFillColor(...CERT.navy)
  doc.rect(margin, y, contentWidth, headerH, 'F')

  doc.setFillColor(...CERT.gold)
  doc.rect(margin, y + headerH - 1.4, contentWidth, 1.4, 'F')

  doc.setDrawColor(...CERT.goldLight)
  doc.setLineWidth(0.2)
  doc.line(margin + 8, y + 4, pageWidth - margin - 8, y + 4)

  writeAt(doc, brandName, pageWidth / 2, y + 10.5, {
    size: 12,
    style: 'bold',
    color: CERT.white,
    align: 'center',
  })
  writeAt(doc, `GSTIN: ${BRAND.gstNumber}`, pageWidth / 2, y + 16.5, {
    size: 7.5,
    color: [200, 210, 225],
    align: 'center',
  })

  const badgeW = 34
  const badgeH = 8
  const badgeX = pageWidth - margin - badgeW - 2
  const badgeY = y + 3
  doc.setFillColor(...CERT.navyDark)
  doc.setDrawColor(...CERT.gold)
  doc.setLineWidth(0.35)
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD')
  writeAt(doc, 'OFFICIAL LICENSE', badgeX + badgeW / 2, badgeY + 5.2, {
    size: 6.2,
    style: 'bold',
    color: CERT.gold,
    align: 'center',
  })

  return y + headerH + 8
}

const drawTitleDivider = (doc, centerX, y) => {
  doc.setDrawColor(...CERT.gold)
  doc.setLineWidth(0.35)
  doc.line(centerX - 22, y, centerX - 3, y)
  doc.line(centerX + 3, y, centerX + 22, y)
  doc.setFillColor(...CERT.gold)
  const s = 1.6
  doc.rect(centerX - s / 2, y - s / 2, s, s, 'F')
}

const drawMetaIcon = (doc, x, y, type) => {
  const size = 8
  const left = x - size / 2
  const top = y - size / 2

  doc.setFillColor(248, 245, 238)
  doc.setDrawColor(...CERT.gold)
  doc.setLineWidth(0.35)
  doc.roundedRect(left, top, size, size, 1.6, 1.6, 'FD')

  doc.setDrawColor(...CERT.navy)
  doc.setLineWidth(0.38)
  doc.setFillColor(...CERT.navy)

  const cx = x
  const cy = y

  if (type === 'calendar') {
    doc.setFillColor(...CERT.navy)
    doc.rect(cx - 1.1, cy - 3.1, 0.9, 1.3, 'F')
    doc.rect(cx + 0.2, cy - 3.1, 0.9, 1.3, 'F')
    doc.setDrawColor(...CERT.navy)
    doc.setLineWidth(0.38)
    doc.roundedRect(cx - 2.8, cy - 2.2, 5.6, 4.8, 0.6, 0.6)
    doc.line(cx - 2.8, cy - 0.4, cx + 2.8, cy - 0.4)
    doc.setFillColor(...CERT.white)
    doc.circle(cx - 1.2, cy + 0.9, 0.35, 'F')
    doc.circle(cx + 1.2, cy + 0.9, 0.35, 'F')
    doc.circle(cx, cy + 0.9, 0.35, 'F')
  } else if (type === 'currency') {
    doc.setDrawColor(...CERT.navy)
    doc.setLineWidth(0.38)
    doc.roundedRect(cx - 3, cy - 2.2, 6, 4.4, 0.5, 0.5)
    doc.circle(cx, cy, 1.3)
    writeAt(doc, 'Rs', cx, cy + 0.6, { size: 3.8, style: 'bold', color: CERT.navy, align: 'center' })
  } else {
    doc.setFillColor(...CERT.navy)
    doc.setDrawColor(...CERT.navy)
    doc.roundedRect(cx - 2.6, cy - 0.2, 4.8, 2.8, 0.4, 0.4, 'F')
    doc.setFillColor(220, 228, 240)
    doc.roundedRect(cx - 2.2, cy - 1.4, 4.8, 2.8, 0.4, 0.4, 'F')
    doc.setFillColor(...CERT.white)
    doc.setDrawColor(...CERT.navy)
    doc.roundedRect(cx - 1.8, cy - 2.5, 4.8, 2.8, 0.4, 0.4, 'FD')
  }
}

const drawPartyAccent = (doc, x, y, height) => {
  doc.setFillColor(...CERT.gold)
  doc.rect(x, y, 1.8, height, 'F')
}

const drawVerifiedCheckBadge = (doc, cx, cy, radius = 3) => {
  doc.setFillColor(...CERT.greenText)
  doc.circle(cx, cy, radius, 'F')

  doc.setDrawColor(...CERT.white)
  doc.setLineWidth(0.65)
  doc.setLineCap('round')
  doc.setLineJoin('round')

  const scale = radius / 3
  doc.line(cx - 1.15 * scale, cy + 0.05 * scale, cx - 0.25 * scale, cy + 0.95 * scale)
  doc.line(cx - 0.25 * scale, cy + 0.95 * scale, cx + 1.25 * scale, cy - 0.85 * scale)
}

export const generateLicenseCertificateBuffer = ({
  brandName,
  orderNumber,
  orderDateLabel,
  customerName,
  customerEmail,
  subtotalLabel,
  gstLabel,
  promoCodeLabel = '',
  promoDiscountLabel = '',
  orderTotalLabel,
  gstPercent = 18,
  orderItems = [],
}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  const centerX = pageWidth / 2

  drawGoldFrame(doc, pageWidth, doc.internal.pageSize.getHeight())
  let y = drawNavyHeader(doc, margin, 16, contentWidth, pageWidth, brandName)

  writeAt(doc, 'LICENSE CERTIFICATE', centerX, y, {
    size: 22,
    style: 'bold',
    color: CERT.navy,
    align: 'center',
    font: 'times',
  })
  y += 8
  drawTitleDivider(doc, centerX, y)
  y += 5
  writeAt(doc, 'Editorial & News Media License', centerX, y, { size: 9.5, color: CERT.muted, align: 'center' })
  y += 8

  const refW = 78
  doc.setFillColor(...CERT.panel)
  doc.setDrawColor(...CERT.border)
  doc.roundedRect(centerX - refW / 2, y - 3.5, refW, 10, 2.5, 2.5, 'FD')
  writeAt(doc, 'Certificate Ref:', centerX - 14, y + 2.5, { size: 8.5, color: CERT.body, align: 'right' })
  writeAt(doc, orderNumber, centerX - 12, y + 2.5, { size: 9.5, style: 'bold', color: CERT.gold, align: 'left' })
  y += 14

  const metaY = y
  const colW = contentWidth / 3
  const metaItems = [
    ['Issue date', orderDateLabel, 'calendar'],
    ['Order total', orderTotalLabel, 'currency'],
    ['Assets licensed', String(orderItems.length), 'layers'],
  ]
  metaItems.forEach(([label, value, icon], index) => {
    const x = margin + index * colW
    doc.setFillColor(...CERT.white)
    doc.setDrawColor(...CERT.border)
    doc.roundedRect(x + 1.5, metaY, colW - 3, 18, 2.5, 2.5, 'FD')
    drawMetaIcon(doc, x + 7.5, metaY + 9, icon)
    writeAt(doc, label.toUpperCase(), x + 13.5, metaY + 6.5, { size: 6.2, style: 'bold', color: CERT.muted })
    writeAt(doc, value, x + 13.5, metaY + 12.5, { size: 9.5, style: 'bold', color: CERT.navy })
  })
  y += 22

  const boxH = 38
  const halfW = (contentWidth - 5) / 2
  doc.setFillColor(...CERT.white)
  doc.setDrawColor(...CERT.border)
  doc.roundedRect(margin, y, halfW, boxH, 2.5, 2.5, 'FD')
  doc.roundedRect(margin + halfW + 5, y, halfW, boxH, 2.5, 2.5, 'FD')

  drawPartyAccent(doc, margin, y, boxH)
  writeAt(doc, 'LICENSOR', margin + 6, y + 7.5, { size: 7, style: 'bold', color: CERT.muted })
  writeAt(doc, brandName, margin + 6, y + 14, { size: 9.5, style: 'bold', color: CERT.navy })
  writeAt(doc, `GSTIN: ${BRAND.gstNumber}`, margin + 6, y + 19, { size: 7.5, color: CERT.body })
  doc.splitTextToSize(BRAND.companyAddress, halfW - 10).slice(0, 3).forEach((line, i) => {
    writeAt(doc, line, margin + 6, y + 24 + i * 4.2, { size: 7, color: CERT.body })
  })

  drawPartyAccent(doc, margin + halfW + 5, y, boxH)
  writeAt(doc, 'LICENSEE', margin + halfW + 11, y + 7.5, { size: 7, style: 'bold', color: CERT.muted })
  writeAt(doc, customerName || '—', margin + halfW + 11, y + 14, { size: 9.5, style: 'bold', color: CERT.navy })
  writeAt(doc, customerEmail || '—', margin + halfW + 11, y + 20, { size: 8, color: CERT.body })
  writeAt(doc, 'Non-transferable editorial license', margin + halfW + 11, y + 26, { size: 7.5, color: CERT.muted })
  y += boxH + 7

  doc.setFillColor(...CERT.white)
  doc.setDrawColor(...CERT.border)
  const hasPromo = Boolean(promoDiscountLabel)
  const payBoxH = hasPromo ? 30 : 20
  doc.roundedRect(margin, y, contentWidth, payBoxH, 2.5, 2.5, 'FD')
  writeAt(doc, 'PAYMENT SUMMARY', margin + 5, y + 6, { size: 7, style: 'bold', color: CERT.muted })
  doc.setDrawColor(...CERT.gold)
  doc.setLineWidth(0.35)
  doc.line(margin + 5, y + 8.5, margin + contentWidth - 5, y + 8.5)

  if (hasPromo) {
    const row1Y = y + 15
    const row2Y = y + 24
    const half = contentWidth / 2
    writeAt(doc, 'Subtotal', margin + 5, row1Y - 3, { size: 7, color: CERT.muted })
    writeAt(doc, subtotalLabel, margin + 5, row1Y + 1.5, { size: 9.5, style: 'bold', color: CERT.navy })
    doc.line(margin + half, y + 10, margin + half, y + 19)
    writeAt(doc, `Promo (${promoCodeLabel})`, margin + half + 5, row1Y - 3, { size: 7, color: CERT.muted })
    writeAt(doc, `-${promoDiscountLabel}`, margin + half + 5, row1Y + 1.5, { size: 9.5, style: 'bold', color: CERT.navy })
    doc.line(margin + 5, y + 19, margin + contentWidth - 5, y + 19)
    writeAt(doc, `GST (${gstPercent}%)`, margin + 5, row2Y - 3, { size: 7, color: CERT.muted })
    writeAt(doc, gstLabel, margin + 5, row2Y + 1.5, { size: 9.5, style: 'bold', color: CERT.navy })
    doc.line(margin + half, y + 19, margin + half, y + payBoxH)
    writeAt(doc, 'TOTAL PAID', margin + half + 5, row2Y - 3, { size: 7, color: CERT.muted })
    writeAt(doc, orderTotalLabel, margin + half + 5, row2Y + 1.5, { size: 10.5, style: 'bold', color: CERT.navy })
    y += payBoxH + 4
  } else {
    const payY = y + 15
    const third = contentWidth / 3
    writeAt(doc, 'Subtotal', margin + 5, payY - 3, { size: 7, color: CERT.muted })
    writeAt(doc, subtotalLabel, margin + 5, payY + 1.5, { size: 9.5, style: 'bold', color: CERT.navy })
    doc.setDrawColor(...CERT.border)
    doc.line(margin + third, y + 10, margin + third, y + 19)
    writeAt(doc, `GST (${gstPercent}%)`, margin + third + 5, payY - 3, { size: 7, color: CERT.muted })
    writeAt(doc, gstLabel, margin + third + 5, payY + 1.5, { size: 9.5, style: 'bold', color: CERT.navy })
    doc.line(margin + third * 2, y + 10, margin + third * 2, y + 19)
    writeAt(doc, 'TOTAL PAID', margin + third * 2 + 5, payY - 3, { size: 7, color: CERT.muted })
    writeAt(doc, orderTotalLabel, margin + third * 2 + 5, payY + 1.5, { size: 10.5, style: 'bold', color: CERT.navy })
    y += 24
  }

  writeAt(doc, 'LICENSED ASSETS', margin, y, { size: 8, style: 'bold', color: CERT.navyDark })
  y += 5
  const tableTop = y
  const rowH = 9.5
  const cols = [8, 58, 28, 22, 38]
  const headers = ['#', 'Asset title', 'Clip ID', 'Tier', 'License No.']
  doc.setFillColor(...CERT.navy)
  doc.roundedRect(margin, tableTop, contentWidth, rowH, 1.5, 1.5, 'F')
  let colX = margin + 2
  headers.forEach((header, i) => {
    writeAt(doc, header.toUpperCase(), colX, tableTop + 6.5, { size: 6.2, style: 'bold', color: CERT.white })
    colX += cols[i]
  })
  y = tableTop + rowH

  orderItems.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(...CERT.panel)
      doc.rect(margin, y, contentWidth, rowH, 'F')
    }
    doc.setDrawColor(...CERT.border)
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH)
    colX = margin + 2
    const cells = [
      String(index + 1),
      item.name || '—',
      item.clipId || '—',
      item.imageSize || 'Standard',
      item.licenseNumber || '—',
    ]
    cells.forEach((cell, i) => {
      const truncated = doc.splitTextToSize(String(cell), cols[i] - 3)[0] || '—'
      writeAt(doc, truncated, colX, y + 6.5, {
        size: 7.5,
        style: i === 4 ? 'bold' : 'normal',
        color: CERT.body,
      })
      colX += cols[i]
    })
    y += rowH
  })
  y += 7

  doc.setFillColor(...CERT.greenBg)
  doc.setDrawColor(...CERT.greenBorder)
  doc.setLineWidth(0.35)
  doc.roundedRect(margin, y, contentWidth, 16, 2.5, 2.5, 'FD')
  drawVerifiedCheckBadge(doc, margin + 6, y + 8, 3)
  writeAt(doc, 'License verified — download links delivered to your registered email only.', margin + 11, y + 7, {
    size: 8.5,
    style: 'bold',
    color: CERT.greenText,
  })
  writeAt(doc, 'Retain this certificate as proof of purchase and permitted editorial use.', margin + 11, y + 12, {
    size: 7.5,
    color: [4, 120, 87],
  })
  y += 22

  const disclaimer =
    'This document certifies a limited, non-exclusive, non-transferable editorial license. Full master files are not embedded in this certificate. Unauthorized redistribution, resale, or commercial promotional use is prohibited unless separately agreed in writing.'
  doc.splitTextToSize(disclaimer, contentWidth).forEach((line, i) => {
    writeAt(doc, line, margin, y + i * 4, { size: 7.5, color: CERT.footer })
  })

  appendLicensePolicyPages(doc, brandName)

  return Buffer.from(doc.output('arraybuffer'))
}
