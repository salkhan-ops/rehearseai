# Paddle Placeholder

RehearseAI uses Paddle for future subscription billing.
See `architecture.md` for how billing fits into the larger application boundary.

## MVP status

- `/api/payments/plans` returns Free, Pro, and Coach plans.
- `/api/payments/paddle/webhook` accepts webhook payloads.
- Signature verification is marked as a TODO until real Paddle credentials are available.
- Subscription management endpoints exist for current plan, cancellation, reactivation, portal link, and account deletion request flows.
- No alternate payment provider integration exists.

## Sandbox setup

1. Create a Paddle sandbox account.
2. Create products for Pro and Coach.
3. Add monthly prices.
4. Store price IDs in `PADDLE_PRO_PRICE_ID` and `PADDLE_COACH_PRICE_ID`.
5. Configure webhook URL: `https://YOUR_BACKEND/api/payments/paddle/webhook`.
6. Add `PADDLE_WEBHOOK_SECRET`.
7. Add hosted sandbox checkout links to `NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL` and `NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL`.

## Production requirements

- Verify Paddle webhook signatures before trusting billing events.
- Store `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` only in backend secrets.
- Persist customer, subscription, and checkout state in Firestore billing collections.
- Use admin audit logs for manual entitlement changes.
- Keep frontend checkout URLs public, but never expose private Paddle API keys.

## Payoneer

Payoneer is documented as the business payout account outside the app. RehearseAI does not integrate Payoneer in product code.
