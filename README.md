# Dwolla Integration Examples

This repository contains end-to-end example applications that showcase how Dwolla can integrate with other providers, such as Plaid, to provide automatic funding source verification. 

Each application makes use of the latest technologies by building itself on top of NextJS/React and TypeScript, as well as demonstrating best practices regarding error handling, token management, and more.

## Getting Started

Before getting started, please note that many of our example apps share common dependencies—e.g., ESLint, Prettier, and TypeScript. As such, their configurations are held within the root project, with each app referencing its respective root file. This means that before you can use any of the example apps, you must first run `pnpm install` in the project root directory.

## Browse by Goal (and Jump to Examples)

| Goal | Examples |
| --- | --- |
| Add a bank funding source (Open Banking) | <ul><li>[Plaid](packages/open-banking/plaid)</li><li>[MX](packages/open-banking/mx)</li></ul> |
| Add a bank funding source (Secure Exchange / tokenized) | <ul><li>[Plaid](packages/secure-token-exchange/plaid) </li><li> [MX](packages/secure-token-exchange/mx) </li><li> [Mastercard](packages/secure-token-exchange/mastercard) </li><li> [Flinks](packages/secure-token-exchange/flinks) </li></ul> |
| Add a card funding source & enable Push to Card payouts | <ul><li>[Checkout.com Flow](packages/push-to-card/checkout)</li></ul> |

