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

Override API URL (mirrors `VITE_API_URL` on the website):

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5008/api
```

Override Google client ID (mirrors `VITE_GOOGLE_CLIENT_ID`):

```bash
flutter run --dart-define=GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

## Google Sign-In (Android / iOS)

Native sign-in uses the **Web** OAuth client ID as `serverClientId` (same as the website). A separate **Android** OAuth client in Google Cloud is required or account selection will silently fail.

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **Web client** — must match `AuthConfig.googleClientId` / `VITE_GOOGLE_CLIENT_ID`:
   `581422572984-eiv7vs7tdl744g2pnd5m4jh95d6p054t.apps.googleusercontent.com`
3. **Create OAuth client → Android**
   - Package name: `com.akhdmedia.app` (see `android/app/build.gradle.kts`)
   - SHA-1 fingerprint:

```bash
cd app/android && ./gradlew signingReport
```

Copy the **debug** SHA-1 for local `flutter run`. Add **release** SHA-1 before Play Store builds.

4. Copy the new Android client ID for the server env var below.

### 2. Production server `.env`

```env
GOOGLE_CLIENT_ID=581422572984-eiv7vs7tdl744g2pnd5m4jh95d6p054t.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=<android-oauth-client-id>.apps.googleusercontent.com
```

`GOOGLE_CLIENT_ID` is required. `GOOGLE_ANDROID_CLIENT_ID` is recommended so the API accepts tokens whose `aud` is the Android client.

Redeploy the backend after changing env vars. Optional diagnostic: `GET /api/user/auth/google/status`.

### 3. App config (already wired)

- `app/lib/core/constants/auth_config.dart` — web client ID
- `android/app/src/main/res/values/strings.xml` — `default_web_client_id`

After Google Cloud changes, **fully restart** the app (not hot reload).
