# Dwolla and Visa - Open Banking

This example project, built using [Next.js](https://nextjs.org), demonstrates open banking integration between Dwolla and Visa. The app shows how to create an External Party and a Funding Source using Visa's integration with Dwolla, enabling secure exchange of financial information without handling sensitive data directly.

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## Setup

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and obtain the necessary API keys.
2. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys and environment settings for Dwolla.
3. Run `pnpm install` to download all necessary dependencies.
[//]: # (TODO: Update information regarding setting up a redirect URL)
4. Set up redirect URL for Visa flow.
5. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using Visa Demo Bank](#using-visa-demo-bank)_.)

## Using Visa Demo Bank

[//]: # (TODO: Add information regarding Visa Demo bank credentials)



