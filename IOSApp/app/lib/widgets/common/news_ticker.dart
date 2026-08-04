import 'package:flutter/material.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';

class NewsTicker extends StatefulWidget {
  const NewsTicker({super.key, this.items});

  final List<String>? items;

  @override
  State<NewsTicker> createState() => _NewsTickerState();
}

class _NewsTickerState extends State<NewsTicker> {
  int _index = 0;

  List<String> get _items {
    final source = widget.items;
    if (source != null && source.isNotEmpty) return source;
    return Brand.tickerItems;
  }

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
      color: Colors.black,
      child: Text(
        '◆ ${_items[_index]}',
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
