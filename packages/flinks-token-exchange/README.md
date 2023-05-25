# Dwolla and Flinks - Token Exchange

This example project, built using [Next.js](https://nextjs.org), demonstrates how a Funding Source can be created for a Dwolla Customer using Dwolla's integration with Flinks via Dwolla's Token Exchange. By doing this, Dwolla is able to instantly verify the Funding Source without the need for your application to transmit sensitive data. (All sensitive data is retrieved directly from Flinks by Dwolla.)

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## Setup

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and a [Flinks Account](https://docs.flinks.com/docs/welcome).
2. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys for both Dwolla and Flinks.
3. Run `pnpm install` to download all necessary dependencies.
4. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using Flinks Connect](#using-flinks-connect)_.)

## Using Flinks Connect

When using Flinks Connect in a development environment, search for Flinks Capital and enter username `jane_doe_2_accounts` and password `Everyday`. This username and password combination results in a dummy Flinks account that has a valid US routing number. Other username and password combinations with Flinks Capital may not work in Dwolla's Sandbox environment. For more information, please [see Test Institution on Flinks' website](https://docs.flinks.com/docs/test-institution).
