import 'package:flutter/material.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';

class NewsTicker extends StatefulWidget {
  const NewsTicker({super.key});

  @override
  State<NewsTicker> createState() => _NewsTickerState();
}

class _NewsTickerState extends State<NewsTicker> {
  static const _items = Brand.tickerItems;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _startRotation();
  }

  void _startRotation() {
    Future.doWhile(() async {
      await Future<void>.delayed(const Duration(seconds: 4));
      if (!mounted) return false;
      setState(() => _index = (_index + 1) % _items.length);
      return true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      color: const Color(0xFF0F172A),
      child: Text(
        _items[_index],
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
