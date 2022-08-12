import {
    AccountsApi,
    AuthenticationApi,
    Configuration,
    ConnectApi,
    CustomerAccount,
    CustomersApi
} from "@finicity/node-sdk";
import { BaseAPI } from "@finicity/node-sdk/dist/base";
import axios, { AxiosRequestConfig } from "axios";

export interface CreateCustomerOptions {
    username: string;
}

export interface FetchPartnerConsentOptions extends WithCustomerId {
    accountId: string;
}

export interface GenerateConnectUrlOptions extends WithCustomerId {}

export interface GetCustomerAccountsOptions extends WithCustomerId {}

interface WithCustomerId {
    customerId: string;
}

type Constructable<APIType extends BaseAPI> = { new (...args: any[]): APIType };

// Dwolla's hardcoded Finicity partner ID
const DWOLLA_PARTNER_ID: string = "2445583946651";

// NOTE: Once Finicity has this endpoint documented, that should be used instead.
// This is only being used since the OpenAPI spec does not currently export this endpoint.
const FINICITY_PARTNER_CONSENT_URL: string = "https://api.finicity.com/aggregation/v1/partners/accessKey";

const axiosRequestConfig: AxiosRequestConfig = {
    headers: {
        "Finicity-App-Key": process.env.FINICITY_APP_KEY as string
    }
};

const axiosInstance = axios.create(axiosRequestConfig);
const { create: createInterceptor } = withTokenInterceptor();
const { getCurrent: getCurrentToken, getExpiration: getTokenExpiration, refresh: refreshToken } = withTokenManager();

/**
 * Creates a testing customer in Finicity. This is required for all other API calls.
 */
export async function createTestingCustomer(options: CreateCustomerOptions): Promise<string> {
    const customersClient = await getApiWithInterceptor(CustomersApi);
    const response = await customersClient.addTestingCustomer({ ...options });
    return response.data.id;
}

/**
 * Fetches the partner consent for Dwolla from Finicity, given the bank account ID and customer ID.
 */
export async function fetchPartnerConsent({ accountId, customerId }: FetchPartnerConsentOptions): Promise<any> {
    await createInterceptor();

    const date = new Date();
    const startTime = date.toISOString();
    const endTime = incrementOneMonth(date).toISOString();

    const response = await axiosInstance.post(FINICITY_PARTNER_CONSENT_URL, {
        customerId,
        partnerId: process.env.FINICITY_PARTNER_ID as string,
        thirdPartyPartnerId: DWOLLA_PARTNER_ID,
        products: [
            {
                product: "moneyTransferDetails",
                payorId: process.env.FINICITY_PARTNER_ID as string,
                accountId,
                maxCalls: 10,
                accessPeriod: {
                    type: "timeframe",
                    startTime,
                    endTime
                }
            }
        ]
    });
    return response.data.data[0].receipt;
}

/**
 * Generates a Connect URL that is used to allow the customer to connect their bank accounts with Finicity.
 */
export async function generateConnectUrl({ customerId }: GenerateConnectUrlOptions): Promise<string> {
    const connectClient = await getApiWithInterceptor(ConnectApi);
    const response = await connectClient.generateConnectUrl({
        customerId,
        partnerId: process.env.FINICITY_PARTNER_ID as string
    });
    return response.data.link;
}

/**
 * Gets an array of accounts that the given customer has associated with their account.
 */
export async function getCustomerAccounts({ customerId }: GetCustomerAccountsOptions): Promise<CustomerAccount[]> {
    const accountsClient = await getApiWithInterceptor(AccountsApi);
    const response = await accountsClient.getCustomerAccounts(customerId);
    return response.data.accounts;
}

/**
 * Helper function that creates a new instance of the API class specified with a token injector present.
 */
async function getApiWithInterceptor<APIType extends BaseAPI>(apiClass: Constructable<APIType>): Promise<APIType> {
    await createInterceptor();
    return new apiClass(undefined, undefined, axiosInstance);
}

/**
 * Helper function to increment the given date by an additional month.
 */
function incrementOneMonth(date: Date) {
    const newDate = date;
    newDate.setMonth(date.getMonth() + 1);
    return newDate;
}

/**
 * Closure that manages the interceptor for Axios requests. When an interceptor is added to Axios, upon each
 * request to Finicity, an app token is injected as the Finicity-App-Token header.
 */
function withTokenInterceptor(): { create: () => Promise<void> } {
    let hasInjected = false;

    return {
        create: async function (): Promise<void> {
            if (hasInjected) return;
            axiosInstance.interceptors.request.use(async (config) => {
                const tokenExpiration = getTokenExpiration();
                if (!tokenExpiration || tokenExpiration < new Date()) await refreshToken();

                // @ts-ignore
                config.headers["Finicity-App-Token"] = getCurrentToken();
                return config;
            });
            hasInjected = true;
        }
    };
}

/**
 * Closure that manages Finicity's token, with additional functions that can be used to get
 * the value of the current token, get when the current token expires, and refresh the token.
 */
function withTokenManager(): {
    getCurrent: () => string | undefined;
    getExpiration: () => Date | undefined;
    refresh: () => Promise<void>;
} {
    let currentToken: string | undefined;
    let tokenExpiration: Date | undefined;

    return {
        getCurrent: function (): string | undefined {
            return currentToken;
        },
        getExpiration: function (): Date | undefined {
            return tokenExpiration;
        },
        refresh: async function (): Promise<void> {
            const authClient = new AuthenticationApi(new Configuration({ baseOptions: axiosRequestConfig }));
            const newToken = await authClient.createToken({
                partnerId: process.env.FINICITY_PARTNER_ID as string,
                partnerSecret: process.env.FINICITY_PARTNER_SECRET as string
            });

            currentToken = newToken.data.token;
            tokenExpiration = new Date();
            tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 90);
        }
    };
}
