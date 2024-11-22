"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import type { PlaidLinkError, PlaidLinkOnExitMetadata, PlaidLinkOnSuccess } from "react-plaid-link";
import { Box, Card, CardHeader, CardContent, LinearProgress, Typography, Alert } from "@mui/material";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";

/**
 * Plaid Link Page Component
 *
 * This component handles the Plaid Link integration, enabling users to connect their financial institutions.
 * It initializes Plaid Link, manages its lifecycle, and handles the success and exit scenarios.
 *
 * Key features:
 * - Retrieves the Plaid Link token from URL query parameters.
 * - Manages the lifecycle of the Plaid Link modal to prevent multiple initializations or invalid operations.
 * - Redirects to the create exchange page upon a successful connection.
 */
export default function Page() {
    const router = useRouter();

    /**
     * Our current network alert. Used to indicate to the user if we're loading/awaiting a resource.
     */
    const { alert, updateNetworkAlert } = useNetworkAlert();

    /**
     * The link token that we will use when creating the Exchange.
     * This token is retrieved from the URL query parameters.
     */
    const searchParams = useSearchParams();
    const linkToken = searchParams.get("linkToken");

    /**
     * Tracks the loading state and shows a progress bar during API interactions
     */
    const [showProgress, setShowProgress] = useState<boolean>(false);

    /**
     * Tracks whether the Plaid Link modal is open to prevent duplicate calls
     */
    const [isLinkOpen, setIsLinkOpen] = useState(false);

    /**
     * Success callback for Plaid Link.
     * Triggered when a user successfully completes the Plaid Link flow.
     *
     * @param {string} publicToken - The token returned by Plaid after successful authentication.
     */
    const onPlaidSuccess: PlaidLinkOnSuccess = async (publicToken) => {
        setShowProgress(true); // Display progress bar
        if (isLinkOpen) {
            exit(); // Close the Plaid Link modal
            setIsLinkOpen(false); // Reset the modal state
        }
        // Redirect to the next step with the Plaid Public token in the URL
        router.push(`/create-exchange?plaidPublicToken=${encodeURIComponent(publicToken)}`);
    };

    /**
     * Exit callback for Plaid Link.
     * Triggered when the user exits the Plaid Link flow without completing it or encounters an error.
     *
     * @param {PlaidLinkError | null} error - The error returned by Plaid if any.
     * @param {PlaidLinkOnExitMetadata} metadata - Metadata associated with the exit event.
     */
    const onPlaidExit = async (error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => {
        if (isLinkOpen) {
            exit(); // Close the Plaid Link modal
            setIsLinkOpen(false); // Reset the modal state
        }

        if (error) {
            // Handle errors returned by Plaid
            console.error("Link exited with error:", error);
            return updateNetworkAlert({
                alert: { severity: "error", message: "Plaid Link returned an error" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        // Handle user exit without error
        console.log("Link exited without error:", metadata);
        return updateNetworkAlert({
            alert: { severity: "error", message: "User exited Plaid Link flow before completion" },
            networkState: NetworkState.NOT_LOADING
        });
    };

    /**
     * Initialize Plaid Link using the provided configuration
     */
    const {
        open: openPlaidLink,
        exit,
        ready: isPlaidLinkReady
    } = usePlaidLink({
        token: linkToken,
        onSuccess: onPlaidSuccess,
        onExit: onPlaidExit
    });

    /**
     * Automatically open the Plaid Link modal when it's ready.
     * Prevents duplicate calls by checking the `isLinkOpen` state.
     */
    useEffect(() => {
        // Only trigger once, if not already open
        if (isPlaidLinkReady && !isLinkOpen) {
            setIsLinkOpen(true); // Mark the modal as open
            openPlaidLink(); // Open the Plaid Link modal
        }
    }, [isPlaidLinkReady, openPlaidLink, isLinkOpen]);

    /**
     * Cleanup on component unmount.
     * Resets the modal state to prevent issues if the component is re-rendered.
     */
    useEffect(() => {
        return () => {
            if (isLinkOpen) {
                exit(); // Ensure Plaid Link instance is closed
                setIsLinkOpen(false);
            }
        };
    }, [exit, isLinkOpen]);

    return (
        <Box>
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}
            {showProgress && (
                <Card sx={{ padding: 3 }}>
                    <CardHeader title="Connecting..." />
                    <CardContent>
                        <LinearProgress />
                        <Typography component="p" sx={{ mt: 1 }} variant="body1">
                            Grabbing the Plaid Public token.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
