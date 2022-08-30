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
import type { GetServerSideProps, GetServerSidePropsResult, NextPage } from "next";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { NetworkState, useNetworkAlert } from "../hooks/useNetworkAlert";
import type { CreateExchangeOptions, CreateFundingSourceOptions } from "../integrations/dwolla";
import { getExchangeId } from "../integrations/dwolla";
import MainLayout from "../layouts/MainLayout";
import { getFormValidation } from "../utils";

interface Props {
    exchangeId: string;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
    encodedReceipt: string;
}

type FormState = Partial<CreateFundingSourceOptions>;

export const ConnectExchangePage: NextPage<Props> = ({ exchangeId }) => {
    const router = useRouter();

    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();
    const [formData, setFormData] = useState<FormState>({ type: "checking" });
    const [missingRequiredKeys, setMissingRequiredKeys] = useState<(keyof FormState)[]>();

    const { dwollaCustomerId, encodedReceipt } = router.query as Query;
    const decodedReceipt = JSON.parse(Buffer.from(decodeURIComponent(encodedReceipt), "base64").toString("ascii"));

    /**
     * Checks if the form is valid by ensuring that all required fields have a value present in them.
     * @returns true if the form is valid (i.e. does not have any missing keys), otherwise false
     */
    function checkFormValidity() {
        const { isValid, missingKeys } = getFormValidation(formData, ["name", "type"]);
        if (!isValid) setMissingRequiredKeys(missingKeys);
        return isValid;
    }

    /**
     * Calls our API to create a Dwolla exchange.
     * @returns - The location of the new exchange resource
     */
    async function createExchange(): Promise<string | null> {
        const response = await fetch("/api/dwolla/exchanges", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerId: dwollaCustomerId,
                exchangePartnerId: exchangeId,
                finicityReceipt: decodedReceipt
            } as CreateExchangeOptions)
        });

        if (!response.ok) return null;
        return (await response.json()).location;
    }

    /**
     * Calls our API to create a funding source using the exchange URL
     * @returns - The location of the new funding source resource
     */
    async function createFundingSource(exchangeUrl: string): Promise<string | null> {
        const response = await fetch("/api/dwolla/funding-sources", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerId: dwollaCustomerId,
                exchangeUrl,
                name: formData.name,
                type: formData.type
            } as CreateFundingSourceOptions)
        });

        if (!response.ok) return null;
        return (await response.json()).location;
    }

    /**
     * Creates an exchange and a subsequent funding source when the form submits.
     */
    async function handleFormSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert(null, NetworkState.LOADING);

        const exchangeUrl = await createExchange();

        if (!exchangeUrl) {
            return updateNetworkAlert(
                { severity: "error", message: "No exchange URL was returned from createExchange()" },
                NetworkState.NOT_LOADING
            );
        }

        const fundingSourceUrl = await createFundingSource(exchangeUrl);

        if (!fundingSourceUrl) {
            return updateNetworkAlert(
                { severity: "error", message: "No funding source URL was returned from createFundingSource()" },
                NetworkState.NOT_LOADING
            );
        }
        return updateNetworkAlert(
            { severity: "success", message: `Funding Source Location: ${fundingSourceUrl}` },
            NetworkState.NOT_LOADING
        );
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
        <MainLayout title="Step 3: Create Exchange and Funding Source">
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
        </MainLayout>
    );
};

/**
 * When the page loads, fetch Finicity's exchange ID from Dwolla and pass it as a prop.
 */
export const getServerSideProps: GetServerSideProps = async (): Promise<GetServerSidePropsResult<Props>> => {
    const exchangeId = await getExchangeId();

    return {
        props: {
            exchangeId
        }
    };
};

export default ConnectExchangePage;
