# Dwolla and MX - Open Banking

This example project, built using [Next.js](https://nextjs.org), demonstrates open banking integration between Dwolla and MX. The app showcases how to create a Customer in Dwolla and attach a verified Funding Source using MX's integration with Dwolla, enabling secure exchange of financial information without handling sensitive data directly.

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before proceeding.

## Prerequisites

1. Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and obtain the necessary API keys.

## Setup

1. Rename `.env.local.example` to `.env.local`, and enter the necessary access keys and environment settings for Dwolla and MX.
2. Run `pnpm install` to download all necessary dependencies.
3. Run `pnpm dev` to start the Next.js application! (Before connecting a bank account, please see _[Using MX Test Credentials](#using-mx-test-credentials)_.)

## Using MX Connect

When using MX Web Widget SDK to connect a bank account, there are two development options present that work with Dwolla: **MX Bank** and **MX Bank (OAuth)**.

When using **MX Bank** in the Sandbox environment, you can use the following test credentials to simulate various scenarios. These credentials are provided by MX for sandbox testing purposes.

| Username | Password                  | Connection Status | Description                                                                                          |
|----------|---------------------------|-------------------|------------------------------------------------------------------------------------------------------|
| mxuser   | Any value not described below | ✅ CONNECTED        | Successful aggregation with no MFA.                                                                  |
| mxuser   | challenge                 | ❌ CHALLENGED        | Issues an MFA challenge. Answer with `correct` to simulate a correct MFA response, or use one of the passwords below that simulate a server error. Use anything else to simulate an incorrect answer. |
| mxuser   | options                   | ❌ CHALLENGED        | Issues an MFA challenge of the type OPTIONS. Answer with `correct` to simulate a correct MFA response, or use one of the passwords below that simulate a server error. Use anything else to simulate an incorrect answer. |
| mxuser   | image                     | ❌ CHALLENGED        | Issues an MFA challenge of type IMAGE. Answer with `correct` to simulate a correct MFA response, or use one of the passwords below that simulate a server error. Use anything else to simulate an incorrect answer. |
| mxuser   | BAD_REQUEST               | ❌ FAILED            | External server returns a 400 error with the message, "You must fill out the username and password fields." If using the Connect Widget, this will display the message: "There was a problem validating your credentials with MX Bank. Please try again later." |
| mxuser   | UNAUTHORIZED              | ❌ DENIED            | External server returns a 401 error with the message, "Invalid credentials." If using the Connect Widget, this will display the message: "The credentials entered do not match those at MX Bank. Please correct them below to continue." |
| mxuser   | INVALID                   | ❌ DENIED            | External server returns a 401 error with the message, "The login and/or password are invalid." If using the Connect Widget, this will display the message: "The credentials entered do not match those at MX Bank. Please correct them below to continue." |
| mxuser   | LOCKED                    | ❌ LOCKED            | External server returns a 401 error with the message, "The credentials are valid, but the user is locked." If using the Connect Widget, this will display the message: "Your account is locked. Please log in to the appropriate website for MX Bank and follow the steps to resolve the issue." |
| mxuser   | DISABLED                  | ❌ DENIED            | External server returns a 401 error with the message, "The credentials are valid, but the user is locked." This password may also be used as an MFA answer. If using the Connect Widget, this will display the message: "The credentials entered do not match those at MX Bank. Please correct them below to continue." |
| mxuser   | SERVER_ERROR              | ❌ FAILED            | External server returns a 500 error with the message, "Internal server error." This password may also be used as an MFA answer. If using the Connect Widget, this will display the message: "There was a problem validating your credentials with MX Bank. Please try again later." |
| mxuser   | UNAVAILABLE               | ❌ FAILED            | External server returns a 503 error with the message, "Service is Unavailable." This password may also be used as an MFA answer. If using the Connect Widget, this will display the message: "There was a problem validating your credentials with MX Bank. Please try again later." |

These credentials allow you to test different authentication and connection scenarios with MX in the sandbox environment.

## Key Features

- **Customer Creation**: Create a new customer in Dwolla using the API.
- **MX Widget Integration**: Render the MX widget for users to securely connect their financial institutions.
- **Data Retrieval**: Retrieve and display financial data from connected institutions.
- **Error Handling**: Manage various authentication and connection errors gracefully.

## Additional Resources

- [Dwolla API Documentation](https://developers.dwolla.com/docs/balance/open-banking)
- [MX Connect Web Widget Guide](https://docs.mx.com/connect/guides/web-app-guide/web/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
