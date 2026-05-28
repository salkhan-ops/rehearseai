# Paddle Placeholder

RehearseAI uses Paddle for future subscription billing.

## MVP status

- `/api/payments/plans` returns Free, Pro, and Coach plans.
- `/api/payments/paddle/webhook` accepts webhook payloads.
- Signature verification is marked as a TODO until real Paddle credentials are available.
- No alternate payment provider integration exists.

## Sandbox setup

1. Create a Paddle sandbox account.
2. Create products for Pro and Coach.
3. Add monthly prices.
4. Store price IDs in `PADDLE_PRO_PRICE_ID` and `PADDLE_COACH_PRICE_ID`.
5. Configure webhook URL: `https://YOUR_BACKEND/api/payments/paddle/webhook`.
6. Add `PADDLE_WEBHOOK_SECRET`.
7. Add hosted sandbox checkout links to `NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL` and `NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL`.

## Payoneer

Payoneer is documented as the business payout account outside the app. RehearseAI does not integrate Payoneer in product code.
