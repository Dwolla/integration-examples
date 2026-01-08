"use server";

import { Checkout } from "checkout-sdk-node";
import { getEnvironmentVariable } from "./index";

/**
 * Derives the Checkout.com API host URL based on the configured environment and Client ID.
 * 
 * Checkout.com uses account-specific API endpoints. The URL format is:
 * - Sandbox: https://{prefix}.api.sandbox.checkout.com
 * - Production: https://{prefix}.api.checkout.com
 * 
 * Where {prefix} is derived from the first 8 characters after "cli_" in your Client ID.
 * The Checkout.com SDK defaults to production, so we must explicitly set the host
 * for sandbox environments.
 * 
 * @returns The fully qualified Checkout.com API host URL
 * 
 * @example
 * // For Client ID "cli_abc12345" in sandbox
 * // Returns: "https://abc12345.api.sandbox.checkout.com"
 * 
 */
function getCkoHost(): string {
  const env = (getEnvironmentVariable("NEXT_PUBLIC_CKO_ENV") || "sandbox").toLowerCase();
  const clientId = getEnvironmentVariable("CKO_CLIENT_ID") || "";
  const prefix = clientId.startsWith("cli_") ? clientId.slice(4, 12) : clientId.slice(0, 8);
  
  // Determine base API host based on environment
  const base = env === "production" || env === "prod" ? "api.checkout.com" : "api.sandbox.checkout.com";
  
  return prefix ? `https://${prefix}.${base}` : `https://${base}`;
}

/**
 * Checkout.com SDK client configured with server-side credentials.
 * 
 * This client is used for server-side operations that require the secret key:
 * - Creating payment sessions
 * - Retrieving payment details and card tokens
 * - Any other sensitive API operations
 * 
 * Important: This client should only be used in server-side code (marked with "use server").
 * Never expose the secret key to the client.
 * 
 */
const cko = new Checkout(getEnvironmentVariable("CKO_SECRET_KEY") || "", {
  pk: getEnvironmentVariable("NEXT_PUBLIC_CKO_PUBLIC_KEY") || "",
  host: getCkoHost()
});

/**
 * Logs detailed Checkout.com API errors for debugging purposes.
 * 
 * The Checkout.com SDK provides rich error metadata including:
 * - HTTP status codes
 * - Request IDs (for support tickets)
 * - Error types and codes
 * - Detailed error messages
 * 
 * This function extracts and logs all available error information to help
 * diagnose issues with Checkout.com API calls.
 * 
 * @param error - The error object from a Checkout.com SDK call
 * @param context - Description of the operation that failed (e.g., "creating payment session")
 * 
 * @example
 * ```typescript
 * try {
 *   await cko.payments.get(paymentId);
 * } catch (error) {
 *   logCkoError(error, "fetching payment details");
 * }
 * ```
 */
function logCkoError(error: unknown, context: string) {
  // The Checkout SDK surfaces rich metadata on errors; capture the common fields for debugging.
  // Error structure can vary, so we check multiple possible locations for each field.
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
 * Creates a Payment Session for Checkout.com Flow component.
 * 
 * A payment session is required to initialize the Checkout.com Flow component on the client.
 * The session contains configuration for how the payment should be processed and what
 * payment methods are available.
 * 
 * This function runs server-side to keep your secret key secure. The returned session
 * object is passed to the Flow component in the browser.
 * 
 * Key configuration:
 * - `amount: 0` - We're only capturing card details, not processing a payment yet
 * - `store_payment_details: "enabled"` - Critical! This tells Checkout.com to save the card
 *   details so we can retrieve the token later
 * - Success/failure URLs - Required by Checkout.com API, used as fallback routes
 * 
 * @returns Promise resolving to the payment session object from Checkout.com
 * @throws Error if CKO_PROCESSING_CHANNEL_ID is not configured or if the API call fails
 * 
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
      
      // Amount set to 0 because we're only tokenizing the card, not charging it
      amount: 0,
      currency: "USD",
      
      // Minimal billing info required by Checkout.com
      billing: {
        address: {
          country: "US"
        }
      },
      
      // Critical: Enable storing payment details so we can retrieve the card token
      // Without this, the token won't be available for creating the Dwolla funding source
      payment_method_configuration: {
        card: {
          store_payment_details: "enabled"
        }
      },
      
      // Disable payment methods we don't support for Push to Card
      disabled_payment_methods: ["googlepay"],
      // Required URLs by Checkout.com API. These serve as fallback routes for edge cases
      // (e.g., 3DS redirects, browser issues). Primary flow uses onPaymentCompleted callback.
      success_url: `${appBaseUrl}/send-payout/success`,
      failure_url: `${appBaseUrl}/send-payout/failure`
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

/**
 * Exchanges a Checkout.com payment ID for a reusable card token.
 * 
 * After the user submits their card information through Flow, Checkout.com creates
 * a payment record. This function retrieves that payment and extracts the card token
 * (starting with `src_`) which can then be used to create a Dwolla funding source.
 * 
 * @param paymentId - The Checkout.com payment ID (returned by Flow onPaymentCompleted)
 * @returns Promise resolving to the card token (starts with `src_`)
 * @throws Error if the payment cannot be retrieved or if no token is found
 * 
 */
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
    // Log detailed error for debugging
    logCkoError(error, "fetching Checkout.com payment for card token");
    throw new Error("Failed to retrieve card token from Checkout.com");
  }
}

