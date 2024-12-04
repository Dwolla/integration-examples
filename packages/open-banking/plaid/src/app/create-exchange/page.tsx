"use client";
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
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";
import type { CreateFundingSourceOptions } from "../../integrations/dwolla";
import { getMissingKeys } from "../../utils";
import { useSearchParams } from "next/navigation";
import { createExchange, createFundingSource } from "../../integrations/dwolla";
import { uuidFromUrl } from "../../utils";

type FormState = Partial<CreateFundingSourceOptions>;

/**
 * Exchange and Funding Source creation Page Component
 * This component handles the creation of an exchange and a funding source.
 * It manages form state, network alerts, and form submission.
 */
export default function Page() {
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
     * The Plaid Public Token that we will use when creating the Exchange.
     * This is pulled from the URL query string.
     */
    const searchParams = useSearchParams();
    const plaidPublicToken = searchParams.get("plaidPublicToken");

    /**
     * The Dwolla Customer ID that we will use when creating the Exchange and Funding source for.
     */
    const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;

    /**
     * Checks if the form is valid by ensuring that all required fields have a value present in them.
     * @returns true if the form is valid (i.e. does not have any missing keys), otherwise false
     */
    function checkFormValidity() {
        const missingKeys = getMissingKeys(formData, ["name", "type"]);
        setMissingRequiredKeys(missingKeys);
        return missingKeys.length === 0;
    }

    /**
     * Calls the integration to create an Exchange.
     * @returns The resource location of the new Exchange
     * @param storedCustomerId
     * @param plaidPublicToken
     */
    async function createExchangeHandler(
        storedCustomerId: string,
        plaidPublicToken: string
    ): Promise<string | undefined> {
        const response = await createExchange(storedCustomerId, plaidPublicToken);
        return response.resource ? uuidFromUrl(response.resource) : undefined;
    }

    /**
     * Calls the integration to create a Funding Source.
     * @param formData - The data to be sent to the API.
     * @param storedCustomerId - The ID of the Customer.
     * @param exchangeId - The ID of the exchange resource.
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
        return response.resource ? uuidFromUrl(response.resource) : undefined;
    };

    /**
     * Creates an Exchange and a subsequent Funding Source when the form submits.
     */
    async function handleFormSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        if (!storedCustomerId || !plaidPublicToken) {
            console.log(storedCustomerId, plaidPublicToken);
            return updateNetworkAlert({
                alert: { severity: "error", message: "Missing required plaidPublicToken or customerId" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        const exchangeId = await createExchangeHandler(storedCustomerId, plaidPublicToken);

        if (!exchangeId) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "No Exchange ID returned from createExchange()." },
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
        return updateNetworkAlert({
            alert: { severity: "success", message: `Funding Source Location: ${fundingSourceUrl}.` },
            networkState: NetworkState.NOT_LOADING
        });
    }

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({
        target
    }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void {
        setFormData({ ...formData, [target.name]: target.value });
    }

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
