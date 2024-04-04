import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { validate as validateUUID } from "uuid";
import { Card, CardContent, CardHeader, Container, LinearProgress, Typography } from "@mui/material";
import { useFlinksConnect } from "../hooks/useFlinksConnect";
import MainLayout from "../layouts/MainLayout";
import { buildConnectWidget } from "../integrations/flinks";
import type { GetServerSideProps, GetServerSidePropsResult, NextPage } from "next";
import type { ParsedUrlQuery } from "querystring";
import type { ConnectEvent, ConnectSuccessEvent } from "../hooks/useFlinksConnect";
import type { FlinksAuthSecretAPIBody, FlinksAuthSecretAPIResponse } from "./api/flinks/auth-secret";
import type { FlinksAccessTokenAPIBody, FlinksAccessTokenAPIResponse } from "./api/flinks/access-token";
import type {
    FlinksGetAccountsSummaryAPIBody,
    FlinksGetAccountsSummaryAPIResponse
} from "./api/flinks/accounts-summary";
import type { FlinksGenerateRequestIdAPIBody, FlinksGenerateRequestIdAPIResponse } from "./api/flinks/request-id";
import type { CreateExchangeOptions } from "../integrations/dwolla";

interface Props {
    widgetUrl: string;
    isDemo: boolean;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
}

interface Progress {
    showProgress: boolean;
    title: string;
    message: string;
}

export const ConnectFlinksPage: NextPage<Props> = ({ widgetUrl, isDemo }) => {
    const router = useRouter();
    const { applyStyles } = useFlinksConnect(onMessage);
    const { dwollaCustomerId } = router.query as Query;

    const [progress, setProgress] = useState<Progress>({
        showProgress: true,
        title: "Connecting...",
        message: "Please wait while we connect to Flinks. This make take a few moments."
    });

    const [flinksAuth, setFlinksAuth] = useState<Pick<CreateExchangeOptions, "accessToken" | "authSecret">>({
        accessToken: "",
        authSecret: ""
    });

    useEffect(() => {
        applyStyles();
    }, [applyStyles]);

    const routerPush = router.push;

    useEffect(() => {
        if (validateUUID(flinksAuth.accessToken) && validateUUID(flinksAuth.authSecret)) {
            routerPush({
                pathname: "/connect-exchange",
                query: { dwollaCustomerId, ...flinksAuth }
            });
        }
    }, [dwollaCustomerId, flinksAuth, routerPush]);

    // Executes when Flinks Connect Widget has loaded successfully
    function onMount() {
        setProgress({ ...progress, showProgress: false });
        getAuthSecret().then(({ AuthSecret }) => {
            // In a production environment, AuthSecret should only be obtained from Flinks once because it doesn't change.
            if (!AuthSecret) return alert("No auth secret was returned from getAuthSecret().");
            setFlinksAuth({ ...flinksAuth, authSecret: AuthSecret });
        });
    }

    /**
     * Executes after an Account is successfully connected
     *
     * NOTE: This function fetches Accounts and only sends an AccessToken for the first item.
     * This should NOT be used in a production environment. Instead, the user should be given the option
     * to choose which FI account they'd like to associate with their Dwolla exchange resource.
     */
    function onConnectSuccess(event: ConnectSuccessEvent) {
        // In a production environment, loginId should be stored for later use.
        generateRequestId(event.loginId)
            .then(({ RequestId }) => {
                // RequestId is only valid for 30 minutes
                if (!RequestId) return Promise.reject("No request id was returned from generateRequestId().");
                return getAccountsSummary(RequestId);
            })
            .then(({ Accounts }) => {
                if (!Accounts) return Promise.reject("No accounts were returned from getAccountsSummary().");
                return getAccessToken(event.loginId, "Id" in Accounts ? Accounts.Id : Accounts[0].Id);
            })
            .then(({ AccessToken }) => {
                if (!AccessToken) return Promise.reject("No access token was returned from getAccessToken().");
                return Promise.resolve(AccessToken);
            })
            .then((accessToken) => {
                setFlinksAuth({ ...flinksAuth, accessToken });
            })
            .catch((error) => {
                alert(error);
                setProgress({ ...progress, showProgress: false });
            });
    }

    // Handles Flinks events
    function onMessage(event: MessageEvent<Record<string, unknown> | ConnectEvent | ConnectSuccessEvent>) {
        if (!isConnectEvent(event.data)) {
            return;
        } else if (event.data.step === "APP_MOUNTED") {
            onMount();
        } else if (event.data.step === "REDIRECT") {
            if (!isConnectSuccessEvent(event.data)) {
                alert(
                    "Could not find Flinks loginId in step:REDIRECT. See https://docs.flinks.com/docs/connect-new-accounts#javascript-event-listener"
                );
                return;
            }
            setTimeout(() => {
                setProgress({
                    showProgress: true,
                    title: "Communicating with Flinks' API",
                    message: "Please wait while we retrieve an AuthSecret and AccessToken from Flinks."
                });
            }, 1000);
            onConnectSuccess(event.data);
        }
    }

    return (
        <MainLayout title="Step 2: Connect Bank with Flinks">
            {progress.showProgress && (
                <Card sx={{ padding: 3 }}>
                    <CardHeader title={progress.title} />
                    <CardContent>
                        <LinearProgress />
                        <Typography component="p" sx={{ mt: 1 }} variant="body1">
                            {progress.message}
                        </Typography>
                    </CardContent>
                </Card>
            )}
            <Container sx={{ visibility: progress.showProgress ? "hidden" : "visible" }}>
                {isDemo && (
                    <Card sx={{ padding: 3, my: 3 }}>
                        <CardHeader title="Note from Dwolla" />
                        <CardContent>
                            <Typography
                                component="p"
                                sx={{ mt: 1, textAlign: "left", width: "100%", fontStyle: "italic" }}
                                variant="body1"
                            >
                                For testing in Dwolla&apos;s Sandbox, please coordinate with Flinks to setup a dummy
                                username and password that will connect an account with a valid US routing number.
                            </Typography>
                        </CardContent>
                    </Card>
                )}
                <iframe className="flinksconnect" height="760" src={widgetUrl} style={{ border: "none" }}></iframe>
            </Container>
        </MainLayout>
    );
};

function isConnectEvent(data: Record<string, unknown> | ConnectEvent | ConnectSuccessEvent): data is ConnectEvent {
    const event = data as ConnectEvent;
    return event !== undefined && event.step !== undefined;
}

function isConnectSuccessEvent(
    data: Record<string, unknown> | ConnectEvent | ConnectSuccessEvent
): data is ConnectSuccessEvent {
    const event = data as ConnectSuccessEvent;
    return isConnectEvent(event) && event.loginId !== undefined;
}

/**
 * Calls our Next API to get Auth Secret from Flinks. This Auth Secret will be sent to Dwolla.
 * @returns - Flinks AuthSecret
 */
async function getAuthSecret(): Promise<FlinksAuthSecretAPIResponse> {
    const body: FlinksAuthSecretAPIBody = { nameOfPartner: "Dwolla" };
    const response = await fetch(`/api/flinks/auth-secret`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) return {};
    return response.json();
}

/**
 * Calls our Next API to generate the Request Id
 * @returns - The Flinks Request Id
 */
async function generateRequestId(loginId: string): Promise<FlinksGenerateRequestIdAPIResponse> {
    const body: FlinksGenerateRequestIdAPIBody = { loginId };
    const response = await fetch(`/api/flinks/request-id`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) return {};
    return response.json();
}

/**
 * Calls our Next API to get accounts summary
 * @returns - An array of Flinks accounts. Only the first is used.
 */
async function getAccountsSummary(requestId: string): Promise<FlinksGetAccountsSummaryAPIResponse> {
    const body: FlinksGetAccountsSummaryAPIBody = { requestId };
    const response = await fetch(`/api/flinks/accounts-summary`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) return {};
    return response.json();
}

/**
 * Calls our Next API to get an Access Token from Flinks. This Access Token will be sent to Dwolla.
 * @returns - Flinks AccessToken
 */
async function getAccessToken(loginId: string, accountId: string): Promise<FlinksAccessTokenAPIResponse> {
    const body: FlinksAccessTokenAPIBody = { loginId, accountId };
    const response = await fetch(`/api/flinks/access-token`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) return {};
    return response.json();
}

/**
 * When the page loads, fetch Flinks' Connect URL for the User and pass it as a page prop.
 */
export const getServerSideProps: GetServerSideProps = async (): Promise<GetServerSidePropsResult<Props>> => {
    const { url: widgetUrl, isDemo } = buildConnectWidget();

    return {
        props: {
            widgetUrl,
            isDemo
        }
    };
};

export default ConnectFlinksPage;
