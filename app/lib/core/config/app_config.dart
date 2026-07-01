/// Mirrors `frontend/src/api/axios.js` (`VITE_API_URL || '/api'`).
class AppConfig {
  /// Override via `--dart-define=API_BASE_URL=...` (same role as `VITE_API_URL`).
  static const _rawApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.akhdmedia.com/api',
  );

  /// Ensures requests hit `/api/...` even if the define omits the suffix.
  static String get apiBaseUrl {
    var url = _rawApiBaseUrl.trim();
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (!url.endsWith('/api')) {
      url = '$url/api';
    }
    return url;
  }
}
