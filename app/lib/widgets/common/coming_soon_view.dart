import 'package:flutter/material.dart';

class ComingSoonView extends StatelessWidget {
  const ComingSoonView({
    super.key,
    required this.title,
    required this.phase,
    this.description,
  });

  final String title;
  final String phase;
  final String? description;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.construction_outlined, size: 44, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              phase,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
