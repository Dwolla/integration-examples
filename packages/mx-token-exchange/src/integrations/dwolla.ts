import { Client } from "dwolla-v2";
import { getEnvironmentVariable } from "./";

export interface CreateExchangeOptions extends WithCustomerId {
    exchangePartnerId: string;
    token: string;
}

export interface CreateFundingSourceOptions extends WithCustomerId {
    exchangeUrl: string;
    name: string;
    type: "checking" | "savings";
}

export interface CreateUnverifiedCustomerOptions {
    firstName: string;
    lastName: string;
    email: string;
}

interface WithCustomerId {
    customerId: string;
}

const client = new Client({
    environment: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox",
    key: getEnvironmentVariable("DWOLLA_KEY"),
    secret: getEnvironmentVariable("DWOLLA_SECRET")
});

/**
 * Creates a customer exchange resource using the token that was retrieved from MX.
 */
export async function createExchange({ customerId, exchangePartnerId, token }: CreateExchangeOptions): Promise<string> {
    const response = await client.post(`/customers/${customerId}/exchanges`, {
        exchangePartnerId,
        token
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
 * Compare two strings for equality, ignore case sensitivity, except for accent characters
 */
function equalsIgnoreCase(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

/**
 * Gets MX's exchange partner ID within Dwolla's systems.
 */
export async function getExchangeId(): Promise<string> {
    const response = await client.get("/exchange-partners");
    const partnersList = response.body._embedded["exchange-partners"];
    const mxPartner = partnersList.filter((obj: { name: string }) => equalsIgnoreCase(obj.name, "MX"))[0];
    return mxPartner.exchangePartnerId;
}
