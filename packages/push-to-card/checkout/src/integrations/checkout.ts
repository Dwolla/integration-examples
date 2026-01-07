"use server";

import { Checkout } from "checkout-sdk-node";
import { getEnvironmentVariable } from "./index";

/**
 * Derives the Checkout.com API host based on the configured environment and Client ID.
 * The SDK defaults to production; for sandbox we must override the host.
 */
function getCkoHost(): string {
  const env = (getEnvironmentVariable("NEXT_PUBLIC_CKO_ENV") || "sandbox").toLowerCase();
  const clientId = getEnvironmentVariable("CKO_CLIENT_ID") || "";
  const prefix = clientId.startsWith("cli_") ? clientId.slice(4, 12) : clientId.slice(0, 8);
  const base = env === "production" || env === "prod" ? "api.checkout.com" : "api.sandbox.checkout.com";
  return prefix ? `https://${prefix}.${base}` : `https://${base}`;
}

/**
 * Creates a configured Checkout.com SDK client using server-side credentials.
 */
const cko = new Checkout(getEnvironmentVariable("CKO_SECRET_KEY") || "", {
  pk: getEnvironmentVariable("NEXT_PUBLIC_CKO_PUBLIC_KEY") || "",
  host: getCkoHost()
});

function logCkoError(error: unknown, context: string) {
  // The Checkout SDK surfaces rich metadata on errors; capture the common fields for debugging.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  const body = err?.body ?? err?.response?.body;
  const summary = {
    context,
    message: err?.message,
    status: err?.statusCode ?? err?.status ?? body?.http_code,
    request_id: err?.request_id ?? err?.requestId ?? body?.request_id,
    error_type: err?.error_type ?? err?.type,
    error_codes: body?.error_codes ?? err?.error_codes,
    body
  };

  console.error(`[Checkout] ${context} failed`, JSON.stringify(summary, null, 2));
}

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

  const processingChannelId = getEnvironmentVariable("CKO_PROCESSING_CHANNEL_ID");
  if (!processingChannelId) {
    throw new Error(
      "CKO_PROCESSING_CHANNEL_ID is required to create a payment session (see Checkout.com processing channels)"
    );
  }

  try {
    return await cko.paymentSessions.request({
      processing_channel_id: processingChannelId,
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
    logCkoError(error, "creating Checkout.com payment session");
    // Provide a concise, user-facing error for the client while keeping rich logs server-side.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    const body = err?.body ?? err?.response?.body;
    const code = err?.statusCode ?? err?.status ?? body?.http_code;
    const requestId = err?.request_id ?? err?.requestId ?? body?.request_id;
    const errorCodes = (body?.error_codes ?? []).join(", ");
    const safeMessage = `Checkout.com payment session failed (${code ?? "unknown status"})` +
      (errorCodes ? ` [${errorCodes}]` : "") +
      (requestId ? ` request_id=${requestId}` : "");
    throw new Error(safeMessage);
  }
}

// TODO: Implement in subsequent steps.
export async function exchangePaymentForCardToken(paymentId: string): Promise<string> {
  try {
    const payment = await cko.payments.get(paymentId);
    const token =
      // Checkout SDK may use either `source` or `payment_source`
      (payment as any)?.source?.id ?? (payment as any)?.payment_source?.id;

    if (!token) {
      throw new Error("No card token (src_...) found on payment");
    }

    return token;
  } catch (error) {
    logCkoError(error, "fetching Checkout.com payment for card token");
    throw new Error("Failed to retrieve card token from Checkout.com");
  }
}

