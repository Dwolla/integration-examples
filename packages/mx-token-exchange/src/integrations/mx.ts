import type { AccountNumberResponse, UserResponse } from "mx-platform-node";
import { Configuration, MxPlatformApi } from "mx-platform-node";
import { getEnvironmentVariable, newUuid } from "./";

export interface CreateUserOptions {
    email: string;
}

export interface GenerateWidgetOptions {
    userGuid: string;
}

export interface ListVerifiedAccountsOptions {
    memberGuid: string;
    userGuid: string;
}

export interface RequestAuthorizationCodeOptions {
    accountGuid: string;
    memberGuid: string;
    userGuid: string;
}

export interface RequestAuthorizationCodeResponse {
    readonly code?: string;
}

export interface RequestAuthorizationCodeResponseBody {
    readonly authorization_code: RequestAuthorizationCodeResponse;
}

const ACCEPT_HEADER = "application/vnd.mx.api.v1+json";
const API_KEY = getEnvironmentVariable("MX_API_KEY");
const BASE_PATH = getEnvironmentVariable("MX_BASE_PATH");
const CLIENT_ID = getEnvironmentVariable("MX_CLIENT_ID");

const configuration = new Configuration({
    baseOptions: {
        headers: {
            Accept: ACCEPT_HEADER
        }
    },
    basePath: BASE_PATH,
    username: CLIENT_ID,
    password: API_KEY
});

const client = new MxPlatformApi(configuration);

/**
 * Creates an MX user.
 * @see {@link https://docs.mx.com/processor_token/guides/client_guide#create_user|Create a User - MX}
 */
export async function createUser({ email }: CreateUserOptions): Promise<UserResponse | undefined> {
    return (
        await client.createUser({
            user: {
                id: newUuid(),
                email
            }
        })
    ).data.user;
}

/**
 * Generates a Connect URL that allows the user to connect their FI.
 * @see {@link https://docs.mx.com/processor_token/guides/client_guide#connect_institution|Connect the User to an Institution - MX}
 */
export async function generateWidgetUrl({ userGuid }: GenerateWidgetOptions): Promise<string | undefined> {
    return (
        (
            await client.requestConnectWidgetURL(userGuid, {
                config: {
                    mode: "verification",
                    ui_message_version: 4
                }
            })
        ).data.user?.connect_widget_url ?? undefined
    );
}

/**
 * Lists verified accounts, identified by a member/user GUID.
 * @see {@link https://docs.mx.com/processor_token/guides/client_guide#verified_institution|Retrieve a List of Verified Accounts - MX}
 */
export async function listVerifiedAccounts({
    memberGuid,
    userGuid
}: ListVerifiedAccountsOptions): Promise<AccountNumberResponse[] | undefined> {
    return (await client.listAccountNumbersByMember(memberGuid, userGuid)).data.account_numbers;
}

/**
 * Requests an authorization code from MX that is sent to Dwolla.
 *
 * **Note**: This is currently making an Axios request instead of using MX's SDK since this method has not
 * yet been implemented in their OpenAPI spec. If it's implemented at a later date, though, then this function
 * should get switched out for the SDK method, provided that one exists.
 *
 * @see {@link https://docs.mx.com/api#processor_token_client_endpoints_authorization_code|Request an Authorization Code - MX}
 */
export async function requestAuthorizationCode(
    options: RequestAuthorizationCodeOptions
): Promise<RequestAuthorizationCodeResponse> {
    return (
        await client["axios"].post<RequestAuthorizationCodeResponseBody>(
            "/authorization_code",
            {
                authorization_code: {
                    scope: `account-guid:${options.accountGuid} member-guid:${options.memberGuid} user-guid:${options.userGuid} read-protected`
                }
            },
            {
                auth: {
                    username: CLIENT_ID,
                    password: API_KEY
                },
                baseURL: BASE_PATH,
                headers: {
                    Accept: ACCEPT_HEADER,
                    "Content-Type": "application/json"
                }
            }
        )
    ).data.authorization_code;
}
