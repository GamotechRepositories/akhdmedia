const kPreviewAuthLimitSeconds = 10;

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

String buildYoutubeEmbedSrc(String url, {bool autoplay = false}) {
  final embedUrl = resolveYoutubeEmbedUrl(url);
  if (embedUrl.isEmpty) return '';

  final params = <String, String>{
    'rel': '0',
    'modestbranding': '1',
    'playsinline': '1',
    'fs': '1',
    'controls': '1',
  };
  if (autoplay) {
    params['autoplay'] = '1';
  }

  final query = params.entries
      .map((entry) => '${entry.key}=${Uri.encodeComponent(entry.value)}')
      .join('&');
  return '$embedUrl?$query';
}
