import 'package:flutter/material.dart';

/// Repeating diagonal "AKHD MEDIA PREVIEW" overlay for protected media.
class PreviewMediaWatermark extends StatelessWidget {
  const PreviewMediaWatermark({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: _PreviewWatermarkPainter(compact: compact),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class ProtectedMediaFrame extends StatelessWidget {
  const ProtectedMediaFrame({
    super.key,
    required this.child,
    this.watermark = true,
    this.compact = false,
  });

  final Widget child;
  final bool watermark;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (watermark) PreviewMediaWatermark(compact: compact),
      ],
    );
  }
}

class _PreviewWatermarkPainter extends CustomPainter {
  _PreviewWatermarkPainter({required this.compact});

  final bool compact;

  static const _label = 'AKHD MEDIA PREVIEW';

  @override
  void paint(Canvas canvas, Size size) {
    final stepX = compact ? 220.0 : 300.0;
    final stepY = compact ? 120.0 : 170.0;
    final fontSize = compact ? 11.0 : 15.0;
    final letterSpacing = compact ? 3.0 : 5.0;
    const rotation = -0.42;

    final textPainter = TextPainter(
      text: TextSpan(
        text: _label,
        style: TextStyle(
          color: const Color(0x3DFFFFFF),
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          letterSpacing: letterSpacing,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    for (var y = -stepY; y < size.height + stepY; y += stepY) {
      for (var x = -stepX; x < size.width + stepX; x += stepX) {
        canvas.save();
        canvas.translate(x + stepX / 2, y + stepY / 2);
        canvas.rotate(rotation);
        textPainter.paint(
          canvas,
          Offset(-textPainter.width / 2, -textPainter.height / 2),
        );
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PreviewWatermarkPainter oldDelegate) {
    return oldDelegate.compact != compact;
  }
}
