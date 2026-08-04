import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../models/actor.dart';
import 'actor_card.dart';

class ActorRail extends StatelessWidget {
  const ActorRail({
    super.key,
    required this.actors,
    required this.isLoading,
    required this.onActorTap,
    this.onViewAll,
  });

  final List<Actor> actors;
  final bool isLoading;
  final ValueChanged<Actor> onActorTap;
  final VoidCallback? onViewAll;

  @override
  Widget build(BuildContext context) {
    if (!isLoading && actors.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(
        top: AppSpacing.md,
        bottom: AppSpacing.sm,
      ),
      child: Column(
        children: [
          if (onViewAll != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: onViewAll,
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFF111827),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  child: const Text(
                    'View All',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
          SizedBox(
            height: 118,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: isLoading ? 6 : actors.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
              itemBuilder: (context, index) {
                if (isLoading) {
                  return const _ActorSkeleton();
                }

                final actor = actors[index];
                return ActorCard(
                  actor: actor,
                  onTap: () => onActorTap(actor),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ActorSkeleton extends StatelessWidget {
  const _ActorSkeleton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 84,
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey.shade200,
                border: Border.all(color: Colors.grey.shade200, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 10,
            width: 52,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}
