# Dwolla and Mastercard - Secure Exchange

This example project, built using [Next.js](https://nextjs.org/), demonstrates how a Funding Source can be created for a Dwolla Customer using Dwolla's integration with Mastercard's [Open Banking](https://developer.mastercard.com/open-banking-us/documentation) and Dwolla's [Secure Exchange](https://developers.dwolla.com/docs/balance/secure-exchange) solution. By doing this, Dwolla is able to instantly verify the Funding Source without the need for your application to transmit sensitive data. (All the sensitive data is retrieved directly from Mastercard.)

## Notes

1. This project depends on some shared dependencies. As such, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`).
2. In order to use Mastercard's Node SDK, you will need to build it yourself. A Bash script has been provided for ease of use; however, please note that the script requires [pnpm](https://pnpm.io/) as a package manager. Although you could use others, e.g. `npm` or `yarn`, it would require that the script file is modified first.

## Setup

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and a [Mastercard Developers Account](https://developer.mastercard.com/open-banking-us/documentation/quick-start-guide/#1-generate-your-credentials).
2. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys for both Dwolla and Mastercard.
3. In your terminal, `cd` into the project directory (`mastercard-token-exchange`) and execute the following commands:
   1. `pnpm install` - This will install all necessary dependencies, minus Mastercard's SDK
   2. `cd scripts` - This will change your working directory to `scripts`
   3. `./generate_mastercard_sdk.sh` - This will generate and symlink Mastercard's Node SDK based on their OpenAPI spec. As mentioned before, please note that this script requires `pnpm` on your machine.
   4. `cd ../` - This will change your working directory back to the project root
   5. `pnpm dev` - This will start your Next development server
4. Once the server is running, you can now navigate to `localhost:3000` to begin using Dwolla's Secure Token Exchange integration with Mastercard!

## Using Mastercard Connect

When using Mastercard Connect in a development environment, you may search for `FinBank Profiles – A` or `FinBank Profiles – B` and enter anything for the username and *profile_09* for the password. For more information, please [see bank account profiles on Mastercard's website](https://developer.mastercard.com/open-banking-us/documentation/test-the-apis/#bank-account-profiles).
