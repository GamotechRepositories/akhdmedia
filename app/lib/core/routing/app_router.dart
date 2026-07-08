import 'package:go_router/go_router.dart';

import '../../screens/account/forgot_password_screen.dart';
import '../../screens/account/login_screen.dart';
import '../../screens/account/orders_screen.dart';
import '../../screens/account/profile_hub_screen.dart';
import '../../screens/account/profile_screen.dart';
import '../../screens/account/register_screen.dart';
import '../../screens/catalog/actors_screen.dart';
import '../../screens/catalog/catalog_screen.dart';
import '../../screens/commerce/cart_screen.dart';
import '../../screens/commerce/checkout_screen.dart';
import '../../screens/commerce/order_detail_screen.dart';
import '../../screens/home/home_screen.dart';
import '../../screens/info/info_screens.dart';
import '../../screens/info/policies_legal_screen.dart';
import '../../screens/info/support_screen.dart';
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
                  initialActor: state.uri.queryParameters['actor'],
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
      path: '/actors',
      builder: (context, state) => const ActorsScreen(),
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
      builder: (context, state) {
        return OrderSuccessScreen(
          orderId: state.uri.queryParameters['orderId'],
        );
      },
    ),
    GoRoute(
      path: '/orders/:id',
      builder: (context, state) {
        return OrderDetailScreen(
          orderId: state.pathParameters['id']!,
          fromOrders: state.uri.queryParameters['fromOrders'] == '1',
        );
      },
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) {
        return LoginScreen(redirectTo: state.uri.queryParameters['redirect']);
      },
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) {
        return ForgotPasswordScreen(
          redirectTo: state.uri.queryParameters['redirect'],
        );
      },
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) {
        return RegisterScreen(redirectTo: state.uri.queryParameters['redirect']);
      },
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => OrdersScreen(
        focusOrderId: state.uri.queryParameters['focus'],
      ),
    ),
    GoRoute(
      path: '/support',
      builder: (context, state) => const SupportScreen(),
    ),
    GoRoute(
      path: '/policies-legal',
      builder: (context, state) => const PoliciesLegalScreen(),
    ),
    GoRoute(
      path: '/about-us',
      builder: (context, state) => const AboutScreen(),
    ),
    GoRoute(
      path: '/privacy-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'Privacy Policy',
        policySlug: 'privacy-policy',
      ),
    ),
    GoRoute(
      path: '/terms-and-conditions',
      builder: (context, state) => const PolicyScreen(
        title: 'Terms & Conditions',
        policySlug: 'terms-and-conditions',
      ),
    ),
    GoRoute(
      path: '/refund-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'Refund Policy',
        policySlug: 'refund-policy',
      ),
    ),
    GoRoute(
      path: '/editorial-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'Editorial Policy',
        policySlug: 'editorial-policy',
      ),
    ),
    GoRoute(
      path: '/license-information-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'License Information Policy',
        policySlug: 'license-information-policy',
      ),
    ),
    GoRoute(
      path: '/legal-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'Legal Policy',
        policySlug: 'legal-policy',
      ),
    ),
    GoRoute(
      path: '/media-accreditation-policy',
      builder: (context, state) => const PolicyScreen(
        title: 'MEDIA ACCREDITATION & EDITORIAL EVENT COVERAGE POLICY',
        policySlug: 'media-accreditation-policy',
      ),
    ),
  ],
);
