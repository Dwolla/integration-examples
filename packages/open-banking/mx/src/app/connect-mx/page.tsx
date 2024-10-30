"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectWidget } from "@mxenabled/web-widget-sdk";
import { Box } from "@mui/material";
import { useWidgetRef } from "../../../../../secure-token-exchange/mx/src/hooks/useWidgetRef";

/**
 * ConnectMXPage Component
 *
 * Renders the MX Connect Widget, allowing users to link their financial institutions.
 * This component manages widget setup, event handling, and lifecycle operations.
 *
 * Key features:
 * - Initializes the MX Connect Widget using the provided URL.
 * - Listens for widget events, including connection completion.
 * - Manages the widget lifecycle, ensuring proper unmounting.
 * - Redirects to the account selection page upon a successful connection.
 *
 * The component utilizes the useWidgetRef hook to manage the widget container
 * and useRef to maintain the widget instance across re-renders.
 */

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const widgetUrl = searchParams.get("widgetUrl");
    const { element: widgetElement, ref: widgetRef } = useWidgetRef<HTMLDivElement>();
    const widgetInstance = useRef<ConnectWidget | null>(null);

    useEffect(() => {
        if (widgetElement && widgetUrl) {
            const options = {
                container: widgetElement,
                url: widgetUrl,
                onConnectedPrimaryAction: handleConnectedPrimaryAction
                // Add other event handlers as needed. Refer to this document for a list of MX events and their payloads - https://github.com/mxenabled/web-widget-sdk/blob/master/docs/widget_callback_props.md
            };

            // Mount the widget
            widgetInstance.current = new ConnectWidget(options);
        }

        // Unmount the widget when the component unmounts
        return () => {
            if (widgetInstance.current) {
                widgetInstance.current.unmount();
                widgetInstance.current = null;
            }
        };
    }, [widgetElement, widgetUrl]);

    /**
     * Handles the mx/connect/connected/primaryAction event.
     * This event indicates that the connection process is complete.
     */
    const handleConnectedPrimaryAction = () => {
        if (widgetInstance.current) {
            widgetInstance.current.unmount();
            widgetInstance.current = null;
        }
        router.push("/account-selection");
    };

    return (
        <div>
            <Box id="connect-widget" ref={widgetRef}></Box>
        </div>
    );
}
