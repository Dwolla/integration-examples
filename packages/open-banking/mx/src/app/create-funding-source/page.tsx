"use client";

import { useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import type { SelectChangeEvent } from "@mui/material";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField
} from "@mui/material";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";
import { getMissingKeys, uuidFromUrl } from "../../utils";
import type { CreateFundingSourceOptions } from "../integrations/dwolla";
import { createFundingSource } from "../integrations/dwolla";

type FormState = Partial<CreateFundingSourceOptions>;

export default function CreateFundingSourcePage() {
    /**
     * Our current network alert. Used to indicate to the user if we're loading/awaiting a resource.
     */
    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();

    /**
     * Current state of our form. In other words, what key(s) are associated with what value(s), if any.
     */
    const [formData, setFormData] = useState<FormState>({ type: "checking" });

    /**
     * Array of missing form keys, if the user submits the form. This is used to show an error.
     */
    const [missingRequiredKeys, setMissingRequiredKeys] = useState<Array<keyof FormState>>();

    /**
     * Get the exchangeId from the URL query parameters.
     */
    const searchParams = useSearchParams();
    const exchangeId = searchParams.get("exchange");

    /**
     * Retrieve the customerId from session storage.
     */
    const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;

    /**
     * Effect to check for exchangeId in the URL query parameters.
     */
    useEffect(() => {
        if (!exchangeId) {
            updateNetworkAlert({
                alert: { severity: "error", message: "Missing exchangeId in the URL query parameters" },
                networkState: NetworkState.NOT_LOADING
            });
        }
    }, [exchangeId, updateNetworkAlert]);

    /**
     * Mutates the form state if the input value changes.
     */
    const handleInputChanged = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
    ): void => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    /**
     * Checks if the form is valid by ensuring that all required fields have a value present in them.
     * @returns true if the form is valid (i.e. does not have any missing keys), otherwise false
     */
    const checkFormValidity = (): boolean => {
        const missingKeys = getMissingKeys(formData, ["name", "type"]);
        setMissingRequiredKeys(missingKeys);
        return missingKeys.length === 0;
    };

    /**
     * Handles the creation of the funding source by making an API call.
     * @param formData - The data to be sent to the API.
     * @param storedCustomerId - The ID of the Customer.
     * @param exchangeId - The ID of the exchange session.
     * @returns The URL of the created funding source, if successful.
     */
    const createFundingSourceHandler = async (
        formData: FormState,
        storedCustomerId: string,
        exchangeId: string
    ): Promise<string | undefined> => {
        const options: CreateFundingSourceOptions = {
            ...formData,
            customerId: storedCustomerId,
            exchangeId: exchangeId
        } as CreateFundingSourceOptions;

        const response = await createFundingSource(options);
        return response.resourceHref ? uuidFromUrl(response.resourceHref) : undefined;
    };

    /**
     * Handles the form submission, validates the form, sets the network state,
     * and calls the API to create the funding source.
     * @param event - The form submission event.
     */
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        if (!exchangeId || !storedCustomerId) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "Missing required exchangeId or customerId" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        const fundingSourceUrl = await createFundingSourceHandler(formData, storedCustomerId, exchangeId);

        if (!fundingSourceUrl) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "No Funding Source URL returned from createFundingSource()." },
                networkState: NetworkState.NOT_LOADING
            });
        }

        updateNetworkAlert({
            alert: { severity: "success", message: `Funding Source Location: ${fundingSourceUrl}.` },
            networkState: NetworkState.NOT_LOADING
        });
    };

    return (
        <div>
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}
            <Card sx={{ padding: 3 }}>
                <CardHeader title="Create Funding Source" />
                <CardContent>
                    <Box component="form" autoComplete="off" noValidate onSubmit={handleFormSubmit} sx={{ mt: 1 }}>
                        <TextField
                            type="text"
                            error={missingRequiredKeys?.includes("name")}
                            fullWidth
                            helperText={missingRequiredKeys?.includes("name") && "Name is required"}
                            label="Name"
                            name="name"
                            onChange={handleInputChanged}
                            required
                            value={formData?.name || ""}
                        />

                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                label="Type"
                                name="type"
                                onChange={handleInputChanged}
                                value={formData?.type || "checking"}
                            >
                                <MenuItem selected value="checking">
                                    Checking
                                </MenuItem>
                                <MenuItem value="savings">Savings</MenuItem>
                            </Select>
                        </FormControl>

                        <LoadingButton
                            type="submit"
                            fullWidth
                            loading={networkState === NetworkState.LOADING}
                            size="large"
                            sx={{ mt: 2 }}
                            variant="contained"
                        >
                            Submit
                        </LoadingButton>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}
