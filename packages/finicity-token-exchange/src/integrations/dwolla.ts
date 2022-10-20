import { Client } from "dwolla-v2";

export interface CreateExchangeOptions extends WithCustomerId {
    exchangePartnerHref: string;
    finicityReceipt: unknown;
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
    environment: (process.env.DWOLLA_ENV as string).toLowerCase() as "production" | "sandbox",
    key: process.env.DWOLLA_KEY as string,
    secret: process.env.DWOLLA_SECRET as string
});

/**
 * Creates a customer exchange resource using the receipt that was retrieved from Finicity.
 */
export async function createExchange({
    customerId,
    exchangePartnerHref,
    finicityReceipt
}: CreateExchangeOptions): Promise<string> {
    const response = await client.post(`/customers/${customerId}/exchanges`, {
        _links: {
            "exchange-partner": {
                href: exchangePartnerHref
            }
        },
        finicity: finicityReceipt
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
 * Gets Finicity's exchange partner ID within Dwolla's systems.
 */
export async function getExchangePartnerHref(): Promise<string> {
    const response = await client.get("/exchange-partners");
    const partnersList = response.body._embedded["exchange-partners"];
    const finicityPartner = partnersList.filter((obj: { name: string }) => obj.name === "Finicity")[0];
    return finicityPartner._links.self.href;
}
