import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/category_content.dart';
import 'home_product_section.dart';

class DualCategorySections extends StatelessWidget {
  const DualCategorySections({
    super.key,
    required this.sections,
    required this.onProductTap,
    required this.onViewAll,
    this.isLoading = false,
  });

  final List<DualGridSection> sections;
  final ValueChanged<String> onProductTap;
  final ValueChanged<String> onViewAll;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Padding(
        padding: const EdgeInsets.only(top: AppSpacing.section),
        child: HomeProductSection(
          title: 'Loading coverage...',
          products: const [],
          onProductTap: (_) {},
          isLoading: true,
        ),
      );
    }
    if (sections.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        for (var i = 0; i < sections.length; i++) ...[
          HomeProductSection(
            title: sections[i].title,
            products: sections[i].products,
            onProductTap: onProductTap,
            onViewAll: () => onViewAll(sections[i].categorySlug),
            tightTop: i == 0,
          ),
        ],
        const SizedBox(height: AppSpacing.section),
      ],
    );
  }
}
