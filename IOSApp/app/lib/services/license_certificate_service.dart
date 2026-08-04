import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../core/constants/brand.dart';
import '../core/utils/formatters.dart';
import '../core/utils/order_formatters.dart';
import '../models/order.dart';

class _C {
  static const navy = PdfColor.fromInt(0xFF1B2A4A);
  static const navyDark = PdfColor.fromInt(0xFF12203A);
  static const gold = PdfColor.fromInt(0xFFB59A68);
  static const muted = PdfColor.fromInt(0xFF788291);
  static const body = PdfColor.fromInt(0xFF374151);
  static const border = PdfColor.fromInt(0xFFDCE0E6);
  static const panel = PdfColor.fromInt(0xFFF8F9FB);
  static const greenBg = PdfColor.fromInt(0xFFE8F6EF);
  static const greenBorder = PdfColor.fromInt(0xFF86C5A6);
  static const greenText = PdfColor.fromInt(0xFF065F46);
  static const footer = PdfColor.fromInt(0xFF9CA3AF);
}

class LicenseCertificateService {
  static Future<void> download(Order order) async {
    final doc = pw.Document();
    final orderNumber = order.shortOrderNumber;
    final dateLabel = OrderFormatters.formatDateShort(order.createdAt);
    final customerName = order.billingAddress.name;
    final customerEmail = order.billingAddress.email;
    final subtotal = order.subtotalAmount > 0
        ? order.subtotalAmount
        : order.items.fold<num>(0, (sum, item) => sum + item.lineTotal);
    final gst = order.gstAmount;
    final total = order.totalAmount;
    final gstPercent = subtotal > 0 ? ((gst / subtotal) * 100).round() : 18;

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(22),
        build: (context) {
          return pw.Container(
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: _C.gold, width: 1.5),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                _header(),
                pw.Padding(
                  padding: const pw.EdgeInsets.fromLTRB(18, 14, 18, 16),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                    children: [
                      pw.Center(
                        child: pw.Column(
                          children: [
                            pw.Text(
                              'LICENSE CERTIFICATE',
                              style: pw.TextStyle(
                                fontSize: 24,
                                fontWeight: pw.FontWeight.bold,
                                color: _C.navy,
                                letterSpacing: 0.5,
                              ),
                            ),
                            pw.SizedBox(height: 6),
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.center,
                              children: [
                                pw.Container(
                                  width: 50,
                                  height: 0.8,
                                  color: _C.gold,
                                ),
                                pw.Container(
                                  width: 5,
                                  height: 5,
                                  margin: const pw.EdgeInsets.symmetric(
                                    horizontal: 6,
                                  ),
                                  color: _C.gold,
                                ),
                                pw.Container(
                                  width: 50,
                                  height: 0.8,
                                  color: _C.gold,
                                ),
                              ],
                            ),
                            pw.SizedBox(height: 6),
                            pw.Text(
                              'Editorial & News Media License',
                              style: const pw.TextStyle(
                                fontSize: 10,
                                color: _C.muted,
                              ),
                            ),
                            pw.SizedBox(height: 10),
                            pw.Container(
                              padding: const pw.EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 7,
                              ),
                              decoration: pw.BoxDecoration(
                                color: _C.panel,
                                borderRadius: pw.BorderRadius.circular(8),
                                border: pw.Border.all(color: _C.border),
                              ),
                              child: pw.RichText(
                                text: pw.TextSpan(
                                  children: [
                                    const pw.TextSpan(
                                      text: 'Certificate Ref: ',
                                      style: pw.TextStyle(
                                        fontSize: 9,
                                        color: _C.body,
                                      ),
                                    ),
                                    pw.TextSpan(
                                      text: orderNumber,
                                      style: pw.TextStyle(
                                        fontSize: 10,
                                        fontWeight: pw.FontWeight.bold,
                                        color: _C.gold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 14),
                      pw.Row(
                        children: [
                          _metaCard('Issue date', dateLabel),
                          pw.SizedBox(width: 8),
                          _metaCard('Order total', Formatters.currency(total)),
                          pw.SizedBox(width: 8),
                          _metaCard('Assets licensed', '${order.items.length}'),
                        ],
                      ),
                      pw.SizedBox(height: 10),
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Expanded(
                            child: _partyCard(
                              title: 'LICENSOR',
                              name: Brand.name,
                              line1: 'GSTIN: ${Brand.gstNumber}',
                              line2: Brand.companyAddress,
                            ),
                          ),
                          pw.SizedBox(width: 10),
                          pw.Expanded(
                            child: _partyCard(
                              title: 'LICENSEE',
                              name: customerName.isEmpty ? '—' : customerName,
                              line1: customerEmail.isEmpty
                                  ? '—'
                                  : customerEmail,
                              line2: 'Non-transferable editorial license',
                            ),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 10),
                      _paymentSummary(subtotal, gst, total, gstPercent),
                      pw.SizedBox(height: 10),
                      _assetsTable(order),
                      pw.SizedBox(height: 10),
                      pw.Container(
                        padding: const pw.EdgeInsets.all(10),
                        decoration: pw.BoxDecoration(
                          color: _C.greenBg,
                          borderRadius: pw.BorderRadius.circular(8),
                          border: pw.Border.all(color: _C.greenBorder),
                        ),
                        child: pw.Row(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.CustomPaint(
                              size: const PdfPoint(18, 18),
                              painter: (canvas, size) {
                                canvas.setFillColor(_C.greenText);
                                canvas.drawEllipse(0, 0, size.x, size.y);
                                canvas.setStrokeColor(PdfColors.white);
                                canvas.setLineWidth(1.4);
                                canvas.moveTo(size.x * 0.26, size.y * 0.52);
                                canvas.lineTo(size.x * 0.44, size.y * 0.7);
                                canvas.lineTo(size.x * 0.74, size.y * 0.32);
                                canvas.strokePath();
                              },
                            ),
                            pw.SizedBox(width: 8),
                            pw.Expanded(
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text(
                                    'License verified — download links delivered to your registered email only.',
                                    style: pw.TextStyle(
                                      fontSize: 9,
                                      fontWeight: pw.FontWeight.bold,
                                      color: _C.greenText,
                                    ),
                                  ),
                                  pw.SizedBox(height: 2),
                                  pw.Text(
                                    'Retain this certificate as proof of purchase and permitted editorial use.',
                                    style: const pw.TextStyle(
                                      fontSize: 8,
                                      color: PdfColor.fromInt(0xFF047857),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 12),
                      pw.Text(
                        'This document certifies a limited, non-exclusive, non-transferable editorial license. Full master files are not embedded in this certificate. Unauthorized redistribution, resale, or commercial promotional use is prohibited unless separately agreed in writing.',
                        style: const pw.TextStyle(
                          fontSize: 7.5,
                          color: _C.footer,
                          lineSpacing: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    _appendLicensePolicyPages(doc);

    await Printing.sharePdf(
      bytes: await doc.save(),
      filename: 'license-$orderNumber.pdf',
    );
  }

  static void _appendLicensePolicyPages(pw.Document doc) {
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.fromLTRB(34, 32, 34, 32),
        header: (context) => pw.Container(
          margin: const pw.EdgeInsets.only(bottom: 18),
          padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: const pw.BoxDecoration(
            color: _C.navy,
            border: pw.Border(bottom: pw.BorderSide(color: _C.gold, width: 2)),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              pw.Text(
                'License Agreement & Usage Policy',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  color: PdfColors.white,
                  fontSize: 11,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              if (context.pageNumber == 2)
                pw.Padding(
                  padding: const pw.EdgeInsets.only(top: 3),
                  child: pw.Text(
                    'Attached to License Certificate',
                    textAlign: pw.TextAlign.center,
                    style: const pw.TextStyle(
                      color: PdfColors.grey300,
                      fontSize: 8,
                    ),
                  ),
                ),
            ],
          ),
        ),
        footer: (context) => pw.Text(
          '${Brand.name}  •  License Policy  •  ${context.pageNumber}',
          textAlign: pw.TextAlign.center,
          style: const pw.TextStyle(color: _C.footer, fontSize: 7),
        ),
        build: (context) => _licensePolicyBlocks.map(_policyBlock).toList(),
      ),
    );
  }

  static pw.Widget _policyBlock(_PolicyBlock block) {
    switch (block.type) {
      case _PolicyBlockType.title:
        return pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 7),
          child: pw.Text(
            block.text,
            style: pw.TextStyle(
              color: _C.navy,
              fontSize: 12,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        );
      case _PolicyBlockType.subtitle:
        return pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 8),
          child: pw.Text(
            block.text,
            style: pw.TextStyle(
              color: _C.navyDark,
              fontSize: 11,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        );
      case _PolicyBlockType.heading:
        return pw.Padding(
          padding: const pw.EdgeInsets.only(top: 3, bottom: 5),
          child: pw.Text(
            block.text,
            style: pw.TextStyle(
              color: _C.navy,
              fontSize: 9.5,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        );
      case _PolicyBlockType.paragraph:
        return pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 7),
          child: pw.Text(
            block.text,
            style: const pw.TextStyle(
              color: _C.body,
              fontSize: 8.5,
              lineSpacing: 2,
            ),
          ),
        );
      case _PolicyBlockType.bullets:
        return pw.Padding(
          padding: const pw.EdgeInsets.only(left: 6, bottom: 7),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: block.items
                .map(
                  (item) => pw.Padding(
                    padding: const pw.EdgeInsets.only(bottom: 3),
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          '•',
                          style: const pw.TextStyle(
                            color: _C.navy,
                            fontSize: 8.5,
                          ),
                        ),
                        pw.SizedBox(width: 6),
                        pw.Expanded(
                          child: pw.Text(
                            item,
                            style: const pw.TextStyle(
                              color: _C.body,
                              fontSize: 8.3,
                              lineSpacing: 1.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        );
      case _PolicyBlockType.divider:
        return pw.Container(
          height: 1,
          margin: const pw.EdgeInsets.symmetric(vertical: 8),
          color: _C.border,
        );
    }
  }

  static pw.Widget _header() {
    return pw.Container(
      color: _C.navy,
      padding: const pw.EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        children: [
          pw.Container(
            width: 28,
            height: 28,
            decoration: pw.BoxDecoration(
              color: _C.gold,
              borderRadius: pw.BorderRadius.circular(4),
            ),
            alignment: pw.Alignment.center,
            child: pw.Text(
              'A',
              style: pw.TextStyle(
                fontSize: 14,
                fontWeight: pw.FontWeight.bold,
                color: _C.navy,
              ),
            ),
          ),
          pw.SizedBox(width: 10),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  Brand.name,
                  style: pw.TextStyle(
                    color: PdfColors.white,
                    fontSize: 11,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  'GSTIN: ${Brand.gstNumber}',
                  style: const pw.TextStyle(
                    color: PdfColors.grey300,
                    fontSize: 7.5,
                  ),
                ),
              ],
            ),
          ),
          pw.Text(
            'OFFICIAL LICENSE',
            style: pw.TextStyle(
              color: _C.gold,
              fontSize: 9,
              fontWeight: pw.FontWeight.bold,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _metaCard(String label, String value) {
    return pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.all(10),
        decoration: pw.BoxDecoration(
          color: PdfColors.white,
          borderRadius: pw.BorderRadius.circular(8),
          border: pw.Border.all(color: _C.border),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              label.toUpperCase(),
              style: const pw.TextStyle(fontSize: 6.5, color: _C.muted),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
                color: _C.navy,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _partyCard({
    required String title,
    required String name,
    required String line1,
    required String line2,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: _C.border),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 7,
              color: _C.muted,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.SizedBox(height: 5),
          pw.Text(
            name,
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: _C.navy,
            ),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            line1,
            style: const pw.TextStyle(fontSize: 8, color: _C.body),
          ),
          pw.SizedBox(height: 3),
          pw.Text(
            line2,
            style: const pw.TextStyle(
              fontSize: 7.5,
              color: _C.body,
              lineSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _paymentSummary(
    num subtotal,
    num gst,
    num total,
    int gstPercent,
  ) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: _C.border),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            'PAYMENT SUMMARY',
            style: pw.TextStyle(
              fontSize: 7,
              color: _C.muted,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.Container(
            height: 1,
            margin: const pw.EdgeInsets.symmetric(vertical: 6),
            color: _C.gold,
          ),
          pw.Row(
            children: [
              _payCol('Subtotal', Formatters.currency(subtotal)),
              pw.Container(width: 1, height: 24, color: _C.border),
              _payCol('GST ($gstPercent%)', Formatters.currency(gst)),
              pw.Container(width: 1, height: 24, color: _C.border),
              _payCol('TOTAL PAID', Formatters.currency(total), bold: true),
            ],
          ),
        ],
      ),
    );
  }

  static pw.Widget _payCol(String label, String value, {bool bold = false}) {
    return pw.Expanded(
      child: pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 8),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              label,
              style: const pw.TextStyle(fontSize: 7, color: _C.muted),
            ),
            pw.SizedBox(height: 2),
            pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: bold ? 10.5 : 9.5,
                fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
                color: _C.navy,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _assetsTable(Order order) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          'LICENSED ASSETS',
          style: pw.TextStyle(
            fontSize: 8,
            fontWeight: pw.FontWeight.bold,
            color: _C.navyDark,
          ),
        ),
        pw.SizedBox(height: 5),
        pw.Table(
          border: pw.TableBorder.all(color: _C.border, width: 0.5),
          columnWidths: {
            0: const pw.FlexColumnWidth(0.5),
            1: const pw.FlexColumnWidth(2.4),
            2: const pw.FlexColumnWidth(1.2),
            3: const pw.FlexColumnWidth(1),
            4: const pw.FlexColumnWidth(1.4),
          },
          children: [
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: _C.navy),
              children: [
                '#',
                'Asset title',
                'Clip ID',
                'Tier',
                'License No.',
              ].map((h) => _th(h)).toList(),
            ),
            ...order.items.asMap().entries.map((entry) {
              final item = entry.value;
              final bg = entry.key.isOdd ? _C.panel : PdfColors.white;
              return pw.TableRow(
                decoration: pw.BoxDecoration(color: bg),
                children: [
                  _td('${entry.key + 1}'),
                  _td(item.name),
                  _td(item.clipId.isEmpty ? '—' : item.clipId),
                  _td(item.imageSize.isEmpty ? 'Standard' : item.imageSize),
                  _td(
                    item.licenseNumber.isEmpty ? '—' : item.licenseNumber,
                    bold: true,
                  ),
                ],
              );
            }),
          ],
        ),
      ],
    );
  }

  static pw.Widget _th(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      child: pw.Text(
        text.toUpperCase(),
        style: pw.TextStyle(
          fontSize: 6.2,
          fontWeight: pw.FontWeight.bold,
          color: PdfColors.white,
        ),
      ),
    );
  }

  static pw.Widget _td(String text, {bool bold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 7.5,
          fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: _C.body,
        ),
      ),
    );
  }
}

enum _PolicyBlockType { title, subtitle, heading, paragraph, bullets, divider }

class _PolicyBlock {
  const _PolicyBlock(this.type, {this.text = '', this.items = const []});

  final _PolicyBlockType type;
  final String text;
  final List<String> items;
}

const _licensePolicyBlocks = <_PolicyBlock>[
  _PolicyBlock(_PolicyBlockType.title, text: 'AKHD MEDIA & CO'),
  _PolicyBlock(
    _PolicyBlockType.subtitle,
    text: 'Editorial Content License Agreement & Usage Policy',
  ),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Copyright Notice'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'All photographs, videos, and related media content ("Content") are the exclusive intellectual property of AKHD MEDIA & CO and are protected under applicable copyright laws. Purchase of any Content does not transfer ownership or copyright. The purchaser is granted only a limited, non-exclusive, non-transferable license to use the Content in accordance with the terms set forth below.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '1. Personal Use License'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Under the Personal Use License, the purchaser may use the Content solely for private, non-commercial purposes.',
  ),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Permitted Uses'),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Download and view the Content for personal enjoyment.',
      'Store the Content in personal archives or collections.',
      'Use the Content in private, non-commercial projects that are not publicly distributed or monetized.',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Prohibited Uses'),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Reselling, sublicensing, distributing, or sharing the Content with third parties.',
      'Uploading the Content to commercial platforms, websites, marketplaces, or media libraries.',
      'Using the Content for advertising, promotional, marketing, or business-related activities.',
      'Modifying the Content for commercial exploitation.',
      'Claiming ownership or authorship of the Content.',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '2. Editorial Use License'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'The Editorial Use License permits the use of Content for journalistic, informational, commentary, documentary, entertainment news, and reporting purposes only.',
  ),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Permitted Uses'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'The Content may be published or displayed in:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
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
  ),
  _PolicyBlock(
    _PolicyBlockType.heading,
    text: 'Examples of Acceptable Editorial Use',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Reporting on celebrity appearances, public events, film promotions, fashion shows, entertainment industry developments, or current affairs.',
      'Publishing news articles, opinion pieces, reviews, commentary, and informational content.',
      'Creating editorial videos discussing public figures, entertainment news, or cultural events.',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '3. Prohibited Commercial Uses'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Unless expressly authorized in writing by AKHD MEDIA & CO, the Content may not be used for any commercial, promotional, advertising, endorsement, or merchandising purpose.',
  ),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Strictly Prohibited Uses'),
  _PolicyBlock(
    _PolicyBlockType.bullets,
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
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(
    _PolicyBlockType.title,
    text: '4. Celebrity Publicity & Personality Rights',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Certain Content may feature celebrities, public figures, performers, or other identifiable individuals.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'Purchasers acknowledge that:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Copyright ownership of the Content remains with AKHD MEDIA & CO.',
      'Separate publicity, personality, image, privacy, or likeness rights may exist in relation to individuals depicted in the Content.',
      'Commercial use of such Content may require additional permissions, licenses, releases, or clearances from the individuals concerned or their authorized representatives.',
      'AKHD MEDIA & CO does not grant any publicity, endorsement, personality, or trademark rights through this license.',
    ],
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'The purchaser assumes full responsibility for obtaining any additional permissions required for their intended use.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '5. License Restrictions'),
  _PolicyBlock(_PolicyBlockType.paragraph, text: 'The purchaser shall not:'),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Resell, redistribute, sublicense, assign, or transfer the licensed Content.',
      'Claim ownership of the Content.',
      'Remove copyright notices, watermarks, metadata, or attribution information.',
      'Use the Content in any manner that violates applicable laws or regulations.',
      'Use the Content in a way that harms the reputation of AKHD MEDIA & CO or the individuals depicted.',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '6. Copyright Ownership'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'All copyrights, intellectual property rights, neighboring rights, and related interests in the Content shall remain the sole and exclusive property of AKHD MEDIA & CO.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'No ownership rights are transferred under this agreement. The purchaser receives only a limited license to use the Content subject to the terms and restrictions contained herein.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '7. Commercial Licensing'),
  _PolicyBlock(_PolicyBlockType.paragraph, text: 'Any use of the Content for:'),
  _PolicyBlock(
    _PolicyBlockType.bullets,
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
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'requires prior written authorization from AKHD MEDIA & CO and may be subject to additional licensing fees, talent clearances, publicity rights, and legal approvals.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'For commercial licensing inquiries, please contact AKHD MEDIA & CO directly.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: '8. Limitation of Liability'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AKHD MEDIA & CO shall not be liable for any claims, damages, losses, or expenses arising from unauthorized use of the Content or failure by the purchaser to obtain necessary third-party permissions, releases, or clearances.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'The purchaser assumes full responsibility for ensuring that their use of the Content complies with all applicable laws and regulations.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.title, text: 'Acceptance of Terms'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'By purchasing, downloading, accessing, or using any Content supplied by AKHD MEDIA & CO, the purchaser acknowledges that they have read, understood, and agreed to be bound by the terms of this Editorial Content License Agreement and Usage Policy.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(
    _PolicyBlockType.subtitle,
    text: 'AI USAGE POLICY / Strict Prohibition on AI Use',
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '1. Introduction'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Welcome to AKHD MEDIA & CO. This AI Usage Policy governs the use of all content available on AKHDMEDIA.COM in connection with Artificial Intelligence (AI), Machine Learning (ML), Large Language Models (LLMs), Generative AI, and any similar technologies.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'By accessing, purchasing, downloading, or using any content from our website, you acknowledge and agree to comply with this Policy.',
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '2. Ownership of Content'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'All videos, preview clips, thumbnails, metadata, graphics, logos, text, and all other materials available on AKHDMEDIA.COM are the exclusive intellectual property of AKHD MEDIA & CO.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Purchasing a license grants only the limited usage rights specified in the applicable license and does not transfer ownership or copyright of the content.',
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '3. Strict Prohibition on AI Use'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AKHD MEDIA & CO strictly prohibits the use of any of its content for Artificial Intelligence (AI) purposes. We do not grant, sell, license, authorize, or permit the use of any of our content for AI-related activities under any circumstances.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'This prohibition applies to all content available on AKHDMEDIA.COM, including but not limited to:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Licensed videos',
      'Preview videos',
      'Watermarked previews',
      'Thumbnails',
      'Images',
      'Metadata',
      'Captions',
      'Text',
      'Graphics',
      'Logos',
      'Any other digital content published by AKHD MEDIA & CO',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '4. Prohibited AI Activities'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'Our content must not be used for, including but not limited to:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Training Artificial Intelligence (AI) models.',
      'Training Machine Learning (ML) systems.',
      'Large Language Models (LLMs).',
      'Generative AI systems.',
      'AI dataset creation.',
      'Computer vision systems.',
      'Facial recognition technologies.',
      'Biometric identification systems.',
      'Deepfake generation.',
      'Synthetic media creation.',
      'AI-assisted image or video generation.',
      'Automated data collection for AI development.',
      'Web scraping or harvesting content for AI purposes.',
      'Fine-tuning existing AI models.',
      'Any present or future AI-related technologies.',
    ],
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '5. No AI Rights Are Granted'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'No license sold by AKHD MEDIA & CO includes any right to:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Train AI systems.',
      'Develop AI products.',
      'Build AI datasets.',
      'Improve AI models.',
      'Feed our content into AI software.',
      'Use our content for automated learning systems.',
    ],
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AI rights are expressly excluded from every license offered by AKHD MEDIA & CO.',
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '6. Monitoring and Enforcement'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AKHD MEDIA & CO reserves the right to investigate any suspected unauthorized AI use of its content.',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'Any violation of this Policy may result in:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Immediate termination of the license.',
      'Permanent suspension of user accounts.',
      'Revocation of access to licensed content.',
      'Legal action for copyright infringement.',
      'Claims for damages, injunctive relief, and any other remedies available under applicable law.',
    ],
  ),
  _PolicyBlock(
    _PolicyBlockType.title,
    text: '7. Relationship with Other Policies',
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text: 'This AI Usage Policy forms an integral part of our:',
  ),
  _PolicyBlock(
    _PolicyBlockType.bullets,
    items: [
      'Terms & Conditions',
      'License Information Policy',
      'Copyright Policy',
      'Acceptable Use Policy',
    ],
  ),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'Any violation of this Policy shall also constitute a violation of those policies.',
  ),
  _PolicyBlock(_PolicyBlockType.title, text: '8. Policy Updates'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AKHD MEDIA & CO reserves the right to amend or update this AI Usage Policy at any time. Any changes become effective immediately upon publication on AKHDMEDIA.COM.',
  ),
  _PolicyBlock(_PolicyBlockType.divider),
  _PolicyBlock(_PolicyBlockType.heading, text: 'Contact'),
  _PolicyBlock(
    _PolicyBlockType.paragraph,
    text:
        'AKHD MEDIA & CO, Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India. Website: https://www.akhdmedia.com. Email: support@akhdmedia.com.',
  ),
];
