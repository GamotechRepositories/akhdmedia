import 'package:go_router/go_router.dart';

import '../../screens/account/profile_hub_screen.dart';
import '../../screens/catalog/catalog_screen.dart';
import '../../screens/commerce/cart_screen.dart';
import '../../screens/commerce/checkout_screen.dart';
import '../../screens/home/home_screen.dart';
import '../../screens/info/info_screens.dart';
import '../../screens/product/product_detail_screen.dart';
import '../../screens/shell/main_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/videos',
              builder: (context, state) {
                return CatalogScreen(
                  initialCategory: state.uri.queryParameters['category'],
                  initialSubCategory: state.uri.queryParameters['subCategory'],
                  initialSearch: state.uri.queryParameters['search'],
                );
              },
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/cart',
              builder: (context, state) => const CartScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/account',
              builder: (context, state) => const ProfileHubScreen(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/product/:id',
      builder: (context, state) {
        return ProductDetailScreen(productId: state.pathParameters['id']!);
      },
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/order-success',
      builder: (context, state) => const OrderSuccessScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => const OrdersScreen(),
    ),
    GoRoute(
      path: '/support',
      builder: (context, state) => const SupportScreen(),
    ),
    GoRoute(
      path: '/about-us',
      builder: (context, state) => const AboutScreen(),
    ),
    GoRoute(
      path: '/privacy-policy',
      builder: (context, state) => const PolicyScreen(title: 'Privacy policy'),
    ),
    GoRoute(
      path: '/terms-and-conditions',
      builder: (context, state) => const PolicyScreen(title: 'Terms & conditions'),
    ),
    GoRoute(
      path: '/refund-policy',
      builder: (context, state) => const PolicyScreen(title: 'Refund policy'),
    ),
    GoRoute(
      path: '/editorial-policy',
      builder: (context, state) => const PolicyScreen(title: 'Editorial policy'),
    ),
    GoRoute(
      path: '/license-information-policy',
      builder: (context, state) =>
          const PolicyScreen(title: 'License information'),
    ),
  ],
);
