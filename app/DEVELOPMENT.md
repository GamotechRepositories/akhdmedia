# AKHD Media Flutter App — Phased Development

API base: `https://api.akhdmedia.com/api`

## Frontend sections mapped to Flutter screens

| Section | Web route | Flutter screen | Phase |
|---------|-----------|----------------|-------|
| Home | `/` | `HomeScreen` | 1 ✅ |
| Catalog / Videos | `/videos` | `CatalogScreen` | 1 ✅ |
| Product detail | `/product/:id` | `ProductDetailScreen` | 1 ✅ |
| Cart | `/cart` | `CartScreen` | 2 |
| Checkout | `/checkout` | `CheckoutScreen` | 2 |
| Order success | `/order-success` | `OrderSuccessScreen` | 2 |
| Login / Register | `/login`, `/register` | `LoginScreen`, `RegisterScreen` | 3 |
| Profile / Orders | `/profile`, `/orders` | `ProfileScreen`, `OrdersScreen` | 3 |
| Support | `/support` | `SupportScreen` | 4 |
| Policies & About | `/privacy-policy`, etc. | `PolicyScreen`, `AboutScreen` | 4 |

## Phase 1 — Browse (current)

- App shell with bottom navigation
- API client + catalog provider
- Home: hero, news ticker, categories, latest products
- Catalog: search + category filter + tight product grid
- Product detail: media, price, specs, related products
- Tight card layout (`TightProductCard`)

## Phase 2 — Commerce

- Session cookie handling (`fv_session`) for cart
- Cart CRUD, checkout form, Razorpay mobile integration
- Order success screen

## Phase 3 — Account

- User auth (`fv_user_token`), login/register
- Profile edit, order history

## Phase 4 — Info & polish

- Support form, static policy pages
- Pull-to-refresh, offline states, deep links

## Run

```bash
cd app
flutter pub get
flutter run
```

Override API URL:

```bash
flutter run --dart-define=API_BASE_URL=https://api.akhdmedia.com/api
```
