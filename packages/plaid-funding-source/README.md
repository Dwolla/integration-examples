# Dwolla-Plaid Bank Account Verification

This example application, built using [Next.js](https://nextjs.org/), demonstrates how a Funding Source can be created for a Dwolla Customer using a Plaid Token. By doing this, Dwolla is able to instantly verify the Funding Source without the need for your application to transmit sensitive data.

## Setup

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and a [Plaid Sandbox Account](https://dashboard.plaid.com/signup).
2. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys for both Dwolla and Plaid.
3. On Plaid's dashboard under [Developers -> API](https://dashboard.plaid.com/developers/api), configure Allowed redirect URIs to include `http://localhost:3000`.
4. Since Dwolla can only verify one account, modify Plaid's [Account Select](https://dashboard.plaid.com/link/account-select) to only be "enabled for one account".
5. Run `pnpm install` to download all necessary dependencies
6. Run `pnpm dev` to start the Next.js application!
