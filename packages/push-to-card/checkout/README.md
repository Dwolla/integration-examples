# Dwolla Push to Card

This example application, built using [Next.js](https://nextjs.org/), demonstrates how to integrate Dwolla's **Push to Card** feature. The app shows how to create a Customer in Dwolla, obtain a payment session via Dwolla's API for secure card capture, collect card details using the Flow component powered by Checkout.com, create a card funding source in Dwolla, and initiate instant payouts to the cardholder's debit card.

**Note**: Since this project depends on shared dependencies, please ensure that you have executed `pnpm install` in the root directory (`integration-examples`) before continuing.

## What This Example Shows

This sample application demonstrates the complete Push to Card integration flow:

1. **Customer Creation**: Create an unverified Customer in Dwolla to represent the payout recipient
2. **Payment Session (Dwolla)**: Create an exchange session via Dwolla's API to obtain payment session data for card capture
3. **Flow Component**: Mount the Flow component to securely collect card details (client-side; PCI-compliant)
4. **Exchange Creation**: Exchange the payment ID from Flow for an Exchange via Dwolla's API
5. **Card Funding Source**: Create a Dwolla card funding source using the exchange
6. **Push to Card Transfer**: Initiate an instant payout from your settlement account to the card

## Prerequisites

Before running this application, ensure you have the following:

### Dwolla Requirements

1. **Dwolla Sandbox Account**: Create a [Dwolla Sandbox Account](https://accounts-sandbox.dwolla.com/sign-up) and obtain your API credentials (Key and Secret) from the [Dwolla Dashboard](https://dashboard-sandbox.dwolla.com/applications-legacy).

2. **Push to Card Feature Access**: Push to Card is a premium feature. Contact your Dwolla account manager or [request access](https://www.dwolla.com/contact/) if you don't have it enabled for your account.

3. **Settlement Account Configuration**: A Checkout.com settlement account funding source **must be configured** in your Dwolla account before you can send payouts. This is done in the Dwolla Dashboard using the CRB (Card Receiving Bank) account details provided by Checkout.com. See the [Dwolla Push to Card documentation](https://developers.dwolla.com/docs/push-to-card#the-settlement-account) for detailed setup instructions.

4. **Funded Settlement Account**: Push to Card operates on a "good funds" model, meaning payouts will only succeed if funds are already available in your settlement account. Ensure your settlement account is funded before testing transfers.

### Checkout.com Requirements

1. **Checkout.com Account**: Sign up for a [Checkout.com Sandbox Account](https://www.checkout.com/get-test-account) to access their testing environment.

The only third-party requirement for card capture is the **Flow** component and its public key:

1. **Public Key**: Obtain the **Public Key** from the provider's dashboard (sandbox: `pk_sbox_...`, production: `pk_...`). This is used client-side to initialize the Flow component.
2. **Environment**: Set `NEXT_PUBLIC_CKO_ENV` to `sandbox` or `production` to match the key.

## Setup

1. **Install Root Dependencies**: From the repository root directory (`integration-examples`), run `pnpm install` to install shared dependencies.

2. **Configure Environment Variables**: Rename `.env.local.example` to `.env.local` and fill in your Dwolla credentials and the Flow component public key.

3. **Install Package Dependencies**: Navigate to this package directory and run `pnpm install` to download all necessary dependencies.

4. **Start the Development Server**: Run `pnpm dev` to start the Next.js application at `http://localhost:3000`.

5. **Test the Flow**: Follow the UI steps in the application:
   - **Step 1**: Enter customer details (name and email) to create a Dwolla Customer
   - **Step 2**: Complete payment details (amount and billing address)
   - **Step 3**: Enter card information in the Flow component
   - **Step 4**: Submit to create the card funding source and initiate the payout

## Test Cards (Sandbox)

When using the Flow component in the Sandbox environment, you can use test card numbers to simulate card capture:

### Successful Card Capture

| Card Number         | Description                    |
|---------------------|--------------------------------|
| 4024 7644 4997 1519 | Visa (debit)                   |
| 5318 7730 1249 0080 | Mastercard (debit)             |

### Test Card Details

For any test card, use:
- **Expiry Date**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 100)
- **Cardholder Name**: Any name

For more test card scenarios, refer to the [Card payout test cards](https://www.checkout.com/docs/developer-resources/testing/test-cards#Card_payout_test_cards) documentation.

## Key Features

- **Customer Management**: Create unverified Customers in Dwolla using the Dwolla API
- **Payment Sessions via Dwolla**: Obtain payment session data from Dwolla's exchange session API for card capture
- **Secure Card Capture**: Use the Flow component for PCI-compliant card data collection (client-side)
- **Exchange creation**: Exchange payment ID for an Exchange resource via Dwolla's API
- **Push to Card**: Create card funding sources and initiate instant payouts to debit cards
- **Error Handling**: Error handling for Dwolla API interactions
- **Real-time Status Updates**: Track the progress of card capture, funding source creation, and transfer initiation

## Project Structure

```
src/
├── app/
│   ├── create-customer/         # Customer creation form and logic
│   │   └── page.tsx
│   ├── send-payout/            # Card capture and payout initiation
│   │   ├── page.tsx            # Main payout page with Flow component
│   │   ├── success/            # Success callback page
│   │   │   └── page.tsx
│   │   └── failure/            # Failure callback page
│   │       └── page.tsx
│   ├── layout.tsx              # Root layout with MUI theme
│   └── page.tsx                # Landing page with navigation
├── integrations/
│   ├── dwolla.ts               # Dwolla API integration
│   └── index.ts                # Shared integration utilities
├── hooks/
│   └── useNetworkAlert.ts      # Custom hook for network state management
└── utils/
    ├── equalsIgnoreCase.ts     # String comparison utility
    ├── getBaseUrl.ts           # URL helper for API requests
    ├── getMissingKeys.ts       # Form validation utility
    ├── uuidFromUrl.ts          # Extract UUID from resource URLs
    └── index.ts                # Utility exports
```
