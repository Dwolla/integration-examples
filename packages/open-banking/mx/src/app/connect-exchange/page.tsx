"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoadingButton } from "@mui/lab";
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
import type { SelectChangeEvent } from "@mui/material";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";
import { getMissingKeys, uuidFromUrl } from "../../utils";
import type { CreateFundingSourceOptions } from "../integrations/dwolla";
import { createExchange } from "../integrations/dwolla";

type FormState = Partial<CreateFundingSourceOptions>;

export default function Page() {
    const searchParams = useSearchParams();
    const dwollaExternalPartyId = searchParams.get("dwollaExternalPartyId");
    const mxMemberId = searchParams.get("mxMemberId");
    const mxAccountId = searchParams.get("mxAccountId");

    /**
     * Our current network alert. Used to indicate to the user if we're loading/awaiting a resource.
     */
    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();

    /**
     * Current state of our form. In other words, what key(s) are associated with what value(s), if any.
     */
    const [formData, setFormData] = useState<FormState>({});

    /**
     * Array of missing form keys, if the user submits the form. This is used to show an error.
     */
    const [missingRequiredKeys, setMissingRequiredKeys] = useState<Array<keyof FormState>>();

    /**
     * TODO: Need documentation
     */
    const { pending } = useFormStatus();

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({
        target
    }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void {
        setFormData({ ...formData, [target.name]: target.value });
    }

    /**
     * Checks if the form is valid by ensuring that all required fields have a value present in them.
     * @returns true if the form is valid (i.e. does not have any missing keys), otherwise false
     */
    function checkFormValidity() {
        const missingKeys = getMissingKeys(formData, ["name", "type"]);
        setMissingRequiredKeys(missingKeys);
        return missingKeys.length === 0;
    }

    async function createDwollaExchange(): Promise<string | undefined> {
        if (!dwollaExternalPartyId || !mxMemberId || !mxAccountId) return undefined;
        const response = await createExchange(dwollaExternalPartyId, mxMemberId, mxAccountId);
        return response.resourceHref ? uuidFromUrl(response.resourceHref) : undefined;
    }

    /**
     * Calls our API to create a Funding Source using an Exchange URL
     * @returns - The resource location of the new Funding Source
     */
    async function createDwollaFundingSource(exchangeUrl: string): Promise<string | undefined> {
        console.log("entered FS creation function");
        return "url-of-newly-create-funding-source";
    }

    /**
     * TODO: Need documentation
     */
    const onSubmitAction = async (formData: FormData) => {
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        // TODO: 1. Call Server Action to create Exchange

        const exchangeUrl = await createDwollaExchange();

        if (!exchangeUrl) {
            return updateNetworkAlert({
                alert: {
                    severity: "error",
                    message: "No Exchange ID was returned from createDwollaExchange()"
                },
                networkState: NetworkState.NOT_LOADING
            });
        }

        // TODO: 2. Call Server Action to create Funding Source

        const fundingSourceUrl = await createDwollaFundingSource(exchangeUrl);

        if (!fundingSourceUrl) {
            return updateNetworkAlert({
                alert: {
                    severity: "error",
                    message: "No Funding Source ID was returned from createDwollaFundingSource()"
                },
                networkState: NetworkState.NOT_LOADING
            });
        }

        return updateNetworkAlert({
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
                <CardHeader title="Create an Exchange and Funding Source" />
                <CardContent>
                    <Box
                        component="form"
                        autoComplete="off"
                        noValidate
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();

                            const formData = new FormData(event.currentTarget);
                            onSubmitAction(formData);
                        }}
                        sx={{ mt: 1 }}
                    >
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
                            disabled={pending}
                        >
                            Submit
                        </LoadingButton>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}
