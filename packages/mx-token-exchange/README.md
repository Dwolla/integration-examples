# Dwolla and MX - Token Exchange

This example project, built using [Next.js](https://nextjs.org), demonstrates how a Funding Source can be created for a Dwolla Customer using Dwolla's integration with MX via Dwolla's Token Exchange. By doing this, Dwolla is able to instantly verify the Funding Source without the need for your application to transmit sensitive data. (All sensitive data is retrieved directly from MX by Dwolla.)

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## Setup

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and an [MX Account](https://dashboard.mx.com/sign_up).
2. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys for both Dwolla and MX.
3. Run `pnpm install` to download all necessary dependencies.
4. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using MX Connect](#using-mx-connect)_.)

## Using MX Connect

When using MX Web Widget SDK to connect a bank account, there are two development options present: MX Bank and MX Bank (OAuth). To integrate with Dwolla's token exchange service, please use the latter: [MX Bank (OAuth)](https://docs.mx.com/testing/guides/testing#test_oauth). Using MX Bank and supplying test credentials does not work at this time.