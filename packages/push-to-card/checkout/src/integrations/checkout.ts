export type BillingAddress = {
  address1: string;
  address2?: string;
  city: string;
  stateProvinceRegion: string;
  country: string;
  postalCode: string;
};

/**
 * Placeholder for server-side Checkout.com payment session creation.
 * Replace with a secure API route that uses your CKO secret key.
 */
export async function createPaymentSession() {
  console.info("[mock] createPaymentSession");
  return {
    id: "ps_mock",
    payment_session_secret: "pss_mock",
    payment_session_token: "mock_token"
  };
}

/**
 * Placeholder to exchange Checkout.com payment for card token (src_...).
 * Replace with server-side GET /payments/{id} using CKO secret key.
 */
export async function exchangePaymentForCardToken(paymentId: string) {
  console.info("[mock] exchangePaymentForCardToken", paymentId);
  return "src_mock_token";
}

/**
 * Placeholder to create a Dwolla card funding source with the card token.
 * Replace with server-side POST /customers/{id}/funding-sources.
 */
export async function createCardFundingSource(customerId: string, cardToken: string, billing: BillingAddress) {
  console.info("[mock] createCardFundingSource", { customerId, cardToken, billing });
  return "https://api-sandbox.dwolla.com/funding-sources/mock-card-id";
}

