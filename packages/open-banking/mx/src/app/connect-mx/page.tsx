"use client";
import { useEffect, useState } from "react";
import { ConnectWidget } from "@mxenabled/web-widget-sdk";
import { Box } from "@mui/material";
import { useWidgetRef } from "../../../../../secure-token-exchange/mx/src/hooks/useWidgetRef";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const searchParams = useSearchParams();
    const widgetUrl = searchParams.get("widgetUrl");
    const { element: widgetElement, ref: widgetRef } = useWidgetRef<HTMLDivElement>();

    useEffect(() => {
        if (widgetElement && widgetUrl) {
            const widget = new ConnectWidget({
                url: widgetUrl,
                container: widgetElement,
                onMemberConnected: (payload) => {
                    console.log(`User guid: ${payload.user_guid}`);
                    console.log(`Session guid: ${payload.session_guid}`);
                    console.log(`Member guid: ${payload.member_guid}`);
                    console.log("onMemberConnected:", payload);
                }
                // onAccountCreated: (payload) => {
                //     console.log("payload:", payload);
                // }
            });
        }
    }, [widgetElement, widgetUrl]);

    function handleEvent(event) {
        if (event.data.type === "mx/account/created") {
            console.log("handleEvent:", event.data.metadata);
        }
    }

    window.addEventListener("message", handleEvent);

    return (
        <div>
            <Box
                id="connect-widget"
                style={{ width: "400px", height: "800px", margin: "0 auto" }}
                ref={widgetRef}
            ></Box>
        </div>
    );
}
