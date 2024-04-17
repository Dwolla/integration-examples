"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWidget } from "@mxenabled/web-widget-sdk";
import { Box } from "@mui/material";
import { useWidgetRef } from "../../../../../secure-token-exchange/mx/src/hooks/useWidgetRef";
import { useSearchParams } from "next/navigation";
import type { ConnectMemberConnectedPayload } from "@mxenabled/widget-post-message-definitions";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // const dwollaExternalPartyId = searchParams.get("dwollaExternalPartyId");
    const dwollaExternalPartyId = "some-id";
    const widgetUrl = searchParams.get("widgetUrl");
    const { element: widgetElement, ref: widgetRef } = useWidgetRef<HTMLDivElement>();

    useEffect(() => {
        if (widgetElement && widgetUrl) {
            const widget = new ConnectWidget({
                url: widgetUrl,
                container: widgetElement,
                onMemberConnected: handleMemberConnected
            });
        }
    }, [widgetElement, widgetUrl]);

    /**
     * TODO: Update documentation Handles completing the token flow by grabbing a verified account and generating a payment
     * processor authorization token once an FI (bank) has been added.
     *
     * NOTE: This function fetches an account and only cares about the first index in the array.
     * This should NOT be used in a production environment. Instead, the user should be given the option
     * to choose which FI account they'd like to associate with their Dwolla exchange resource.
     */
    async function handleMemberConnected(payload?: ConnectMemberConnectedPayload) {
        console.log("handleMemberConnected called"); // TODO: remove
        if (!payload) return alert("Function handleMemberConnected called without payload. Refresh and try again.");

        // TODO: Extract memberId and accountId and send them as props or query params to create-exchange-funding-source route

        console.log(`User guid: ${payload.user_guid}`);
        console.log(`Session guid: ${payload.session_guid}`);
        console.log(`Member guid: ${payload.member_guid}`);
        console.log("onMemberConnected:", payload);

        const mxMemberId = payload.member_guid;
        const mxAccountId = "Some account ID"; //TODO: Replace with actual accountId.GUID after hearing back from MX about how to extract this field

        // TODO: Needs documentation <- This is reused, consider adding to /utils
        const createQueryString = (name: string, value: string) => {
            const params = new URLSearchParams();
            params.set(name, value);

            return params.toString();
        };

        // TODO: Needs documentation
        if (dwollaExternalPartyId && mxMemberId && mxAccountId) {
            await router.push(
                "/connect-exchange" +
                    "?" +
                    createQueryString("dwollaExternalPartyId", dwollaExternalPartyId) +
                    createQueryString("mxMemberId", mxMemberId) +
                    createQueryString("mxAccountId", mxAccountId)
            );
        } else {
            alert("Something went wrong. Refresh and try again.");
        }
    }

    return (
        <div>
            <Box
                id="connect-widget"
                // style={{ width: "400px", height: "800px", margin: "0 auto", backgroundColor: "red" }}
                ref={widgetRef}
            ></Box>
        </div>
    );
}
