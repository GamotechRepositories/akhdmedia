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
  static const goldDark = PdfColor.fromInt(0xFF9A7D48);
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
                                pw.Container(width: 50, height: 0.8, color: _C.gold),
                                pw.Container(
                                  width: 5,
                                  height: 5,
                                  margin: const pw.EdgeInsets.symmetric(horizontal: 6),
                                  color: _C.gold,
                                ),
                                pw.Container(width: 50, height: 0.8, color: _C.gold),
                              ],
                            ),
                            pw.SizedBox(height: 6),
                            pw.Text(
                              'Editorial & News Media License',
                              style: const pw.TextStyle(fontSize: 10, color: _C.muted),
                            ),
                            pw.SizedBox(height: 10),
                            pw.Container(
                              padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 7),
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
                                      style: pw.TextStyle(fontSize: 9, color: _C.body),
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
                              line1: customerEmail.isEmpty ? '—' : customerEmail,
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
                                    style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: _C.greenText),
                                  ),
                                  pw.SizedBox(height: 2),
                                  pw.Text(
                                    'Retain this certificate as proof of purchase and permitted editorial use.',
                                    style: const pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF047857)),
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
                        style: const pw.TextStyle(fontSize: 7.5, color: _C.footer, lineSpacing: 1.35),
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

    await Printing.sharePdf(bytes: await doc.save(), filename: 'license-$orderNumber.pdf');
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
            child: pw.Text('A', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: _C.navy)),
          ),
          pw.SizedBox(width: 10),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(Brand.name, style: pw.TextStyle(color: PdfColors.white, fontSize: 11, fontWeight: pw.FontWeight.bold)),
                pw.Text('GSTIN: ${Brand.gstNumber}', style: const pw.TextStyle(color: PdfColors.grey300, fontSize: 7.5)),
              ],
            ),
          ),
          pw.Text(
            'OFFICIAL LICENSE',
            style: pw.TextStyle(color: _C.gold, fontSize: 9, fontWeight: pw.FontWeight.bold, letterSpacing: 0.6),
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
            pw.Text(label.toUpperCase(), style: const pw.TextStyle(fontSize: 6.5, color: _C.muted)),
            pw.SizedBox(height: 4),
            pw.Text(value, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: _C.navy)),
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
          pw.Text(title, style: pw.TextStyle(fontSize: 7, color: _C.muted, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 5),
          pw.Text(name, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: _C.navy)),
          pw.SizedBox(height: 4),
          pw.Text(line1, style: const pw.TextStyle(fontSize: 8, color: _C.body)),
          pw.SizedBox(height: 3),
          pw.Text(line2, style: const pw.TextStyle(fontSize: 7.5, color: _C.body, lineSpacing: 1.2)),
        ],
      ),
    );
  }

  static pw.Widget _paymentSummary(num subtotal, num gst, num total, int gstPercent) {
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
          pw.Text('PAYMENT SUMMARY', style: pw.TextStyle(fontSize: 7, color: _C.muted, fontWeight: pw.FontWeight.bold)),
          pw.Container(height: 1, margin: const pw.EdgeInsets.symmetric(vertical: 6), color: _C.gold),
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
            pw.Text(label, style: const pw.TextStyle(fontSize: 7, color: _C.muted)),
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
        pw.Text('LICENSED ASSETS', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: _C.navyDark)),
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
              children: ['#', 'Asset title', 'Clip ID', 'Tier', 'License No.']
                  .map((h) => _th(h))
                  .toList(),
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
                  _td(item.licenseNumber.isEmpty ? '—' : item.licenseNumber, bold: true),
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
      child: pw.Text(text.toUpperCase(), style: pw.TextStyle(fontSize: 6.2, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
    );
  }

  static pw.Widget _td(String text, {bool bold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      child: pw.Text(
        text,
        style: pw.TextStyle(fontSize: 7.5, fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal, color: _C.body),
      ),
    );
  }
}
