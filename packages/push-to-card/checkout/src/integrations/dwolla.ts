"use server";
import { Dwolla } from "dwolla";
import { getEnvironmentVariable } from "./index";
import { equalsIgnoreCase } from "../utils";

/**
 * Payment session data for the Flow component (from exchange session externalProviderSessionData).
 * Matches the Dwolla API response shape; pass through directly to Checkout.com Flow.
 */
export interface ExternalProviderSessionData {
  id?: string;
  payment_session_secret?: string;
  payment_session_token?: string;
}

export interface CreateCustomerOptions {
  firstName: string;
  lastName: string;
  email: string;
}

export interface NextAPIResponse {
  success: boolean;
  message?: string;
  resource?: string;
}

/** Result of getExchangeSession. */
export type PaymentSessionResult =
  | { success: true; resource: ExternalProviderSessionData }
  | { success: false; message?: string };

/**
 * Initializes the Dwolla client with the provided environment and API credentials.
 */
const dwolla = new Dwolla({
  server: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "prod" | "sandbox",
  security: {
    clientID: getEnvironmentVariable("DWOLLA_KEY") ?? "",
    clientSecret: getEnvironmentVariable("DWOLLA_SECRET") ?? "",
  },
});

/** Extract Location URL from SDK create response headers (keys may be lowercased). */
function getLocationFromHeaders(headers: { [k: string]: Array<string> } | undefined): string | undefined {
  if (!headers) return undefined;
  return headers["location"]?.[0] ?? headers["Location"]?.[0];
}

/**
 * Gets Checkout.com's exchange partner href (link) within Dwolla's systems.
 * @returns The exchange partner self link href (string). Throws if not found.
 */
export async function getExchangePartnerHref(): Promise<string> {
    try {
        const response = (await dwolla.exchangePartners.list()) as {
            embedded?: { exchangePartners?: Array<{ name: string; links?: { self?: { href?: string } } }> };
        };
        const partnersList = response.embedded?.exchangePartners ?? [];
        const checkoutPartner = partnersList.find((obj) => equalsIgnoreCase(obj.name, "Checkout.com"));
        if (!checkoutPartner?.links?.self?.href) {
            throw new Error("Checkout.com exchange partner not found or missing self link");
        }
        console.log("Checkout.com exchange partner retrieved successfully:", checkoutPartner.links.self.href);
        return checkoutPartner.links.self.href;
    } catch (error) {
        console.error("Error retrieving exchange partners", error);
        throw error;
    }
}

/**
 * Creates an exchange session for a Customer.
 * @param customerId - The ID of the customer to create an exchange session for.
 * @returns NextAPIResponse containing success status, optional message, and resource (Location URL) if successful.
 */
export async function createExchangeSession(customerId: string): Promise<NextAPIResponse> {
  try {
    const exchangePartnerHref = await getExchangePartnerHref();
    const response = await dwolla.customers.exchangeSessions.create({
      id: customerId,
      requestBody: {
        links: {
          exchangePartner: { href: exchangePartnerHref },
        },
      },
    });
    const location = getLocationFromHeaders(response?.headers);
    if (location) {
      console.log("Exchange session created successfully. Location:", location);
      return {
        success: true,
        message: "Exchange session created successfully",
        resource: location,
      };
    }
    return {
      success: false,
      message: "No Location header in exchange-session response",
    };
  } catch (error) {
    console.error("Error creating Dwolla Exchange Session:", error);
    return {
      success: false,
      message: "An error occurred while creating the exchange session",
    };
  }
}

/**
 * Retrieves an exchange session by ID. For the card flow, the response includes
 * externalProviderSessionData used to mount the Flow component.
 * @param exchangeSessionId - The ID of the exchange session to retrieve.
 * @returns PaymentSessionResult with resource set to externalProviderSessionData on success.
 */
export async function getExchangeSession(exchangeSessionId: string): Promise<PaymentSessionResult> {
  try {
    const session = await dwolla.exchangeSessions.get({ id: exchangeSessionId });
    const data = session.externalProviderSessionData as
      | { id?: string; paymentSessionSecret?: string; paymentSessionToken?: string; payment_session_secret?: string; payment_session_token?: string }
      | undefined;
    const secret = data?.payment_session_secret ?? data?.paymentSessionSecret;
    const token = data?.payment_session_token ?? data?.paymentSessionToken;
    if (data?.id && secret != null && token != null) {
      console.log("Exchange session retrieved successfully");
      // Checkout Flow expects snake_case; normalize so client always receives the shape Flow requires
      const forFlow: ExternalProviderSessionData = {
        id: data.id,
        payment_session_secret: secret,
        payment_session_token: token,
      };
      return { success: true, resource: forFlow };
    }
    return {
      success: false,
      message: "Exchange session response missing externalProviderSessionData",
    };
  } catch (error) {
    console.error("Error retrieving exchange session:", error);
    return {
      success: false,
      message: "An error occurred while retrieving the exchange session",
    };
  }
}

/**
 * Creates an Unverified Customer resource.
 */
export async function createCustomer(formData: FormData): Promise<NextAPIResponse> {
  try {
    const response = await dwolla.customers.create({
      type: "unverified",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
    });
    const location = getLocationFromHeaders(response?.headers);
    if (location) {
      console.log("Customer created successfully. Location:", location);
      return {
        success: true,
        message: "Customer created successfully",
        resource: location,
      };
    }
    return {
      success: false,
      message: "An error occurred while processing the response",
    };
  } catch (error) {
    console.error("Error creating Dwolla Customer:", error);
    return {
      success: false,
      message: "An error occurred while creating the customer. Please try again later.",
    };
  }
}

/**
 * Creates an Exchange resource (e.g. with the payment ID from the Flow component).
 * @param customerId - The Dwolla Customer ID.
 * @param paymentId - The payment ID (e.g. pay_xxx) from Flow's onPaymentCompleted callback.
 * @returns NextAPIResponse with resource set to the Exchange Location URL on success.
 */
export async function createExchange(customerId: string, paymentId: string): Promise<NextAPIResponse> {
  try {
    const exchangePartnerHref = await getExchangePartnerHref();
    const response = await dwolla.customers.exchanges.create({
      id: customerId,
      requestBody: {
        links: { exchangePartner: { href: exchangePartnerHref } },
        token: paymentId,
      },
    });
    const location = getLocationFromHeaders(response?.headers);
    if (location) {
      console.log("Exchange created successfully. Location:", location);
      return {
        success: true,
        message: "Exchange created successfully",
        resource: location,
      };
    }
    return {
      success: false,
      message: "No Location header in exchange response",
    };
  } catch (error) {
    console.error("Error creating Dwolla Exchange:", error);
    return {
      success: false,
      message: "An error occurred while creating the exchange",
    };
  }
}

/** Cardholder and billing details required when creating a card funding source from an Exchange. */
export interface CardDetailsForFundingSource {
  firstName: string;
  lastName: string;
  billingAddress: {
    address1: string;
    city: string;
    stateProvinceRegion: string;
    country: string;
    postalCode: string;
    address2?: string;
  };
}

/**
 * Creates a card funding source for a Customer using an Exchange (Push to Card).
 * Call createExchange first to get the Exchange URL, then pass it here with name and cardDetails.
 */
export async function createCardFundingSource(
  customerId: string,
  exchangeUrl: string,
  name: string,
  cardDetails: CardDetailsForFundingSource
): Promise<NextAPIResponse> {
  try {
    const response = await dwolla.customers.fundingSources.create({
      id: customerId,
      createCustomerFundingSource: {
        links: { exchange: { href: exchangeUrl } },
        name,
        cardDetails: {
          firstName: cardDetails.firstName,
          lastName: cardDetails.lastName,
          billingAddress: {
            address1: cardDetails.billingAddress.address1,
            city: cardDetails.billingAddress.city,
            stateProvinceRegion: cardDetails.billingAddress.stateProvinceRegion,
            country: cardDetails.billingAddress.country,
            postalCode: cardDetails.billingAddress.postalCode,
            ...(cardDetails.billingAddress.address2 != null && { address2: cardDetails.billingAddress.address2 }),
          },
        },
      },
    });
    const location = getLocationFromHeaders(response?.headers);
    if (location) {
      console.log("Card Funding Source created successfully. Location:", location);
      return {
        success: true,
        message: "Card Funding Source created successfully",
        resource: location,
      };
    }
    return {
      success: false,
      message: "No Location header in funding source response",
    };
  } catch (error) {
    console.error("Error creating Dwolla Card Funding Source:", error);
    return {
      success: false,
      message: "An error occurred while creating the card funding source. Please try again later.",
    };
  }
}

/**
 * Gets the settlement funding source for the Dwolla Account (required to send a payout to a card).
 */
export async function getSettlementFundingSource(): Promise<NextAPIResponse> {
  try {
    const root = await dwolla.root.get();
    const accountHref = root.links?.account?.href;
    const accountId = accountHref?.split("/").pop();

    if (!accountId) {
      return {
        success: false,
        message: "Unable to determine Dwolla account from root response",
      };
    }

    const response = await dwolla.accounts.fundingSources.list({ id: accountId, removed: "false" });
    const fundingSources = response.embedded?.fundingSources ?? [];

    const settlement = fundingSources.find(
      (fs: { bankUsageType?: string; links?: { self?: { href?: string } } }) =>
        fs.bankUsageType === "card-network" ||
        equalsIgnoreCase(fs.bankUsageType ?? "", "card-network")
    );

    if (settlement?.links?.self?.href) {
      console.log("Settlement Funding Source retrieved successfully. Location:", settlement.links.self.href);
      return {
        success: true,
        message: "Settlement Funding Source retrieved successfully",
        resource: settlement.links.self.href,
      };
    }

    return {
      success: false,
      message: "Settlement funding source not found for the Dwolla account",
    };
  } catch (error) {
    console.error("Error retrieving Dwolla settlement funding source:", error);
    return {
      success: false,
      message: "An error occurred while retrieving the settlement funding source",
    };
  }
}

/**
 * Creates a payout to the card funding source (Push to Card transfer).
 */
export async function sendPayout(
  cardFundingSourceResource: string,
  formData: FormData
): Promise<NextAPIResponse> {
  const settlementFundingSource = await getSettlementFundingSource();
  if (!settlementFundingSource.success || !settlementFundingSource.resource) {
    return {
      success: false,
      message: "An error occurred while retrieving the settlement funding source",
    };
  }

  const amount = (formData.get("amount") as string | null) ?? "0.01";

  try {
    const response = await (dwolla as unknown as { transfers: { create(request: unknown): Promise<{ headers?: Record<string, string[]> } | undefined> } }).transfers.create({
      requestBody: {
        links: {
          source: { href: settlementFundingSource.resource },
          destination: { href: cardFundingSourceResource },
        },
        amount: { value: amount, currency: "USD" },
      },
    });
    const location = getLocationFromHeaders(response?.headers);
    if (location) {
      console.log("Transfer created successfully. Location:", location);
      return {
        success: true,
        message: "Transfer created successfully",
        resource: location,
      };
    }
    return {
      success: false,
      message: "An error occurred while processing the response",
    };
  } catch (error) {
    console.error("Error creating Dwolla Transfer:", error);
    return {
      success: false,
      message: "An error occurred while creating the transfer. Please try again later.",
    };
  }
}
