# Dwolla Push to Card — Checkout.com Flow

This sample demonstrates how to add a debit card as a Dwolla funding source using Checkout.com Flow and then initiate a Push to Card payout. It follows the sequence outlined in `docs/adding-a-debit-card.mdx` and `docs/push-to-card.mdx`.

## What it shows
- Create a Dwolla Customer
- Create a Checkout.com payment session and mount Flow (client)
- Retrieve the Checkout.com card token (`src_...`) server-side
- Create a Dwolla card funding source with `cardToken`
- Initiate a Push to Card transfer from a settlement account to the card

## Prerequisites
- Dwolla Push to Card is enabled for your account (premium feature; request access if needed).
- A Checkout.com account with public/secret keys for Flow.
- A Checkout.com settlement account funding source is configured in Dwolla. This is done in the Dwolla Dashboard (outside this app) using the CRB account details provided by Checkout.com and is required as the source for payouts. See `https://developers.dwolla.com/docs/push-to-card#the-settlement-account` for details.
- Settlement account is funded (good funds model): payouts only succeed if funds are already available in the settlement account.

## Getting started
1. Run `pnpm install` from the repo root to pick up shared toolchain.
2. Copy `.env.local.example` to `.env.local` and fill in credentials.
3. `pnpm dev` to start the Next.js app.
4. Follow the UI steps: create customer → add card → send payout.

## Environment variables
See `.env.local.example` for required values:
- Dwolla: `DWOLLA_ENV`, `DWOLLA_KEY`, `DWOLLA_SECRET`
- Checkout.com: `CKO_PUBLIC_KEY`, `CKO_SECRET_KEY`, `CKO_ENV` (`sandbox` or `production`)

## Notes
- The client loads Checkout.com Flow directly from `https://checkout-web-components.checkout.com` for PCI compliance (do not self-host).
- Push to Card requires Dwolla approval and a configured settlement account. In Sandbox, mock values are sufficient for UI flow; real payouts need production approvals and funding.

