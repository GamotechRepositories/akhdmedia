class GoogleAuthConfig {
  const GoogleAuthConfig({
    required this.webClientId,
    this.iosClientId,
  });

  final String webClientId;
  final String? iosClientId;
}
