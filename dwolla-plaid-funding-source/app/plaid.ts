import {
    Configuration,
    CountryCode,
    LinkTokenCreateRequest,
    PlaidApi,
    PlaidEnvironments,
    ProcessorTokenCreateRequest,
    ProcessorTokenCreateRequestProcessorEnum,
    Products
} from "plaid";
import { v4 as uuidv4 } from "uuid";

const plaidClient = new PlaidApi(
    new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV as string],
        baseOptions: {
            headers: {
                "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID as string,
                "PLAID-SECRET": process.env.PLAID_SECRET as string,
                "Plaid-Version": "2020-09-14"
            }
        }
    })
);

/**
 * Create a Plaid Link Token
 */
export const createLinkToken = async () => {
    const request: LinkTokenCreateRequest = {
        client_name: "Dwolla-Plaid Integration Example",
        country_codes: [CountryCode.Us],
        language: "en",
        products: [Products.Auth],
        user: {
            // TODO: Generate a user ID. In a production environment, this should be fetched from a database.
            client_user_id: uuidv4()
        },
        redirect_uri: "http://localhost:3000"
    };

    try {
        const response = await plaidClient.linkTokenCreate(request);
        return response.data;
    } catch (err) {
        console.error("Create Link Token Failed: ", err);
    }
};

/**
 * Taking a Plaid Public Token and Account, exchange it for a Processor Token
 */
export const exchangePublicToken = async (accountId: string, publicToken: string) => {
    try {
        const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
        const accessToken = tokenResponse.data.access_token;

        const processTokenResponse = await plaidClient.processorTokenCreate({
            access_token: accessToken,
            account_id: accountId,
            processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla
        } as ProcessorTokenCreateRequest);

        return processTokenResponse.data.processor_token;
    } catch (err) {
        console.error("Exchanging Public Token Failed: ", err);
    }
};
