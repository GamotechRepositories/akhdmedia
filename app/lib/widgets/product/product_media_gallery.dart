import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/preview_video_gate.dart';
import '../../core/utils/product_media.dart';
import '../../models/product.dart';
import '../common/preview_media_watermark.dart';
import '../common/preview_play_icon.dart';

class ProductMediaGallery extends StatefulWidget {
  const ProductMediaGallery({super.key, required this.product});

  final Product product;

  @override
  State<ProductMediaGallery> createState() => _ProductMediaGalleryState();
}

class _ProductMediaGalleryState extends State<ProductMediaGallery> {
  late List<ProductMediaItem> _items;
  late int _selectedIndex;
  VideoPlayerController? _videoController;
  bool _isMuted = true;
  bool _isPlaying = false;
  bool _isInitializing = false;
  bool _isBuffering = false;
  double _videoAspectRatio = 16 / 9;
  bool _previewGateTriggered = false;

  @override
  void initState() {
    super.initState();
    _items = buildProductMediaItems(widget.product);
    _selectedIndex = _items.indexWhere((item) => item.isVideo);
    if (_selectedIndex < 0) _selectedIndex = 0;
    _isInitializing = _items[_selectedIndex].isVideo;
    _initVideoIfNeeded();
  }

  @override
  void didUpdateWidget(covariant ProductMediaGallery oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.product.id != widget.product.id) {
      _disposeVideo();
      _items = buildProductMediaItems(widget.product);
      _selectedIndex = _items.indexWhere((item) => item.isVideo);
      if (_selectedIndex < 0) _selectedIndex = 0;
      _videoAspectRatio = 16 / 9;
      _previewGateTriggered = false;
      _initVideoIfNeeded();
    }
  }

  @override
  void dispose() {
    _disposeVideo();
    super.dispose();
  }

  ProductMediaItem get _selectedItem => _items[_selectedIndex];

  Future<void> _initVideoIfNeeded() async {
    final item = _selectedItem;
    if (!item.isVideo) {
      setState(() {
        _isPlaying = false;
        _isInitializing = false;
        _isBuffering = false;
      });
      return;
    }

    setState(() {
      _isInitializing = true;
      _isBuffering = false;
      _isPlaying = false;
    });

    final controller = VideoPlayerController.networkUrl(Uri.parse(item.src));
    _videoController = controller;
    controller.addListener(_onVideoUpdate);

    try {
      await controller.initialize();
      controller.setLooping(true);
      controller.setVolume(_isMuted ? 0 : 1);

      final size = controller.value.size;
      if (size.width > 0 && size.height > 0) {
        _videoAspectRatio = size.width / size.height;
      }
    } finally {
      if (mounted) {
        setState(() => _isInitializing = false);
      }
    }
  }

  void _onVideoUpdate() {
    final controller = _videoController;
    if (controller == null || !mounted) return;

    enforcePreviewVideoAuthGate(
      context,
      controller,
      isGateTriggered: () => _previewGateTriggered,
      setGateTriggered: (value) => _previewGateTriggered = value,
    );

    setState(() {
      _isPlaying = controller.value.isPlaying;
      _isBuffering = controller.value.isBuffering;
    });
  }

  void _disposeVideo() {
    _videoController?.removeListener(_onVideoUpdate);
    _videoController?.dispose();
    _videoController = null;
    _isPlaying = false;
    _isInitializing = false;
    _isBuffering = false;
  }

  Future<void> _selectIndex(int index) async {
    if (index == _selectedIndex) return;
    _disposeVideo();
    setState(() {
      _selectedIndex = index;
      _videoAspectRatio = 16 / 9;
      _isInitializing = _items[index].isVideo;
      _previewGateTriggered = false;
    });
    await _initVideoIfNeeded();
  }

  Future<void> _togglePlay() async {
    final controller = _videoController;
    if (controller == null || !controller.value.isInitialized) return;

    if (controller.value.isPlaying) {
      await controller.pause();
      return;
    }

    setState(() => _isBuffering = true);
    try {
      await controller.play();
    } finally {
      if (mounted && !controller.value.isBuffering) {
        setState(() => _isBuffering = false);
      }
    }
  }

  void _toggleMute() {
    final controller = _videoController;
    if (controller == null) return;
    setState(() {
      _isMuted = !_isMuted;
      controller.setVolume(_isMuted ? 0 : 1);
    });
  }

  Future<void> _openFullscreen() async {
    final item = _selectedItem;
    if (item.isVideo) {
      await _openVideoFullscreen();
      return;
    }
    if (item.src.isEmpty) return;
    await _openMediaLightbox();
  }

  Future<void> _openVideoFullscreen() async {
    final controller = _videoController;
    final item = _selectedItem;
    if (controller == null ||
        !controller.value.isInitialized ||
        !item.isVideo ||
        _isInitializing) {
      return;
    }

    final wasPlaying = controller.value.isPlaying;
    final position = controller.value.position;
    await controller.pause();

    if (!mounted) return;

    final result = await Navigator.of(context).push<_VideoFullscreenResult>(
      PageRouteBuilder<_VideoFullscreenResult>(
        opaque: true,
        fullscreenDialog: true,
        pageBuilder: (context, animation, secondaryAnimation) {
          return _VideoFullscreenPage(
            videoUrl: item.src,
            poster: item.poster,
            initialPosition: position,
            autoPlay: wasPlaying,
            isMuted: _isMuted,
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );

    if (!mounted || result == null) return;

    await controller.seekTo(result.position);
    setState(() => _isMuted = result.isMuted);
    controller.setVolume(_isMuted ? 0 : 1);
    if (result.wasPlaying) {
      await controller.play();
    }
  }

  Future<void> _openMediaLightbox() async {
    if (!mounted) return;

    await Navigator.of(context).push<void>(
      PageRouteBuilder<void>(
        opaque: true,
        fullscreenDialog: true,
        pageBuilder: (context, animation, secondaryAnimation) {
          return _MediaLightboxPage(
            items: _items,
            initialIndex: _selectedIndex,
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  double _frameAspectRatio() {
    if (_selectedItem.isVideo) return _videoAspectRatio;
    return 3 / 4;
  }

  double _frameHeight(double width) {
    final ratio = _frameAspectRatio();
    final naturalHeight = width / ratio;
    final maxHeight = math.min(width * 1.25, 680);
    return naturalHeight.clamp(280.0, maxHeight).toDouble();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final frameWidth = constraints.maxWidth;
        final frameHeight = _frameHeight(frameWidth);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              width: frameWidth,
              height: frameHeight,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                clipBehavior: Clip.antiAlias,
                child: ColoredBox(
                  color: Colors.black,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (_selectedItem.isVideo)
                        _VideoLayer(
                          controller: _videoController,
                          poster: _selectedItem.poster,
                          isPlaying: _isPlaying,
                          isInitializing: _isInitializing,
                          isBuffering: _isBuffering,
                          onTogglePlay: _togglePlay,
                        )
                      else
                        GestureDetector(
                          onTap: _openFullscreen,
                          child: _ImageLayer(
                            url: _selectedItem.src,
                            fit: BoxFit.contain,
                          ),
                        ),
                      const Positioned.fill(child: PreviewMediaWatermark()),
                      if (_selectedItem.isVideo)
                        const Positioned.fill(
                          child: VideoPreviewDemoBadge(),
                        ),
                      if (_selectedItem.isVideo &&
                          _videoController != null &&
                          !_isInitializing) ...[
                        Positioned(
                          right: 8,
                          top: 8,
                          child: IconButton(
                            onPressed: _openFullscreen,
                            style: IconButton.styleFrom(
                              backgroundColor:
                                  Colors.black.withValues(alpha: 0.75),
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.fullscreen, size: 18),
                            tooltip: 'Fullscreen',
                          ),
                        ),
                        Positioned(
                          right: 8,
                          bottom: 8,
                          child: IconButton(
                            onPressed: _toggleMute,
                            style: IconButton.styleFrom(
                              backgroundColor:
                                  Colors.black.withValues(alpha: 0.75),
                              foregroundColor: Colors.white,
                            ),
                            icon: Icon(
                              _isMuted ? Icons.volume_off : Icons.volume_up,
                              size: 18,
                            ),
                          ),
                        ),
                      ] else if (!_selectedItem.isVideo &&
                          _selectedItem.src.isNotEmpty)
                        Positioned(
                          right: 8,
                          top: 8,
                          child: IconButton(
                            onPressed: _openFullscreen,
                            style: IconButton.styleFrom(
                              backgroundColor:
                                  Colors.black.withValues(alpha: 0.75),
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.fullscreen, size: 18),
                            tooltip: 'Fullscreen',
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            if (_items.length > 1) ...[
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                height: 64,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = _items[index];
                    final selected = index == _selectedIndex;
                    return GestureDetector(
                      onTap: () => _selectIndex(index),
                      child: Container(
                        width: 88,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF111827)
                                : Colors.grey.shade300,
                            width: selected ? 2 : 1,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            if (item.isVideo)
                              _ThumbImage(url: item.poster ?? '')
                            else
                              _ThumbImage(url: item.src),
                            if (item.isVideo)
                              Center(
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.play_arrow,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _VideoLayer extends StatelessWidget {
  const _VideoLayer({
    required this.controller,
    required this.poster,
    required this.isPlaying,
    required this.isInitializing,
    required this.isBuffering,
    required this.onTogglePlay,
  });

  final VideoPlayerController? controller;
  final String? poster;
  final bool isPlaying;
  final bool isInitializing;
  final bool isBuffering;
  final VoidCallback onTogglePlay;

  bool get _showLoading => isInitializing || isBuffering;

  @override
  Widget build(BuildContext context) {
    final ready = controller?.value.isInitialized == true;

    return Stack(
      fit: StackFit.expand,
      children: [
        if (ready)
          ColoredBox(
            color: Colors.black,
            child: Center(
              child: AspectRatio(
                aspectRatio: controller!.value.aspectRatio,
                child: ClipRect(
                  clipBehavior: Clip.hardEdge,
                  child: VideoPlayer(controller!),
                ),
              ),
            ),
          )
        else if (poster != null && poster!.isNotEmpty)
          _ImageLayer(url: poster!, fit: BoxFit.contain)
        else
          const ColoredBox(color: Colors.black),
        if (_showLoading)
          Container(
            color: Colors.black.withValues(alpha: 0.45),
            child: const Center(
              child: _VideoLoadingIndicator(),
            ),
          ),
        if (ready && !_showLoading)
          PreviewVideoPlayOverlay(
            isPlaying: isPlaying,
            onTogglePlay: onTogglePlay,
          ),
      ],
    );
  }
}

class _VideoLoadingIndicator extends StatelessWidget {
  const _VideoLoadingIndicator();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(
          width: 36,
          height: 36,
          child: CircularProgressIndicator(
            color: Colors.white,
            strokeWidth: 2.5,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Loading preview…',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _ImageLayer extends StatelessWidget {
  const _ImageLayer({required this.url, this.fit = BoxFit.cover});

  final String url;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return const Center(
        child: Icon(Icons.image_outlined, color: Colors.white54, size: 40),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      placeholder: (_, __) => const ColoredBox(color: Color(0xFF1F2937)),
      errorWidget: (_, __, ___) => const ColoredBox(
        color: Color(0xFF1F2937),
        child: Icon(Icons.broken_image_outlined, color: Colors.white54),
      ),
    );
  }
}

class _ThumbImage extends StatelessWidget {
  const _ThumbImage({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return ColoredBox(color: Colors.grey.shade300);
    }

    return CachedNetworkImage(imageUrl: url, fit: BoxFit.cover);
  }
}

class _MediaLightboxPage extends StatefulWidget {
  const _MediaLightboxPage({
    required this.items,
    required this.initialIndex,
  });

  final List<ProductMediaItem> items;
  final int initialIndex;

  @override
  State<_MediaLightboxPage> createState() => _MediaLightboxPageState();
}

class _MediaLightboxPageState extends State<_MediaLightboxPage> {
  late final PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _pageController.dispose();
    super.dispose();
  }

  void _close() => Navigator.of(context).pop();

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _close();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                itemCount: widget.items.length,
                onPageChanged: (index) => setState(() => _currentIndex = index),
                itemBuilder: (context, index) {
                  final item = widget.items[index];
                  if (item.isVideo) {
                    return _LightboxVideoSlide(
                      item: item,
                      isActive: index == _currentIndex,
                    );
                  }
                  return _LightboxImageSlide(url: item.src);
                },
              ),
              Positioned(
                left: 8,
                top: 8,
                child: IconButton(
                  onPressed: _close,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withValues(alpha: 0.75),
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.close, size: 20),
                  tooltip: 'Exit fullscreen',
                ),
              ),
              if (widget.items.length > 1)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 16,
                  child: Text(
                    '${_currentIndex + 1} / ${widget.items.length}',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LightboxImageSlide extends StatelessWidget {
  const _LightboxImageSlide({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return ProtectedMediaFrame(
      child: InteractiveViewer(
        minScale: 1,
        maxScale: 4,
        child: Center(
          child: CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.contain,
            placeholder: (_, __) => const Center(
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            ),
            errorWidget: (_, __, ___) => const Icon(
              Icons.broken_image_outlined,
              color: Colors.white54,
              size: 48,
            ),
          ),
        ),
      ),
    );
  }
}

class _LightboxVideoSlide extends StatefulWidget {
  const _LightboxVideoSlide({
    required this.item,
    required this.isActive,
  });

  final ProductMediaItem item;
  final bool isActive;

  @override
  State<_LightboxVideoSlide> createState() => _LightboxVideoSlideState();
}

class _LightboxVideoSlideState extends State<_LightboxVideoSlide> {
  VideoPlayerController? _controller;
  bool _isMuted = true;
  bool _isInitializing = true;
  bool _isBuffering = false;
  bool _isPlaying = false;
  bool _previewGateTriggered = false;

  @override
  void initState() {
    super.initState();
    if (widget.isActive) _initVideo();
  }

  @override
  void didUpdateWidget(covariant _LightboxVideoSlide oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _initVideo();
    } else if (!widget.isActive && oldWidget.isActive) {
      _disposeVideo();
    }
  }

  @override
  void dispose() {
    _disposeVideo();
    super.dispose();
  }

  Future<void> _initVideo() async {
    _disposeVideo();
    setState(() {
      _isInitializing = true;
      _isBuffering = false;
      _isPlaying = false;
      _previewGateTriggered = false;
    });

    final controller =
        VideoPlayerController.networkUrl(Uri.parse(widget.item.src));
    _controller = controller;
    controller.addListener(_onVideoUpdate);

    try {
      await controller.initialize();
      controller.setLooping(true);
      controller.setVolume(_isMuted ? 0 : 1);
    } finally {
      if (mounted) setState(() => _isInitializing = false);
    }
  }

  void _onVideoUpdate() {
    final controller = _controller;
    if (controller == null || !mounted) return;

    enforcePreviewVideoAuthGate(
      context,
      controller,
      isGateTriggered: () => _previewGateTriggered,
      setGateTriggered: (value) => _previewGateTriggered = value,
    );

    setState(() {
      _isPlaying = controller.value.isPlaying;
      _isBuffering = controller.value.isBuffering;
    });
  }

  void _disposeVideo() {
    _controller?.removeListener(_onVideoUpdate);
    _controller?.dispose();
    _controller = null;
    _isPlaying = false;
    _isInitializing = false;
    _isBuffering = false;
  }

  Future<void> _togglePlay() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (controller.value.isPlaying) {
      await controller.pause();
      return;
    }

    setState(() => _isBuffering = true);
    await controller.play();
  }

  void _toggleMute() {
    final controller = _controller;
    if (controller == null) return;
    setState(() {
      _isMuted = !_isMuted;
      controller.setVolume(_isMuted ? 0 : 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    final ready = controller?.value.isInitialized == true;
    final showLoading = _isInitializing || _isBuffering;

    return ProtectedMediaFrame(
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (ready)
            ColoredBox(
              color: Colors.black,
              child: Center(
                child: AspectRatio(
                  aspectRatio: controller.value.aspectRatio,
                  child: ClipRect(
                    clipBehavior: Clip.hardEdge,
                    child: VideoPlayer(controller),
                  ),
                ),
              ),
            )
          else if (widget.item.poster != null && widget.item.poster!.isNotEmpty)
            _ImageLayer(url: widget.item.poster!, fit: BoxFit.contain)
          else
            const ColoredBox(color: Colors.black),
          const Positioned.fill(child: VideoPreviewDemoBadge(compact: true)),
          if (showLoading)
            Container(
              color: Colors.black.withValues(alpha: 0.45),
              child: const Center(child: _VideoLoadingIndicator()),
            ),
          if (ready && !showLoading)
            PreviewVideoPlayOverlay(
              isPlaying: _isPlaying,
              onTogglePlay: _togglePlay,
              iconSize: 72,
            ),
          if (ready)
            Positioned(
              right: 8,
              bottom: 8,
              child: IconButton(
                onPressed: _toggleMute,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withValues(alpha: 0.75),
                  foregroundColor: Colors.white,
                ),
                icon: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  size: 20,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _VideoFullscreenResult {
  const _VideoFullscreenResult({
    required this.position,
    required this.wasPlaying,
    required this.isMuted,
  });

  final Duration position;
  final bool wasPlaying;
  final bool isMuted;
}

class _VideoFullscreenPage extends StatefulWidget {
  const _VideoFullscreenPage({
    required this.videoUrl,
    required this.initialPosition,
    required this.autoPlay,
    required this.isMuted,
    this.poster,
  });

  final String videoUrl;
  final String? poster;
  final Duration initialPosition;
  final bool autoPlay;
  final bool isMuted;

  @override
  State<_VideoFullscreenPage> createState() => _VideoFullscreenPageState();
}

class _VideoFullscreenPageState extends State<_VideoFullscreenPage> {
  VideoPlayerController? _controller;
  bool _isMuted = true;
  bool _isInitializing = true;
  bool _isBuffering = false;
  bool _isPlaying = false;
  bool _previewGateTriggered = false;

  @override
  void initState() {
    super.initState();
    _isMuted = widget.isMuted;
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _initVideo();
  }

  Future<void> _initVideo() async {
    final controller =
        VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    _controller = controller;
    controller.addListener(_onVideoUpdate);

    try {
      await controller.initialize();
      controller.setLooping(true);
      controller.setVolume(_isMuted ? 0 : 1);
      if (widget.initialPosition > Duration.zero) {
        await controller.seekTo(widget.initialPosition);
      }
      if (widget.autoPlay) {
        setState(() => _isBuffering = true);
        await controller.play();
      }
    } finally {
      if (mounted) setState(() => _isInitializing = false);
    }
  }

  void _onVideoUpdate() {
    final controller = _controller;
    if (controller == null || !mounted) return;

    enforcePreviewVideoAuthGate(
      context,
      controller,
      isGateTriggered: () => _previewGateTriggered,
      setGateTriggered: (value) => _previewGateTriggered = value,
    );

    setState(() {
      _isPlaying = controller.value.isPlaying;
      _isBuffering = controller.value.isBuffering;
    });
  }

  Future<void> _togglePlay() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (controller.value.isPlaying) {
      await controller.pause();
      return;
    }

    setState(() => _isBuffering = true);
    await controller.play();
  }

  void _toggleMute() {
    final controller = _controller;
    if (controller == null) return;
    setState(() {
      _isMuted = !_isMuted;
      controller.setVolume(_isMuted ? 0 : 1);
    });
  }

  void _close() {
    final controller = _controller;
    Navigator.of(context).pop(
      _VideoFullscreenResult(
        position: controller?.value.position ?? widget.initialPosition,
        wasPlaying: controller?.value.isPlaying ?? false,
        isMuted: _isMuted,
      ),
    );
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _controller?.removeListener(_onVideoUpdate);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    final ready = controller?.value.isInitialized == true;
    final showLoading = _isInitializing || _isBuffering;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _close();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (ready)
                ColoredBox(
                  color: Colors.black,
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: controller!.value.aspectRatio,
                      child: ClipRect(
                        clipBehavior: Clip.hardEdge,
                        child: VideoPlayer(controller),
                      ),
                    ),
                  ),
                )
              else if (widget.poster != null && widget.poster!.isNotEmpty)
                _ImageLayer(url: widget.poster!, fit: BoxFit.contain)
              else
                const ColoredBox(color: Colors.black),
              const Positioned.fill(child: PreviewMediaWatermark()),
              const Positioned.fill(child: VideoPreviewDemoBadge(compact: true)),
              if (showLoading)
                Container(
                  color: Colors.black.withValues(alpha: 0.45),
                  child: const Center(child: _VideoLoadingIndicator()),
                ),
              if (ready && !showLoading)
                PreviewVideoPlayOverlay(
                  isPlaying: _isPlaying,
                  onTogglePlay: _togglePlay,
                  iconSize: 80,
                ),
              Positioned(
                left: 8,
                top: 8,
                child: IconButton(
                  onPressed: _close,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withValues(alpha: 0.75),
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.close, size: 20),
                  tooltip: 'Exit fullscreen',
                ),
              ),
              if (ready)
                Positioned(
                  right: 8,
                  top: 8,
                  child: IconButton(
                    onPressed: _toggleMute,
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.black.withValues(alpha: 0.75),
                      foregroundColor: Colors.white,
                    ),
                    icon: Icon(
                      _isMuted ? Icons.volume_off : Icons.volume_up,
                      size: 20,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
