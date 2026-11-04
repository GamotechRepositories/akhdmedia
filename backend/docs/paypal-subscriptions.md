# PayPal recurring subscriptions

The website subscription checkout supports Razorpay for India and PayPal for international buyers. PayPal subscription prices are converted from the INR plan total (including the existing GST calculation) to USD at signup. The customer sees the exact recurring USD price before opening PayPal and authorizes automatic renewal there. That price stays fixed for the subscription. Existing one-time PayPal checkout configuration is unchanged.

## Configuration

Use a PayPal Business REST app with Subscriptions enabled for the merchant account. Account eligibility and live international receiving capability must be confirmed in PayPal.

Required backend environment variables:

- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`: credentials for the same REST app.
- `PAYPAL_MODE=sandbox` for testing; `live` or `production` for production.
- `PAYPAL_WEBHOOK_ID`: ID of the webhook registered in that app and environment.
- `FRONTEND_URL`: first comma-separated URL is the website used for return/cancel redirects.
- `PAYPAL_USD_INR_RATE`: existing fallback rate if the live currency rate is unavailable.

PayPal subscriptions always use USD independently of `PAYPAL_CURRENCY`, which controls the existing one-time checkout. The PayPal subscription option remains hidden until credentials and webhook ID are set.

Register this HTTPS webhook in the PayPal REST app:

`https://<backend-host>/api/subscriptions/paypal/webhook`

Select these events:

- `PAYMENT.SALE.COMPLETED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

Copy the webhook ID into backend configuration, restart the backend, and deploy the website changes. Sandbox and live webhook IDs are different. Do not put the client secret in the frontend.

## API contract

- `GET /api/subscriptions/plans` now includes `data.providers.paypal` (boolean).
- Authenticated `POST /api/subscriptions/checkout`: existing body, with `paymentProvider: "paypal"`. Returns `data.subscriptionId` (local ID) and `data.paypal` with `subscriptionId` (PayPal ID), `approvalUrl`, `amount`, `currency`, and `frequency: { unit, count }`. Free plans keep the existing direct activation response.
- Authenticated `POST /api/subscriptions/paypal/verify`: `{ "subscriptionId": "<local ID>" }`. Checks ownership, stored PayPal plan and custom ID, and completed transactions server-side. Returns `data.subscription`; HTTP 409 means payment has not completed yet. Repeating verification is safe.
- `POST /api/subscriptions/paypal/webhook`: verifies the signature with PayPal before reconciling the subscription against PayPal APIs. Unsupported authenticated events are acknowledged. Failed verification and upstream failures return errors for rejection/retry.
- Existing authenticated `POST /api/subscriptions/cancel` cancels the PayPal agreement immediately to prevent future charges, while local access remains available until the paid period ends. Provider errors propagate; a failed cancellation never reports success.

Only completed payments in the stored currency and amount activate or renew access. Approval alone does not. An atomic payment timestamp guard prevents duplicate or concurrent delivery from resetting quota. Renewal restores the plan's quota; cancellation, suspension, and payment failure do not grant extra access. Expiry uses the purchased billing frequency, including calendar month/year boundaries. Reconciliation checks the latest 31 days of transactions; configure webhook delivery before accepting purchases and monitor failed deliveries.

The existing invoices retain INR plan accounting; the web success receipt additionally shows the actual USD charge and PayPal payment reference. Existing GST rules are unchanged; this change does not determine international tax treatment.

## Validation

Run `node --test backend/tests/paypalSubscriptions.test.js` and `cd frontend && npm run build`.

Before production, use sandbox merchant and international buyer accounts to approve a subscription, confirm the initial completed sale, replay its webhook after consuming quota, verify a renewal restores quota, cancel from both the website and PayPal, and test failed payment delivery. Confirm that cancellation preserves the paid period and prevents subsequent billing. Local tests mock PayPal and persistence; they do not establish merchant eligibility, real webhook delivery, or live payment success.

The native apps currently have one-time PayPal checkout but no separate subscription checkout implementation. These changes add subscription support to the shared backend and website.
