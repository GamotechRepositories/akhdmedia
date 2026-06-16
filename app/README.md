# AKHD Media — Flutter App

Mobile storefront mirroring the web frontend, connected to `https://api.akhdmedia.com/api`.

## Run

```bash
cd app
flutter pub get
flutter run
```

## Phased plan

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full screen map and phases.

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Home, catalog, product detail, tight cards | ✅ Started |
| 2 | Cart, checkout, Razorpay | Planned |
| 3 | Login, register, profile, orders | Planned |
| 4 | Support, policies, polish | Planned |

## Structure

```
lib/
  core/          config, theme, routing
  models/        category, product
  services/      API + catalog
  providers/     catalog state
  screens/       one folder per section
  widgets/       tight cards, shared UI
```
