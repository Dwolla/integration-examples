"use server";

import { Checkout } from "checkout-sdk-node";
import { getEnvironmentVariable } from "./index";

/**
 * Derives the Checkout.com API host based on the configured environment and Client ID.
 * The SDK defaults to production; for sandbox we must override the host.
 */
function getCkoHost(): string {
  const env = (process.env.CKO_ENV || "sandbox").toLowerCase();
  const clientId = process.env.CKO_CLIENT_ID || "";
  const prefix = clientId.startsWith("cli_") ? clientId.slice(4, 12) : clientId.slice(0, 8);
  const base = env === "production" || env === "prod" ? "api.checkout.com" : "api.sandbox.checkout.com";
  return prefix ? `https://${prefix}.${base}` : `https://${base}`;
}

/**
 * Creates a configured Checkout.com SDK client using server-side credentials.
 */
const cko = new Checkout(getEnvironmentVariable("CKO_SECRET_KEY") || "", {
  pk: getEnvironmentVariable("CKO_PUBLIC_KEY") || "",
  host: getCkoHost()
});

/**
 * Creates a Payment Session for Checkout.com Flow.
 * This runs server-side to keep the secret key off the client.
 *
 * @returns The full payment session response returned by Checkout.com.
 */
export async function createPaymentSession() {
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    return await cko.paymentSessions.request({
      amount: 0,
      currency: "USD",
      billing: {
        address: {
          country: "US"
        }
      },
      payment_method_configuration: {
        card: {
          // Required to store the card for token retrieval
          store_payment_details: "enabled"
        }
      },
      success_url: `${appBaseUrl}/add-card/success`,
      failure_url: `${appBaseUrl}/add-card/failure`
    });
  } catch (error) {
    console.error("Error creating Checkout.com payment session", error);
    throw error;
  }
}

// TODO: Implement in subsequent steps.
// export async function exchangePaymentForCardToken(paymentId: string) {
//   void paymentId;
//   throw new Error("exchangePaymentForCardToken not yet implemented");
// }

