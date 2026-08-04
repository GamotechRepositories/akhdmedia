import 'package:share_plus/share_plus.dart';

import '../../models/product.dart';

String buildProductShareUrl(Product product) {
  const siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://akhdmedia.com',
  );
  final base = siteUrl.replaceAll(RegExp(r'/+$'), '');
  return '$base/product/${product.id}';
}

Future<void> shareProduct(Product product) async {
  final url = buildProductShareUrl(product);
  await Share.share(url, subject: product.name);
}
