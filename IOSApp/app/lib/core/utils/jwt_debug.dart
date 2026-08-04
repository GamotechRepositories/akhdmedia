import 'dart:convert';

/// Reads the JWT `aud` claim without verifying the signature (debug only).
String? jwtAudience(String jwt) {
  try {
    final parts = jwt.split('.');
    if (parts.length < 2) return null;

    var payload = parts[1];
    final mod = payload.length % 4;
    if (mod > 0) {
      payload += '=' * (4 - mod);
    }

    final decoded = utf8.decode(base64Url.decode(payload));
    final json = jsonDecode(decoded);
    if (json is! Map<String, dynamic>) return null;
    return json['aud']?.toString();
  } catch (_) {
    return null;
  }
}
