import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/order_formatters.dart';
import '../../models/order.dart';

class PaymentStatusBadge extends StatelessWidget {
  const PaymentStatusBadge({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final colors = OrderFormatters.paymentStatusColors(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.bg,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        OrderFormatters.paymentStatusLabel(status).toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: colors.text,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class OrderItemThumbnail extends StatelessWidget {
  const OrderItemThumbnail({
    super.key,
    required this.imageUrl,
    this.width = 80,
    this.height = 56,
  });

  final String imageUrl;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text('No image', style: TextStyle(fontSize: 10, color: Colors.grey.shade400)),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: BoxFit.cover,
      ),
    );
  }
}

class OrderListItemPreview extends StatelessWidget {
  const OrderListItemPreview({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final first = order.firstItem;
    final count = order.itemCount;
    final clipCount = order.items.length;

    return Row(
      children: [
        OrderItemThumbnail(imageUrl: first?.image ?? ''),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                first?.name ?? 'Order items',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                '$count ${count == 1 ? 'item' : 'items'}${clipCount > 1 ? ' · $clipCount clips' : ''}',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
