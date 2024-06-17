"use server";
import { Client } from "dwolla-v2";
import { getEnvironmentVariable } from "./index";
import { equalsIgnoreCase, getBaseUrl } from "../utils";

export interface CreateFundingSourceOptions {
    customerId: string;
    exchangeId: string;
    name: string;
    type: "checking" | "savings";
}
export interface CreateCustomerOptions {
    firstName: string;
    lastName: string;
    email: string;
}

export interface NextAPIResponse {
    success: boolean;
    message?: string;
    resourceHref?: string;
}

const dwolla = new Client({
    environment: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox",
    key: getEnvironmentVariable("DWOLLA_KEY"),
    secret: getEnvironmentVariable("DWOLLA_SECRET")
});

/**
 * Creates a Customer resource.
 * @param formData - FormData containing firstName, lastName, and email fields.
 * @returns NextAPIResponse containing success status, optional message, and resourceHref if successful.
 */
export async function createCustomer(formData: FormData): Promise<NextAPIResponse> {
    const requestBody: CreateCustomerOptions = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string
    };

    try {
        const response = await dwolla.post("customers", { ...requestBody });
        const location = response.headers.get("location");
        if (location) {
            console.log("Customer created successfully. Location:", location);
            return {
                success: true,
                message: "Customer created successfully",
                resourceHref: location
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
 * Gets VISA's exchange partner href (link) within Dwolla's systems.
 */
export async function getExchangePartnerHref(): Promise<NextAPIResponse> {
    try {
        const response = await dwolla.get("/exchange-partners");
        const partnersList = response.body._embedded["exchange-partners"];
        const visaPartner = partnersList.filter((obj: { name: string }) => equalsIgnoreCase(obj.name, "Visa"))[0];
        console.log("Visa Exchange Partner retrieved successfully :", visaPartner._links.self.href);
        return visaPartner._links.self.href;
    } catch (error) {
        console.error("Error retrieving exchange partners", error);
        return {
            success: false,
            message: "An error occurred while retrieving exchange partners"
        };
    }
}

/**
 * Creates an exchange session for a customer
 * @param customerId - The ID of the customer to create the exchange session for.
 * @returns NextAPIResponse containing success status, optional message, and resourceHref if successful.
 */
export async function createExchangeSession(customerId: string): Promise<NextAPIResponse> {
    const exchangePartnerHref = await getExchangePartnerHref();
    const requestBody = {
        _links: {
            "exchange-partner": {
                href: exchangePartnerHref
            }
        }
    };

    try {
        const response = await dwolla.post(`customers/${customerId}/exchange-sessions`, requestBody);
        const location = response.headers.get("location");
        if (location) {
            console.log("Exchange session created successfully. Location :", location);
            return {
                success: true,
                message: "Exchange session created successfully",
                resourceHref: location
            };
        }
        return {
            success: false
        };
    } catch (error) {
        console.error("Error creating Dwolla Exchange Session:", error);
        return {
            success: false,
            message: "An error occurred while creating the exchange session"
        };
    }
}

/**
 * Retrieves an exchange session url by id
 * @param exchangeSessionId - The ID of the exchange session to retrieve.
 * @returns NextAPIResponse containing success status, optional message, and resourceHref if successful.
 */
export async function getExchangeSession(exchangeSessionId: string): Promise<NextAPIResponse> {
    try {
        const response = await dwolla.get(`/exchange-sessions/${exchangeSessionId}`);
        const externalProviderSessionUrl = response.body._links["external-provider-session"].href;
        console.log("Exchange session retrieved successfully :", externalProviderSessionUrl);
        return {
            success: true,
            resourceHref: externalProviderSessionUrl
        };
    } catch (error) {
        console.error("Error retrieving exchange session:", error);
        return {
            success: false,
            message: "An error occurred while retrieving the exchange session"
        };
    }
}

/**
 * Creates a funding source for a Customer
 * @param options - The options of type CreateFundingSourceOptions for creating the funding source.
 * @returns NextAPIResponse containing success status, optional message, and resourceHref if successful.
 */
export async function createFundingSource(options: CreateFundingSourceOptions): Promise<NextAPIResponse> {
    const { customerId, exchangeId, name, type } = options;
    const exchangeUrl = `${getBaseUrl()}/exchanges/${exchangeId}`;

    const requestBody = {
        _links: {
            exchange: {
                href: exchangeUrl
            }
        },
        bankAccountType: type,
        name: name
    };

    try {
        const response = await dwolla.post(`customers/${customerId}/funding-sources`, requestBody);
        const location = response.headers.get("location");
        if (location) {
            console.log("Funding source created successfully. Location:", location);
            return {
                success: true,
                message: "Funding source created successfully",
                resourceHref: location
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla Funding Source:", error);
        return {
            success: false,
            message: "An error occurred while creating the funding source. Please try again later."
        };
    }
}
