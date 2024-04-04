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
import type { CreateFundingSourceOptions } from "../integrations/dwolla";
import { getExchangePartnerHref } from "../integrations/dwolla";
import MainLayout from "../layouts/MainLayout";
import { getMissingKeys } from "../utils";
import type { DwollaExchangesAPIBody, DwollaExchangesAPIResponse } from "./api/dwolla/exchanges";
import type { DwollaFundingSourceAPIBody, DwollaFundingSourcesAPIResponse } from "./api/dwolla/funding-sources";

interface Props {
    exchangePartnerHref: string;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
    processorToken: string;
}

type FormState = Partial<CreateFundingSourceOptions>;

export const ConnectExchangePage: NextPage<Props> = ({ exchangePartnerHref }) => {
    const router = useRouter();

    /**
     * Our current network alert. Used to indicate to the user if we're loading/awaiting a resource.
     */
    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();

    /**
     * The Dwolla Customer ID and token that we will use when creating the Exchange.
     */
    const { dwollaCustomerId, authSecret, accessToken } = router.query as Query;

    /**
     * Current state of our form. In other words, what key(s) are associated with what value(s), if any.
     */
    const [formData, setFormData] = useState<FormState>({ type: "checking" });

    /**
     * Array of missing form keys, if the user submits the form. This is used to show an error.
     */
    const [missingRequiredKeys, setMissingRequiredKeys] = useState<Array<keyof FormState>>();

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
     * Calls our API to create a Dwolla Exchange.
     * @returns - The resource location of the new Exchange
     */
    async function createExchange(): Promise<string | undefined> {
        const response = await fetch("/api/dwolla/exchanges", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerId: dwollaCustomerId,
                exchangePartnerHref,
                authSecret,
                accessToken
            } as DwollaExchangesAPIBody)
        });

        if (!response.ok) return undefined;
        return ((await response.json()) as DwollaExchangesAPIResponse).resourceHref;
    }

    /**
     * Calls our API to create a Funding Source using an Exchange URL
     * @returns - The resource location of the new Funding Source
     */
    async function createFundingSource(exchangeUrl: string): Promise<string | undefined> {
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
            } as DwollaFundingSourceAPIBody)
        });

        if (!response.ok) return undefined;
        return ((await response.json()) as DwollaFundingSourcesAPIResponse).resourceHref;
    }

    /**
     * Creates an Exchange and a subsequent Funding Source when the form submits.
     */
    async function handleFormSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        const exchangeUrl = await createExchange();

        if (!exchangeUrl) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "No Exchange URL returned from createExchange()." },
                networkState: NetworkState.NOT_LOADING
            });
        }

        const fundingSourceUrl = await createFundingSource(exchangeUrl);

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
 * When the page loads, fetch Flinks' Exchange Partner ID from Dwolla and pass it as a page prop.
 */
export const getServerSideProps: GetServerSideProps = async (): Promise<GetServerSidePropsResult<Props>> => {
    const exchangePartnerHref = await getExchangePartnerHref();

    return {
        props: {
            exchangePartnerHref
        }
    };
};

export default ConnectExchangePage;
