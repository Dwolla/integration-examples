"use server";
import { Dwolla } from "dwolla";
import { getEnvironmentVariable } from "./index";
import { equalsIgnoreCase, getBaseUrl } from "../utils";

export interface NextAPIResponse {
    success: boolean;
    message?: string;
    resource?: string;
}

/**
 * Initializes the Dwolla client with the provided environment and API credentials.
 */
const dwolla = new Dwolla({
  server: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "prod" | "sandbox",
  security: {
    clientID: getEnvironmentVariable("DWOLLA_KEY") ?? "",
    clientSecret: getEnvironmentVariable("DWOLLA_SECRET") ?? "",
  }
});

/**
 * Creates a Customer resource.
 * @param formData - FormData containing firstName, lastName, and email fields.
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
export async function createCustomer(formData: FormData): Promise<NextAPIResponse> {

    try {
        const response = await dwolla.customers.create({ 
            type: "unverified", 
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string  
        });
        const location = response?.headers?.location;
        if (location) {
            console.log("Customer created successfully. Location:", location);
            return {
                success: true,
                message: "Customer created successfully",
                resource: location?.[0] ?? undefined
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla Customer:", error);
        return {
            success: false,
            message: "An error occurred while creating the customer. Please try again later."
        };
    }
}

/**
 * Creates a card funding source for a Customer using a Checkout.com card token.
 * Returns the Location header if successful, otherwise undefined.
 */
export async function createCardFundingSource(
  customerId: string,
  cardToken: string,
  billingAddress: {
    address1: string;
    city: string;
    stateProvinceRegion: string;
    country: string;
    postalCode: string;
  }
): Promise<NextAPIResponse> {
  const requestBody = {
    cardToken,
    name: "Checkout.com card",
    cardDetails: {
      billingAddress
    }
  };

    try {
        const response = await dwolla.customers.fundingSources.create({id: customerId, createCustomerFundingSource: requestBody});
        const location = response?.headers?.location;
        if (location) {
            console.log("Card Funding Source created successfully. Location:", location);
            return {
                success: true,
                message: "Card Funding Source created successfully",
                resource: location?.[0] ?? undefined
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla Card Funding Source :", error);
        return {
            success: false,
            message: "An error occurred while creating the card funding source. Please try again later."
        };
    }
}

/**
 * Gets the settlement funding source for the Dwolla Account. This is required to send a payout to the card funding source.
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
export async function getSettlementFundingSource(): Promise<NextAPIResponse> {
    try {
        // 1) Discover the main account from the API root.
        const root = await dwolla.root.get();
        const accountHref = root.links?.account?.href;
        const accountId = accountHref?.split("/").pop();

        if (!accountId) {
            return {
                success: false,
                message: "Unable to determine Dwolla account from root response"
            };
        }

        // 2) List funding sources for the account and locate the settlement (card-network) account.
        const response = await dwolla.accounts.fundingSources.list({ id: accountId, removed: "false" });
        const fundingSources = response.embedded?.fundingSources ?? [];

        const settlement = fundingSources.find(
            (fs) =>
                fs.bankUsageType === "card-network" ||
                equalsIgnoreCase(fs.bankUsageType ?? "", "card-network")
        );

        if (settlement?.links?.self?.href) {
            console.log("Settlement Funding Source retrieved successfully. Location:", settlement.links.self.href);
            return {
                success: true,
                message: "Settlement Funding Source retrieved successfully",
                resource: settlement.links.self.href
            };
        }

        return {
            success: false,
            message: "Settlement funding source not found for the Dwolla account"
        };
    } catch (error) {
        console.error("Error retrieving Dwolla settlement funding source:", error);
        return {
            success: false,
            message: "An error occurred while retrieving the settlement funding source"
        };
    }
}

/**
 * Creates an payout to the card funding source
 * @param cardFundingSourceId - The ID of the card funding source to send the payout to
 * @param formData - The form data containing the amount to transfer
 * @returns NextAPIResponse containing success status, optional message, and resource if successful.
 */
export async function sendPayout(cardFundingSourceId: string, formData: FormData): Promise<NextAPIResponse> {
    // 1) Get the settlement funding source for the Dwolla Account
    const settlementFundingSource = await getSettlementFundingSource();
    if (!settlementFundingSource.success) {
        return {
            success: false,
            message: "An error occurred while retrieving the settlement funding source"
        };
    }

    // 2) Create the transfer
    const amount = (formData.get("amount") as string | null) ?? "0.01";

    const requestBody = {
        links: {
            source: {
                href: settlementFundingSource.resource
            },
            destination: {
                href: getBaseUrl() + "/funding-sources/" + cardFundingSourceId
            }
        },
        amount: {
            value: amount,
            currency: "USD"
        }
    };

    console.log("Transfer request body:", requestBody);

    try {
        const response = await dwolla.transfers.create({ requestBody });
        const location = response?.headers?.location;
        if (location) {
            console.log("Transfer created successfully. Location:", location);
            return {
                success: true,
                message: "Transfer created successfully",
                resource: location?.[0] ?? undefined
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla Transfer:", error);
        return {
            success: false,
            message: "An error occurred while creating the transfer. Please try again later."
        };
    }
}
