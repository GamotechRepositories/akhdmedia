import 'package:flutter/material.dart';

/// Top-left badge shown on demo video previews.
class VideoPreviewDemoBadge extends StatelessWidget {
  const VideoPreviewDemoBadge({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Align(
        alignment: Alignment.topLeft,
        child: Padding(
          padding: EdgeInsets.all(compact ? 10 : 14),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: compact ? 10 : 12,
                vertical: compact ? 5 : 6,
              ),
              child: Text(
                '40 Sec Preview Demo Only!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: compact ? 10 : 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                  height: 1.2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

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
