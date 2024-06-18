# Dwolla and Visa - Open Banking

This example project, built using [Next.js](https://nextjs.org), demonstrates open banking integration between Dwolla and Visa. The app shows how to create a Customer in Dwolla and attach a verified Funding Source using Visa's integration with Dwolla, enabling secure exchange of financial information without handling sensitive data directly.

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## Prerequisites

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and obtain the necessary API keys.
2. Contact Dwolla to set up the redirect URL for the Visa flow. The redirect URL for this project should be set to `http://localhost:3000/create-funding-source`. Ensure you also have the proper resource permissions granted for your API keys. [Contact Dwolla](mailto:sales@dwolla.com) with the following details:
    - Your Dwolla Sandbox Account information
    - The redirect URL: `http://localhost:3000/create-funding-source`
    - A request for the specific resource permissions needed for the Open Banking integration

    **Note**: In the future, adding/updating the Visa redirect URL will be available in the Dwolla Dashboard.

## Setup

1. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys and environment settings for Dwolla.
2. Run `pnpm install` to download all necessary dependencies.
3. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using Visa Test Credentials](#using-visa-test-credentials)_.)

## Using Visa Test Credentials

When using Visa in the Sandbox environment, you can use the following test credentials to simulate different scenarios. These credentials are provided by Visa for sandbox testing purposes.

| User        | Username  | Password | Description                                                                   | Result                 |
| ----------- | --------- | -------- |-------------------------------------------------------------------------------|------------------------|
| **User 1**  | u51613239 | cty440   | User has successfully authenticated but no account information could be found | ✅ Successful           |
| **User 2**  | u30915384 | bsw325   | Report with full information                                                  | ✅ Successful           |
| **User 3**  | u92721594 | nbs589   | User failed to authenticate themselves at the financial institution           | ❌ Authentication error |
| **User 4**  | u91902655 | jtx720   | Temporary error with a Visa service                                           | ❌ Temporary error      |

These credentials allow you to test different authentication and connection scenarios with Visa in the sandbox environment.




