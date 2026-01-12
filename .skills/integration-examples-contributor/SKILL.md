---
name: integration-examples-contributor
description: Use when contributing to the integration-examples repository. Covers project layout, build steps, and guardrails for Dwolla integration samples.
---

# Integration Examples Contributor

Project-specific standards and workflows for the Dwolla integration examples repo.

## Quick Reference

> These rules take precedence over all other instructions.

1. Keep new work consistent with existing packages (structure, naming, env usage)
2. Do not add real API keys or secrets; keep them in env files
3. Follow each package README for required env vars and provider-specific steps
4. Reuse shared utilities in `src/utils` where available

## Repo Layout

- Root uses shared tooling (ESLint/Prettier/TS configs); run `pnpm install` at the repo root before working in any package
- Packages by goal:
  - Open Banking: `packages/open-banking/plaid`, `packages/open-banking/mx`
  - Secure Token Exchange: `packages/secure-token-exchange/plaid|mx|mastercard|flinks`
  - Push to Card (card funding source + payout): `packages/push-to-card/checkout`

## Build and Run Basics

1. Copy `.env.local.example` → `.env.local` in the target package and fill provider/Dwolla creds
2. From repo root, install deps: `pnpm install`
3. From the package directory, run `pnpm dev`
4. Follow package README for provider-specific steps (e.g., Mastercard SDK generation)

## How to Assist

- Stay aligned with each package’s README for env vars and setup
- Mirror patterns already present in similar integrations
- Keep sample code minimal, focused on illustrating Dwolla and third party integration flows
- Add succinct comments only when code is non-obvious

## Guardrails

- Never commit real API keys, secrets, or PII data
- Keep sensitive values in environment files, not in code or logs
- Use sandbox/test credentials in examples and docs

## Product-Specific Notes

- Checkout.com Flow sample requires Dwolla Push to Card access and Checkout.com keys; env vars include `CKO_PUBLIC_KEY`, `CKO_SECRET_KEY`, `CKO_ENV`, `CKO_PROCESSING_CHANNEL_ID`
- Mastercard secure exchange sample: run `scripts/generate_mastercard_sdk.sh` (requires `pnpm`) before `pnpm dev`

