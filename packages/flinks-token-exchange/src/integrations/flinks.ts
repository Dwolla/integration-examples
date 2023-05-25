import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { getEnvironmentVariable } from ".";

export interface Account {
    readonly Id: string;
}

export interface GenerateRequestIdOptions {
    loginId: string;
    mostRecentCached?: boolean;
}

export interface GenerateRequestIdResponse {
    readonly RequestId: string;
}

export interface GetAccountsSummaryOptions {
    requestId: string;
    withBalance?: boolean;
}

export interface GetAccountsSummaryResponse {
    readonly Accounts: Account | Account[];
}

export interface RequestAuthSecretOptions {
    nameOfPartner: string;
}

export interface RequestAuthSecretResponse {
    readonly AuthSecret: string;
}

export interface RequestAccessTokenOptions {
    loginId: string;
    accountId: string;
}

export interface RequestAccessTokenResponse {
    readonly AccessToken: string;
}

const DWOLLA_ENV = getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox";
const API_SECRET = getEnvironmentVariable("FLINKS_API_SECRET");
const INSTANCE = getEnvironmentVariable("FLINKS_INSTANCE");
const CUSTOMER_ID = getEnvironmentVariable("FLINKS_CUSTOMER_ID");

const FLINKS_BASE_URI = `https://${INSTANCE}-api.private.fin.ag/v3/${CUSTOMER_ID}`;

const axiosRequestConfig: AxiosRequestConfig = {
    headers: {
        Accept: "application/json"
    }
};

const axiosInstance = axios.create(axiosRequestConfig);

/**
 * Builds a IFrame URL that allows the user to connect their FI.
 * @see {@link https://docs.flinks.com/docs/connecting-accounts-widget|Flinks Connect Widget}
 */
export function buildConnectWidget(): { url: string; isDemo: boolean } {
    const useDemo = Boolean(DWOLLA_ENV === "sandbox");
    return { url: `https://${INSTANCE}-iframe.private.fin.ag/v2/?demo=${useDemo}`, isDemo: useDemo };
}

/**
 * Generates a Flinks requestId which is used to call Flinks' accounts summary API.
 *
 * @see {@link https://docs.flinks.com/reference/authorize|/Authorize}
 */
export async function generateRequestId(options: GenerateRequestIdOptions): Promise<GenerateRequestIdResponse> {
    const response = await axiosInstance.post(
        `${FLINKS_BASE_URI}/BankingServices/Authorize`,
        {
            LoginId: options.loginId,
            MostRecentCached: options.mostRecentCached ?? true
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
    return { RequestId: response.data.RequestId };
}

/**
 * Generates a Flinks requestId which is used to call Flinks' accounts summary API.
 *
 * @see {@link https://docs.flinks.com/reference/getaccountssummary|/GetAccountsSummary}
 */
export async function getAccountsSummary(options: GetAccountsSummaryOptions): Promise<GetAccountsSummaryResponse> {
    const response = await axiosInstance.post(
        `${FLINKS_BASE_URI}/BankingServices/GetAccountsSummary`,
        {
            RequestId: options.requestId,
            WithBalance: options.withBalance
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
    return { Accounts: response.data.Accounts };
}

/**
 * Requests an AuthSecret from Flinks that is sent to Dwolla.
 *
 * @see {@link https://docs.flinks.com/reference/authsecret|/AuthSecret}
 */
export async function requestAuthSecret(options: RequestAuthSecretOptions): Promise<RequestAuthSecretResponse> {
    const response = await axiosInstance.get(`${FLINKS_BASE_URI}/partnerdata/authsecret/${options.nameOfPartner}`, {
        headers: {
            Authorization: `Bearer ${API_SECRET}`
        }
    });
    return { AuthSecret: response.data.AuthSecret };
}

/**
 * Requests an AccessToken from Flinks that is sent to Dwolla.
 *
 * @see {@link https://docs.flinks.com/reference/partnerdata-client|/PartnerData}
 */
export async function requestAccessToken(options: RequestAccessTokenOptions): Promise<RequestAccessTokenResponse> {
    const response = await axiosInstance.get(`${FLINKS_BASE_URI}/partnerdata/${options.loginId}/${options.accountId}`, {
        headers: {
            Authorization: `Bearer ${API_SECRET}`
        }
    });
    return { AccessToken: response.data.AccessToken };
}
