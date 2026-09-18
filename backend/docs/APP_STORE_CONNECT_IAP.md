# App Store Connect IAP automation

When admin creates a product, the backend:

1. Sets `purchaseType=APPLE_IAP` and `appleProductId=com.akhdmedia.{video|image}.{mongoId}`
2. Calls App Store Connect API to create a **Non-Consumable** IAP with that product id
3. Adds **en-US** localization + USA base price (nearest tier from INR ÷ `APPLE_ASC_INR_TO_USD_RATE`)

## Required env

```bash
APPLE_ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ASC_KEY_ID=XXXXXXXXXX
APPLE_ASC_APP_ID=1234567890          # App Store Connect numeric Apple ID
APPLE_ASC_BUNDLE_ID=com.akhdmedia.ios
APPLE_ASC_PRIVATE_KEY_PATH=/secure/AuthKey_XXXXXXXXXX.p8
# or: APPLE_ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_ASC_SYNC_ENABLED=true
APPLE_ASC_INR_TO_USD_RATE=83
```

Create the key at: **App Store Connect → Users and Access → Integrations → App Store Connect API**  
Access: Admin / App Manager / Account Holder.

## Backfill existing products

```bash
cd backend
node scripts/syncAppleIapToAppStoreConnect.js --limit 5   # smoke test
node scripts/syncAppleIapToAppStoreConnect.js --pending   # only unsynced
node scripts/syncAppleIapToAppStoreConnect.js             # all active
```

## Still manual in App Store Connect

ASC API creates the IAP + metadata + price, but Apple still requires:

- A **review screenshot** for the IAP
- **First IAP** submitted with an app binary via App Store Connect UI
- Later IAPs submitted for review (API review-submission flow or UI)

Until approved, production purchases may fail; Sandbox / StoreKit config still works for local testing.

## Local StoreKit file

`Configuration.storekit` is **simulator-only**. After adding many products:

```bash
node scripts/generateStoreKitConfiguration.js
```
