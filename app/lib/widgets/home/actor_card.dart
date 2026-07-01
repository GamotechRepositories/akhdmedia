import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../models/actor.dart';

class ActorCard extends StatelessWidget {
  const ActorCard({
    super.key,
    required this.actor,
    required this.onTap,
    this.width = 84,
  });

  final Actor actor;
  final VoidCallback onTap;
  final double width;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: width,
        child: Column(
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  color: Colors.grey.shade100,
                ),
                child: ClipOval(
                  child: actor.image.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: actor.image,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) =>
                              _ActorInitial(name: actor.name),
                        )
                      : _ActorInitial(name: actor.name),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              actor.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF111827),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActorInitial extends StatelessWidget {
  const _ActorInitial({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.grey.shade200,
      child: Center(
        child: Text(
          name.isNotEmpty ? name.characters.first.toUpperCase() : '?',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Colors.grey.shade600,
          ),
        ),
      ),
    );
  }
}
