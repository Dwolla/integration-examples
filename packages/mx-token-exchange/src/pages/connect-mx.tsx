import { Box } from "@mui/material";
import { ConnectWidget } from "@mxenabled/web-widget-sdk";
import type { ConnectMemberConnectedPayload } from "@mxenabled/widget-post-message-definitions";
import type { AccountNumberResponse } from "mx-platform-node";
import type { GetServerSideProps, GetServerSidePropsResult, NextPage } from "next";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { stringify as stringifyQueryString } from "querystring";
import { useWidgetRef } from "../hooks/useWidgetRef";
import type { GenerateWidgetOptions } from "../integrations/mx";
import { generateWidgetUrl } from "../integrations/mx";
import MainLayout from "../layouts/MainLayout";
import type { MXAccountsAPIQuery, MXAccountsAPIResponse } from "./api/mx/accounts";
import type { MXProcessorTokenAPIBody, MXProcessorTokenAPIResponse } from "./api/mx/processor_token";

interface Props {
    widgetUrl?: string;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
    mxUserGuid: string;
}

export const ConnectMxPage: NextPage<Props> = ({ widgetUrl }) => {
    const router = useRouter();
    const { dwollaCustomerId } = router.query as Query;
    const { element: widgetElement, ref: widgetRef } = useWidgetRef<HTMLDivElement>();

    /**
     * Handles completing the token flow by grabbing a verified account and generating a payment
     * processor authorization token once an FI (bank) has been added.
     *
     * NOTE: This function fetches an account and only cares about the first index in the array.
     * This should NOT be used in a production environment. Instead, the user should be given the option
     * to choose which FI account they'd like to associate with their Dwolla exchange resource.
     */
    async function handleMemberConnected(payload?: ConnectMemberConnectedPayload) {
        if (!payload) return alert("Function handleMemberConnected called without payload. Refresh and try again.");

        const accounts = await fetchVerifiedAccounts({ memberGuid: payload.member_guid, userGuid: payload.user_guid });
        if (!accounts || accounts.length === 0) return alert("No accounts returned from fetchVerifiedAccounts().");

        const firstAccount = accounts[0];
        if (!firstAccount.account_guid || !firstAccount.member_guid || !firstAccount.user_guid)
            return alert("A required GUID (account, member, or user) was not returned from MX.");

        const processorToken = await fetchProcessorToken({
            accountGuid: firstAccount.account_guid,
            memberGuid: firstAccount.member_guid,
            userGuid: firstAccount.user_guid
        });
        if (!processorToken) return alert("No payment processor token returned from fetchProcessorToken().");

        await router.push({
            pathname: "/connect-exchange",
            query: { dwollaCustomerId, processorToken }
        });
    }

    /**
     * Calls our Next API to request a payment processor token from MX
     */
    async function fetchProcessorToken(body: MXProcessorTokenAPIBody): Promise<string | undefined> {
        const response = await fetch("/api/mx/processor_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) return undefined;
        return ((await response.json()) as MXProcessorTokenAPIResponse).token?.code;
    }

    /**
     * Calls our Next API to fetch all verified accounts from MX.
     */
    async function fetchVerifiedAccounts(query: MXAccountsAPIQuery): Promise<AccountNumberResponse[] | undefined> {
        const response = await fetch(`/api/mx/accounts?${stringifyQueryString({ ...query })}`);
        if (!response.ok) return undefined;
        return ((await response.json()) as MXAccountsAPIResponse).accounts;
    }

    if (widgetElement && widgetUrl) {
        new ConnectWidget({
            container: widgetElement,
            url: widgetUrl,
            onMemberConnected: handleMemberConnected
        });
    }

    return (
        <MainLayout title="Step 2: Connect Bank with MX">
            <Box ref={widgetRef}></Box>
        </MainLayout>
    );
};

/**
 * When the page loads, fetch MX's Connect URL for the User and pass it as a page prop.
 */
export const getServerSideProps: GetServerSideProps = async (context): Promise<GetServerSidePropsResult<Props>> => {
    const { mxUserGuid: userGuid } = context.query as Query;
    const widgetUrl = await generateWidgetUrl({ userGuid } as GenerateWidgetOptions);

    return {
        props: {
            widgetUrl: widgetUrl ?? undefined // Map null and undefined to undefined
        }
    };
};

export default ConnectMxPage;
