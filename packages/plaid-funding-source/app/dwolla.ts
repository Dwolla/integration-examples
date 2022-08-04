import { Client } from "dwolla-v2";

export interface CreateFundingSourceOptions {
    customerId: string; // Dwolla Customer ID
    fundingSourceName: string; // Dwolla Funding Source Name
    plaidToken: string; // Plaid Account Processor Token
}

const getEnvironment = (): "production" | "sandbox" => {
    const environment = process.env.DWOLLA_ENV as string;

    switch (environment) {
        case "sandbox":
            return "sandbox";
        case "production":
            return "production";
        default:
            throw new Error("Dwolla environment should either be set to `sandbox` or `production`");
    }
};

const dwollaClient = new Client({
    environment: getEnvironment(),
    key: process.env.DWOLLA_KEY as string,
    secret: process.env.DWOLLA_SECRET as string
});

/**
 * Create a Dwolla Funding Source using a Plaid Processor Token
 */
export const createFundingSource = async (options: CreateFundingSourceOptions) => {
    try {
        return await dwollaClient.post(`customers/${options.customerId}/funding-sources`, {
            name: options.fundingSourceName,
            plaidToken: options.plaidToken
        });
    } catch (err) {
        console.error("Creating a Funding Source Failed: ", err);
    }
};
