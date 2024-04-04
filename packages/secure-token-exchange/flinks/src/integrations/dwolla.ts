import { Client } from "dwolla-v2";
import { equalsIgnoreCase } from "../utils";
import { getEnvironmentVariable } from "./";

export interface CreateExchangeOptions {
    customerId: string;
    exchangePartnerHref: string;
    authSecret: string;
    accessToken: string;
}

export interface CreateFundingSourceOptions {
    customerId: string;
    exchangeUrl: string;
    name: string;
    type: "checking" | "savings";
}

export interface CreateUnverifiedCustomerOptions {
    firstName: string;
    lastName: string;
    email: string;
}

const client = new Client({
    environment: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox",
    key: getEnvironmentVariable("DWOLLA_KEY"),
    secret: getEnvironmentVariable("DWOLLA_SECRET")
});

/**
 * Creates a customer exchange resource using the token that was retrieved from Flinks.
 */
export async function createExchange({
    customerId,
    exchangePartnerHref,
    authSecret,
    accessToken
}: CreateExchangeOptions): Promise<string> {
    const response = await client.post(`/customers/${customerId}/exchanges`, {
        _links: {
            "exchange-partner": {
                href: exchangePartnerHref
            }
        },
        token: tokenifyFlinksAuth(authSecret, accessToken)
    });
    return response.headers.get("Location");
}

/**
 * Creates a funding source for a customer using an exchange URL.
 */
export async function createFundingSource({
    customerId,
    exchangeUrl,
    name,
    type
}: CreateFundingSourceOptions): Promise<string> {
    const response = await client.post(`/customers/${customerId}/funding-sources`, {
        _links: {
            exchange: {
                href: exchangeUrl
            }
        },
        bankAccountType: type,
        name
    });
    return response.headers.get("Location");
}

/**
 * Creates an unverified customer record.
 */
export async function createUnverifiedCustomer(options: CreateUnverifiedCustomerOptions): Promise<string> {
    const response = await client.post("customers", { ...options });
    return response.headers.get("Location");
}

/**
 * Gets Flinks' exchange partner href (link) within Dwolla's systems.
 */
export async function getExchangePartnerHref(): Promise<string> {
    const response = await client.get("/exchange-partners");
    const partnersList = response.body._embedded["exchange-partners"];
    const flinksPartner = partnersList.filter((obj: { name: string }) => equalsIgnoreCase(obj.name, "Flinks"))[0];
    return flinksPartner._links.self.href;
}

/**
 * Combine Flinks AuthSecret and AccessToken in Basic Auth format and then Base64 encode.
 * 
 * This token is used to create a Dwolla exchange.
 */
function tokenifyFlinksAuth(authSecret: string, accessToken: string): string {
    return Buffer.from(`${authSecret}:${accessToken}`, 'utf-8').toString("base64");
}
