import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/utils/youtube_short.dart';
import '../common/preview_play_icon.dart';

class YoutubeShortPreview extends StatefulWidget {
  const YoutubeShortPreview({
    super.key,
    required this.url,
    this.poster,
    this.isAuthenticated = false,
    this.onPreviewLimit,
    this.onPlayingChange,
    this.autoPlay = false,
    this.immersive = false,
  });

  final String url;
  final String? poster;
  final bool isAuthenticated;
  final VoidCallback? onPreviewLimit;
  final ValueChanged<bool>? onPlayingChange;
  final bool autoPlay;
  final bool immersive;

  @override
  State<YoutubeShortPreview> createState() => _YoutubeShortPreviewState();
}

class _YoutubeShortPreviewState extends State<YoutubeShortPreview> {
  WebViewController? _controller;
  Timer? _previewTimer;
  bool _isActive = false;
  bool _limitTriggered = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoPlay) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _startPreview();
      });
    }
  }

  @override
  void didUpdateWidget(covariant YoutubeShortPreview oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.url != widget.url) {
      _resetPreview(notify: false);
      if (widget.autoPlay && !_limitTriggered) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _startPreview();
        });
      }
      return;
    }

    if (widget.isAuthenticated && _limitTriggered) {
      _limitTriggered = false;
    }

    if (widget.autoPlay && !_isActive && !_limitTriggered) {
      _startPreview();
    }
  }

  @override
  void dispose() {
    _previewTimer?.cancel();
    super.dispose();
  }

  void _setPlaying(bool next) {
    if (_isActive == next) return;
    setState(() => _isActive = next);
    widget.onPlayingChange?.call(next);
  }

  void _resetPreview({bool notify = true}) {
    _previewTimer?.cancel();
    _previewTimer = null;
    _controller = null;
    _limitTriggered = false;
    if (notify) {
      _setPlaying(false);
    } else {
      _isActive = false;
    }
  }

  Future<void> _startPreview() async {
    final embedSrc = buildYoutubeEmbedSrc(
      widget.url,
      autoplay: true,
      origin: kYoutubeEmbedOrigin,
    );
    if (embedSrc.isEmpty || _limitTriggered) return;

    final html = '''
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <meta name="referrer" content="origin">
    <style>
      html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
      .frame { position: relative; width: 100%; height: 100%; }
      iframe { border: 0; width: 100%; height: 100%; display: block; }
      /* Drawn inside the WebView so it stays above the YouTube iframe (Flutter overlays cannot). */
      .wm {
        position: absolute;
        inset: 0;
        z-index: 5;
        pointer-events: none;
        overflow: hidden;
      }
      .wm::before {
        content: '';
        position: absolute;
        inset: -20%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Ctext x='160' y='92' text-anchor='middle' dominant-baseline='middle' fill='rgba(255%2C255%2C255%2C0.24)' font-family='system-ui%2C-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2Csans-serif' font-size='15' font-weight='800' letter-spacing='5' transform='rotate(-24 160 92)'%3EAKHDMEDIA%20PREVIEW%3C/text%3E%3C/svg%3E");
        background-repeat: repeat;
        background-size: 300px 170px;
      }
      /* Channel/title stay visible; taps on chrome cannot open YouTube. */
      .click-shield {
        position: absolute;
        z-index: 6;
        background: transparent;
      }
      .click-shield-top { top: 0; left: 0; right: 0; height: 64px; }
      .click-shield-logo { right: 0; bottom: 0; width: 120px; height: 48px; }
    </style>
  </head>
  <body>
    <div class="frame">
      <iframe
        src="$embedSrc"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        referrerpolicy="origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      ></iframe>
      <div class="wm" aria-hidden="true"></div>
      <div class="click-shield click-shield-top" aria-hidden="true"></div>
      <div class="click-shield click-shield-logo" aria-hidden="true"></div>
    </div>
  </body>
</html>
''';

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            if (isAllowedYoutubeEmbedNavigation(request.url)) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadHtmlString(html, baseUrl: kYoutubeEmbedOrigin);

    setState(() {
      _controller = controller;
      _isActive = true;
    });
    widget.onPlayingChange?.call(true);

    if (!widget.isAuthenticated && widget.onPreviewLimit != null) {
      _previewTimer?.cancel();
      _previewTimer = Timer(
        const Duration(seconds: kPreviewAuthLimitSeconds),
        () {
          if (!mounted || _limitTriggered || widget.isAuthenticated) return;
          _limitTriggered = true;
          _resetPreview();
          widget.onPreviewLimit?.call();
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final embedUrl = resolveYoutubeEmbedUrl(widget.url);

    if (embedUrl.isEmpty) {
      return const Center(
        child: Text(
          'Invalid YouTube Short URL',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    if (_isActive && _controller != null) {
      return WebViewWidget(controller: _controller!);
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        if (widget.poster != null && widget.poster!.isNotEmpty)
          Image.network(
            widget.poster!,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF111827)),
          )
        else
          const ColoredBox(color: Color(0xFF111827)),
        Material(
          color: Colors.black26,
          child: InkWell(
            onTap: _startPreview,
            child: Center(
              child: PreviewPlayIcon(
                size: widget.immersive ? 72 : 56,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
