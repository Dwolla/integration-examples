import { LoadingButton } from "@mui/lab";
import { Alert, Box, Card, CardContent, CardHeader, Grid, TextField } from "@mui/material";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { NetworkState, useNetworkAlert } from "../hooks/useNetworkAlert";
import type { CreateUnverifiedCustomerOptions } from "../integrations/dwolla";
import MainLayout from "../layouts/MainLayout";
import { getMissingKeys, uuidFromUrl } from "../utils";
import type { DwollaCustomersAPIResponse } from "./api/dwolla/customers";

type FormState = Partial<CreateUnverifiedCustomerOptions>;

const CreateCustomersPage: NextPage = () => {
    const router = useRouter();

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
     * Checks if the form is valid by ensuring that all required fields have a value present in them.
     * @returns true if the form is valid (i.e. does not have any missing keys), otherwise false
     */
    function checkFormValidity(): boolean {
        const missingKeys = getMissingKeys(formData, ["firstName", "lastName", "email"]);
        setMissingRequiredKeys(missingKeys);
        return missingKeys.length === 0;
    }

    /**
     * Calls our Next API to create an Unverified Customer Record in Dwolla.
     */
    async function createDwollaCustomer(): Promise<string | undefined> {
        const response = await fetch("/api/dwolla/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ...formData })
        });

        if (!response.ok) return undefined;
        const resourceHref = ((await response.json()) as DwollaCustomersAPIResponse).resourceHref;
        return uuidFromUrl(resourceHref);
    }

    /**
     * Creates a Dwolla Customer when the form submits.
     */
    async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        const dwollaCustomerId = await createDwollaCustomer();

        if (!dwollaCustomerId) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "No Customer ID was returned from createDwollaCustomer()" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        await router.push({
            pathname: "/connect-flinks",
            query: { dwollaCustomerId }
        });
    }

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({ target: { name, value } }: ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [name]: value });
    }

    return (
        <MainLayout title="Step 1: Create Customers">
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Card sx={{ padding: 3 }}>
                <CardHeader title="Create Customers" />
                <CardContent>
                    <Box component="form" autoComplete="off" noValidate onSubmit={handleFormSubmit} sx={{ mt: 1 }}>
                        <Grid container columnSpacing={2}>
                            <Grid item md={6}>
                                <TextField
                                    type="text"
                                    error={missingRequiredKeys?.includes("firstName")}
                                    helperText={missingRequiredKeys?.includes("firstName") && "First name is required"}
                                    label="First Name"
                                    name="firstName"
                                    onChange={handleInputChanged}
                                    required
                                    value={formData.firstName ?? ""}
                                />
                            </Grid>

                            <Grid item md={6}>
                                <TextField
                                    type="text"
                                    error={missingRequiredKeys?.includes("lastName")}
                                    helperText={missingRequiredKeys?.includes("lastName") && "Last name is required"}
                                    label="Last Name"
                                    name="lastName"
                                    onChange={handleInputChanged}
                                    required
                                    value={formData.lastName ?? ""}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            type="email"
                            error={missingRequiredKeys?.includes("email")}
                            fullWidth
                            helperText={missingRequiredKeys?.includes("email") && "Email address is required"}
                            label="Email Address"
                            name="email"
                            onChange={handleInputChanged}
                            required
                            sx={{ mt: 2 }}
                            value={formData.email ?? ""}
                        />

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

export default CreateCustomersPage;
