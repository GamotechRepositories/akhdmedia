import '../../models/image_size_info.dart';

const imageSizeOrder = [
  'SD',
  'HD',
  'Full HD',
  '2K',
  '4K',
  '6K',
  '8K',
];

List<MapEntry<String, ProductImageSize>> sortImageSizeEntries(
  Map<String, ProductImageSize> imageSizes,
) {
  final standard = imageSizeOrder
      .where(imageSizes.containsKey)
      .map((key) => MapEntry(key, imageSizes[key]!));

  final custom = imageSizes.entries
      .where((entry) => !imageSizeOrder.contains(entry.key));

  return [...standard, ...custom];
}

String getDefaultImageSize(Map<String, ProductImageSize> imageSizes) {
  if (imageSizes.containsKey('4K')) return '4K';
  final sorted = sortImageSizeEntries(imageSizes);
  return sorted.isNotEmpty ? sorted.last.key : 'HD';
}

String getProductTypeLabel(bool isVideo) =>
    isVideo ? 'Video Footage' : 'Stock Image';

String? getHighestQualityLabel(Map<String, ProductImageSize> imageSizes) {
  final entries = sortImageSizeEntries(imageSizes);
  if (entries.isNotEmpty) return entries.last.key;
  return null;
}

String formatQualityBadgeLabel(String label) {
  final trimmed = label.trim();
  if (trimmed.isEmpty) return 'HD';
  if (RegExp(r'^full\s*hd$', caseSensitive: false).hasMatch(trimmed)) {
    return 'FHD';
  }
  const aliases = {'Full HD': 'FHD'};
  return aliases[trimmed] ?? trimmed;
}

String resolveQualityBadgeLabel({
  required Map<String, ProductImageSize> imageSizes,
  Map<String, dynamic>? videoInfo,
}) {
  final tierLabel = getHighestQualityLabel(imageSizes);
  if (tierLabel != null) {
    return formatQualityBadgeLabel(tierLabel);
  }

  final quality = videoInfo?['quality']?.toString().trim() ?? '';
  if (quality.isNotEmpty) {
    return formatQualityBadgeLabel(quality.split(' ').first);
  }

  return 'HD';
}
