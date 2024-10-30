"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { LoadingButton } from "@mui/lab";
import { Alert, Box, Card, CardContent, CardHeader, FormControlLabel, Grid, Radio, RadioGroup } from "@mui/material";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";
import { uuidFromUrl } from "../../utils";
import { createExchange, getAvailableExchangeConnections } from "../integrations/dwolla";
import type { AvailableExchangeConnection } from "../integrations/dwolla";

/**
 * Account Selection Page Component
 * This component allows users to select a bank account from available exchange connections.
 * It fetches available accounts, handles user selection, and initiates the exchange creation process.
 */
export default function Page() {
    const router = useRouter();
    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();
    const [availableAccounts, setAvailableAccounts] = useState<AvailableExchangeConnection[]>([]);
    const [selectedBank, setSelectedBank] = useState<string>("");
    const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;

    // Fetch available exchange connections when the component mounts
    useEffect(() => {
        async function fetchAvailableAccounts() {
            if (storedCustomerId) {
                try {
                    const connections = await getAvailableExchangeConnections(storedCustomerId);
                    setAvailableAccounts(connections);
                } catch (error) {
                    console.error("Error fetching available exchange connections:", error);
                    updateNetworkAlert({
                        alert: {
                            severity: "error",
                            message: "Failed to fetch available accounts"
                        },
                        networkState: NetworkState.NOT_LOADING
                    });
                }
            }
        }

        fetchAvailableAccounts();
    }, [storedCustomerId]);

    // Check if a bank has been selected
    const checkFormValidity = () => selectedBank !== "";

    /**
     * Create an exchange with the selected bank account
     * @param customerId - The ID of the customer
     * @param availableConnectionToken - The token for the selected bank connection
     * @returns The UUID of the created exchange, or undefined if creation fails
     */
    async function createExchangeHandler(customerId: string, availableConnectionToken: string) {
        const response = await createExchange(customerId, availableConnectionToken);
        return response.resourceHref ? uuidFromUrl(response.resourceHref) : undefined;
    }

    // This function is called when the user submits the form to create an exchange
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!checkFormValidity()) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "Please select an account." },
                networkState: NetworkState.NOT_LOADING
            });
        }

        updateNetworkAlert({ networkState: NetworkState.LOADING });

        const selectedAccount = availableAccounts.find((account) => account.name === selectedBank);
        if (!selectedAccount || !storedCustomerId) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "Invalid account selection or customer ID" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        const exchangeId = await createExchangeHandler(storedCustomerId, selectedAccount.availableConnectionToken);

        if (!exchangeId) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "Failed to create Exchange" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        // Navigate to the create funding source page with the new exchange ID
        router.push(`/create-funding-source?exchange=${encodeURIComponent(exchangeId)}`);
    };

    // Render the account selection form
    return (
        <div>
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}
            <Card sx={{ padding: 3 }}>
                <CardHeader title="Select Your Bank Account" />
                <CardContent>
                    <Box component="form" autoComplete="off" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <Grid container>
                            <RadioGroup value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                                {availableAccounts.map((bank) => (
                                    <FormControlLabel
                                        key={bank.availableConnectionToken}
                                        value={bank.name}
                                        control={<Radio />}
                                        label={bank.name}
                                    />
                                ))}
                            </RadioGroup>
                        </Grid>
                        <LoadingButton
                            type="submit"
                            fullWidth
                            loading={networkState === NetworkState.LOADING}
                            size="large"
                            sx={{ mt: 2 }}
                            variant="contained"
                        >
                            Continue
                        </LoadingButton>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}
