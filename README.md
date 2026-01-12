# Dwolla Integration Examples

**Reference implementations** for adding bank accounts and cards to Dwolla—from Open Banking connections to secure token exchange and Push-to-Card.

> Built for developers who want to see complete, working examples of how these integrations work, not just isolated code snippets.

This repository contains end-to-end prototype applications demonstrating how Dwolla integrates with payment infrastructure providers like Plaid, MX, and Checkout.com to handle funding source connections.

Each application uses Next.js/React and TypeScript, showcasing recommended patterns for error handling, token management, and secure integrations.

## Prerequisites

Before getting started, ensure you have:

- **Node.js 18+** and **pnpm** installed
- A [Dwolla Sandbox account](https://accounts-sandbox.dwolla.com/sign-up)
- **API credentials** from your chosen integration partner (Plaid, MX, Mastercard, Checkout.com, or Flinks)

## Quick Start

1. **Clone and install dependencies**

```bash
git clone https://github.com/Dwolla/integration-examples.git
cd integration-examples
pnpm install
```

2. **Choose your integration** from the table below

3. **Follow the example's README** for provider-specific setup

## Browse by Goal

| Goal | Examples |
| --- | --- |
| Add a bank funding source (Open Banking) | <ul><li>[Plaid](packages/open-banking/plaid)</li><li>[MX](packages/open-banking/mx)</li></ul> |
| Add a bank funding source (Secure Exchange / tokenized) | <ul><li>[Plaid](packages/secure-token-exchange/plaid) </li><li> [MX](packages/secure-token-exchange/mx) </li><li> [Mastercard](packages/secure-token-exchange/mastercard) </li><li> [Flinks](packages/secure-token-exchange/flinks) </li></ul> |
| Add a card funding source & enable Push to Card payouts | <ul><li>[Checkout.com Flow](packages/push-to-card/checkout)</li></ul> |

## Architecture

This is a monorepo with individual packages:

```
integration-examples/
├── packages/
│   ├── open-banking/           # Direct API integrations
│   │   ├── plaid/
│   │   └── mx/
│   ├── secure-token-exchange/  # Tokenized flows
│   │   ├── plaid/
│   │   ├── mx/
│   │   ├── mastercard/
│   │   └── flinks/
│   └── push-to-card/           # Card funding sources
│       └── checkout/
└── [root]                      # Shared configs (ESLint, Prettier, TypeScript)
```

