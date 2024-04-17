"use server";
import { Client } from "dwolla-v2";
import { getEnvironmentVariable } from "./index";
import { equalsIgnoreCase } from "../../utils";

export interface CreateExchangeOptions {
    externalPartyId: string;
    exchangePartnerHref: string;
    mx: {
        memberId: string;
        accountId: string;
    };
}

export interface CreateExchangeSessionOptions {
    exchangePartnerHref: string;
}

export interface CreateFundingSourceOptions {
    externalPartyId: string;
    exchangeUrl: string;
    name: string;
    type: "checking" | "savings";
}
export interface CreateExternalPartyOptions {
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
 * Creates an external party resource.
 * @param formData - FormData containing firstName, lastName, and email fields.
 * @returns NextAPIResponse containing success status, optional message, and resourceHref if successful.
 */
export async function createExternalParty(formData: FormData): Promise<NextAPIResponse> {
    const requestBody: CreateExternalPartyOptions = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string
    };

    try {
        const response = await dwolla.post("external-parties", { ...requestBody });
        const location = response.headers.get("location");
        if (location) {
            console.log("External party created successfully. Location:", location);
            return {
                success: true,
                message: "External party created successfully",
                resourceHref: location
            };
        }
        return {
            success: false,
            message: "An error occurred while processing the response"
        };
    } catch (error) {
        console.error("Error creating Dwolla External Party:", error);
        return {
            success: false,
            message: "An error occurred while creating the external party. Please try again later."
        };
    }
}

/**
 * Gets MX's exchange partner href (link) within Dwolla's systems.
 */
export async function getExchangePartnerHref(): Promise<NextAPIResponse> {
    try {
        const response = await dwolla.get("/exchange-partners");
        const partnersList = response.body._embedded["exchange-partners"];
        const mxPartner = partnersList.filter((obj: { name: string }) => equalsIgnoreCase(obj.name, "MX"))[0];
        console.log("MX External party retrieved successfully :", mxPartner._links.self.href);
        return mxPartner._links.self.href;
    } catch (error) {
        console.error("Error retrieving exchange partners", error);
        return {
            success: false,
            message: "An error occurred while retrieving exchange partners"
        };
    }
}

/**
 * Creates an exchange session for an external party
 */
export async function createExchangeSession(externalPartyId: string): Promise<NextAPIResponse> {
    const exchangePartnerHref = await getExchangePartnerHref();
    const requestBody = {
        _links: {
            "exchange-partner": {
                href: exchangePartnerHref
            }
        }
    };

    try {
        const response = await dwolla.post(`external-parties/${externalPartyId}/exchange-sessions`, requestBody);
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
 */

export async function getExchangeSession(exchangeSessioId: string): Promise<NextAPIResponse> {
    try {
        const response = await dwolla.get(`/exchange-sessions/${exchangeSessioId}`);
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
 * Creates an exchange for an external party
 */
export async function createExchange(
    externalPartyId: string,
    memberId: string,
    accountId: string
): Promise<NextAPIResponse> {
    const exchangePartnerHref = await getExchangePartnerHref();
    const requestBody = {
        _links: {
            "exchange-partner": {
                href: exchangePartnerHref
            }
        },
        mx: {
            memberId: memberId,
            accountId: accountId
        }
    };

    try {
        const response = await dwolla.post(`external-parties/${externalPartyId}/exchanges`, requestBody);
        const location = response.headers.get("location");
        if (location) {
            console.log("Exchange created successfully. Location :", location);
            return {
                success: true,
                message: "Exchange  created successfully",
                resourceHref: location
            };
        }
        return {
            success: false
        };
    } catch (error) {
        console.error("Error creating Dwolla Exchange:", error);
        return {
            success: false,
            message: "An error occurred while creating the exchange"
        };
    }
}
