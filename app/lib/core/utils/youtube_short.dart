const kPreviewAuthLimitSeconds = 10;

/// YouTube rejects embeds served from an opaque origin (error 153), so the
/// in-app player page is hosted under this origin and reports it to the embed.
const kYoutubeEmbedOrigin = 'https://akhdmedia.com';

String parseYoutubeVideoId(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return '';

  final uri = Uri.tryParse(trimmed);
  if (uri == null) return '';

  final host = uri.host.replaceFirst(RegExp(r'^www\.', caseSensitive: false), '').toLowerCase();

  if (host == 'youtu.be') {
    final id = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : '';
    return id;
  }

  if (host.contains('youtube.com') || host.contains('youtube-nocookie.com')) {
    final segments = uri.pathSegments.where((part) => part.isNotEmpty).toList();
    if (segments.isEmpty) return '';

    if (segments.first == 'shorts' && segments.length > 1) return segments[1];
    if (segments.first == 'embed' && segments.length > 1) return segments[1];
    if (segments.first == 'watch') return uri.queryParameters['v'] ?? '';
    if (segments.first == 'live' && segments.length > 1) return segments[1];
  }

  return '';
}

bool isValidYoutubeUrl(String url) => parseYoutubeVideoId(url).isNotEmpty;

String getYoutubeEmbedUrl(String url) {
  final videoId = parseYoutubeVideoId(url);
  if (videoId.isEmpty) return '';
  return 'https://www.youtube.com/embed/$videoId';
}

String normalizeYoutubeEmbedUrl(String url) => getYoutubeEmbedUrl(url);

String resolveYoutubeEmbedUrl(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return '';
  if (trimmed.contains('/embed/')) {
    return trimmed.split('?').first.split('#').first;
  }
  return getYoutubeEmbedUrl(trimmed);
}

String buildYoutubeEmbedSrc(
  String url, {
  bool autoplay = false,
  String origin = '',
}) {
  final embedUrl = resolveYoutubeEmbedUrl(url);
  if (embedUrl.isEmpty) return '';

  final params = <String, String>{
    'rel': '0',
    'modestbranding': '1',
    'playsinline': '1',
    // Keep playback in-app so the AKHD watermark overlay cannot be escaped via YouTube fullscreen.
    'fs': '0',
    'iv_load_policy': '3',
    // Hide native bar (share, watch later, etc.); preview uses our own play overlay.
    'controls': '0',
    // Preferred starting quality (falls back if 1440p / 2K is unavailable).
    'vq': 'hd1440',
  };
  if (autoplay) {
    params['autoplay'] = '1';
  }
  if (origin.isNotEmpty) {
    params['origin'] = origin;
    params['widget_referrer'] = origin;
  }

  final query = params.entries
      .map((entry) => '${entry.key}=${Uri.encodeComponent(entry.value)}')
      .join('&');
  return '$embedUrl?$query';
}

/// Allow only the initial embed document / about pages — block watch, channel, share links.
bool isAllowedYoutubeEmbedNavigation(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return false;

  final lower = trimmed.toLowerCase();
  if (lower.startsWith('about:') ||
      lower.startsWith('data:') ||
      lower.startsWith('blob:')) {
    return true;
  }

  final uri = Uri.tryParse(trimmed);
  if (uri == null) return false;

  final host = uri.host.replaceFirst(RegExp(r'^www\.', caseSensitive: false), '').toLowerCase();
  if (host.isEmpty) return true;

  final isYoutubeHost = host == 'youtube.com' ||
      host == 'youtube-nocookie.com' ||
      host == 'youtu.be' ||
      host.endsWith('.youtube.com') ||
      host.endsWith('.youtube-nocookie.com');

  if (!isYoutubeHost) return false;

  // Keep playback inside the embed player only.
  final path = uri.path.toLowerCase();
  return path.startsWith('/embed/') || path.startsWith('/s/embed/');
}
