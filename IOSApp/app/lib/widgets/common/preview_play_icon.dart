import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Stroke play icon matching the storefront preview control (no background).
class PreviewPlayIcon extends StatelessWidget {
  const PreviewPlayIcon({
    super.key,
    this.size = 56,
    this.color = Colors.white,
  });

  final double size;
  final Color color;

  static const _svg = '''
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
</svg>
''';

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      _svg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }
}

/// Full-area tap target with a transparent centered play icon when paused.
class PreviewVideoPlayOverlay extends StatelessWidget {
  const PreviewVideoPlayOverlay({
    super.key,
    required this.isPlaying,
    required this.onTogglePlay,
    this.iconSize = 56,
  });

  final bool isPlaying;
  final VoidCallback onTogglePlay;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: GestureDetector(
        onTap: onTogglePlay,
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: IgnorePointer(
            child: AnimatedOpacity(
              opacity: isPlaying ? 0 : 1,
              duration: const Duration(milliseconds: 200),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: PreviewPlayIcon(size: iconSize),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
