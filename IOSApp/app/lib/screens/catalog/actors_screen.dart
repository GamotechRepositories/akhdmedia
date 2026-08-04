import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/home/actor_card.dart';
import '../shell/main_shell.dart';

class ActorsScreen extends StatefulWidget {
  const ActorsScreen({super.key});

  @override
  State<ActorsScreen> createState() => _ActorsScreenState();
}

class _ActorsScreenState extends State<ActorsScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadCatalog();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const StoreAppBar(title: 'Actors'),
      body: Consumer<CatalogProvider>(
        builder: (context, catalog, _) {
          if (catalog.loading && catalog.actors.isEmpty) {
            return const LoadingView(message: 'Loading actors...');
          }
          if (catalog.error != null && catalog.actors.isEmpty) {
            return ErrorView(
              message: catalog.error!,
              onRetry: () => catalog.loadCatalog(force: true),
            );
          }

          final query = _searchController.text.trim().toLowerCase();
          final actors = catalog.actors.where((actor) {
            if (query.isEmpty) return true;
            return actor.name.toLowerCase().contains(query) ||
                actor.slug.toLowerCase().contains(query) ||
                actor.searchKeywords
                    .any((keyword) => keyword.toLowerCase().contains(query));
          }).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.sm,
                  AppSpacing.lg,
                  AppSpacing.sm,
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Search actors by name...',
                    prefixIcon: Icon(Icons.search, size: 20),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              Expanded(
                child: actors.isEmpty
                    ? Center(
                        child: Text(
                          query.isEmpty
                              ? 'No actors available right now.'
                              : 'No actors found for "$query".',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: AppSpacing.md,
                          mainAxisSpacing: AppSpacing.lg,
                          childAspectRatio: 0.72,
                        ),
                        itemCount: actors.length,
                        itemBuilder: (context, index) {
                          final actor = actors[index];
                          return ActorCard(
                            actor: actor,
                            width: double.infinity,
                            onTap: () => context.go(
                              '/videos?actor=${Uri.encodeComponent(actor.id)}',
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
