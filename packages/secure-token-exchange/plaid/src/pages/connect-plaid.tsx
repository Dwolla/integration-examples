import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import MainLayout from "../layouts/MainLayout";
import type { PlaidLinkOnSuccess } from "react-plaid-link";
import { usePlaidLink } from "react-plaid-link";
import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardContent, LinearProgress, Typography } from "@mui/material";

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
}

export const ConnectPlaidPage: NextPage = () => {
    const router = useRouter();
    const { dwollaCustomerId } = router.query as Query;
    const [showProgress, setShowProgress] = useState<boolean>(false);

    /**
     * The link token that is returned from Plaid used when instantiating Instant Account Verification
     */
    const [linkToken, setLinkToken] = useState<string | null>(null);

    /**
     * Create a Plaid Link token and persist it in our component state
     */
    const createLinkToken = useCallback(async () => {
        const response = await fetch("/api/plaid/create-link-token", { method: "POST" });
        const data = await response.json();
        setLinkToken(data.link_token);
        console.log(`Created Link Token: ${data.link_token}`);
    }, [setLinkToken]);

    /**
     * Exchange Plaid's Link Token for a Process Token when Link finishes successfully
     */
    const handlePlaidLinkSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
        setShowProgress(true);

        /**
         * Calls our Next API to request a payment processor token from Plaid
         */
        const processorTokenResponse = await fetch("/api/plaid/exchange-public-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: metadata.accounts[0].id,
                publicToken
            })
        });

        const { processorToken } = await processorTokenResponse.json();

        if (!processorToken) {
            alert("No payment processor token returned.");
            return;
        }

        await router.push({
            pathname: "/connect-exchange",
            query: { dwollaCustomerId, processorToken }
        });
    };

    const { open: openPlaidLink, ready: isPlaidLinkReady } = usePlaidLink({
        onSuccess: handlePlaidLinkSuccess,
        token: linkToken
    });

    /**
     * Create a Link Token if one does not already exist
     */
    useEffect(() => {
        if (createLinkToken && !linkToken) {
            createLinkToken().catch((err) => console.error(err));
        }
    }, [createLinkToken, linkToken]);

    /**
     * Open Plaid Link when page mounts
     */
    useEffect(() => {
        // Check if PlaidLink is ready before opening it
        if (isPlaidLinkReady && openPlaidLink) {
            openPlaidLink();
        }
    }, [isPlaidLinkReady, openPlaidLink]);

    return (
        <MainLayout title="Step 2: Connect Bank with Plaid">
            {showProgress && (
                <Card sx={{ padding: 3 }}>
                    <CardHeader title="Connecting..." />
                    <CardContent>
                        <LinearProgress />
                        <Typography component="p" sx={{ mt: 1 }} variant="body1">
                            Generating a Plaid Processor token.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </MainLayout>
    );
};

export default ConnectPlaidPage;
