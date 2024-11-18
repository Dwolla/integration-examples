# Dwolla and Plaid - Open Banking

This example project, built using [Next.js](https://nextjs.org), demonstrates open banking integration between Dwolla and Plaid. The app shows how to create a Customer in Dwolla and attach a verified Funding Source using Plaid's integration with Dwolla, enabling secure exchange of financial information without you needing to handle sensitive data directly.

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## Prerequisites

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and obtain the necessary API keys.

## Setup

1. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys and environment settings for Dwolla.
2. Run `pnpm install` to download all necessary dependencies.
3. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using Plaid Test Credentials](#using-plaid-test-credentials)_.)

## Using Plaid Test Credentials

When using Plaid in the Sandbox environment, you can use the username `user_good` and password `pass_good` to simulate successful login. To test different authentication and connection scenarios, check out the [Plaid docs](https://plaid.com/docs/sandbox/test-credentials/). 
