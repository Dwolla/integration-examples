import { Alert, LoadingButton } from "@mui/lab";
import { Box, Card, CardContent, CardHeader, Grid, TextField } from "@mui/material";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { NetworkState, useNetworkAlert } from "../hooks/useNetworkAlert";
import type { CreateUnverifiedCustomerOptions } from "../integrations/dwolla";
import type { CreateCustomerOptions } from "../integrations/finicity";
import MainLayout from "../layouts/MainLayout";
import { getMissingKeys, uuidFromUrl } from "../utils";

/**
 * Defines an array of all element(s)/key(s) that the form will have.
 */
type FormState = Partial<CreateUnverifiedCustomerOptions>;

const CreateCustomerPage: NextPage = () => {
    const router = useRouter();

    /**
     * Our current network alert. Used to indicate to the user if we're loading/awaiting a resource.
     */
    const { alert, networkState, updateNetworkAlert } = useNetworkAlert();

    /**
     * Current state of our form—i.e. what key(s) are associated which what value(s).
     */
    const [formData, setFormData] = useState<FormState>({});

    /**
     * Array of missing form keys if the user submits the form. This is used to show an error.
     */
    const [missingRequiredKeys, setMissingRequiredKeys] = useState<(keyof FormState)[]>();

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
     * Calls our API to create an unverified customer record with Dwolla.
     */
    async function createDwollaCustomer(): Promise<string | null> {
        const response = await fetch("/api/dwolla/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ...formData })
        });

        if (!response.ok) return null;
        const resourceLocation = (await response.json()).location;
        if (!resourceLocation) return null;
        return uuidFromUrl(resourceLocation);
    }

    /**
     * Calls our API to create a customer record with Finicity.
     */
    async function createFinicityCustomer(): Promise<string | null> {
        const response = await fetch("/api/finicity/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: formData.email } as CreateCustomerOptions)
        });

        if (!response.ok) return null;
        const customerId = (await response.json()).id;
        if (!customerId) return null;
        return customerId;
    }

    /**
     * Creates a Dwolla and Finicity customer when the form submits.
     */
    async function handleFormSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (!checkFormValidity()) return;
        updateNetworkAlert(null, NetworkState.LOADING);

        const dwollaCustomerId = await createDwollaCustomer();

        if (!dwollaCustomerId) {
            return updateNetworkAlert(
                { severity: "error", message: "No customer ID was returned from createDwollaCustomer()" },
                NetworkState.NOT_LOADING
            );
        }

        const finicityCustomerId = await createFinicityCustomer();

        if (!finicityCustomerId) {
            return updateNetworkAlert(
                { severity: "error", message: "No customer ID was returned from createFinicityCustomer()" },
                NetworkState.NOT_LOADING
            );
        }

        await router.push({
            pathname: "/connect-finicity",
            query: { dwollaCustomerId, finicityCustomerId }
        });
    }

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({ target }: ChangeEvent<HTMLInputElement>): void {
        setFormData({ ...formData, [target.name]: target.value });
    }

    return (
        <MainLayout title="Step 1: Create a Customer">
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Card sx={{ padding: 3 }}>
                <CardHeader title="Create a Customer" />
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
                                    value={formData?.firstName || ""}
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
                                    value={formData?.lastName || ""}
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
                            value={formData?.email || ""}
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

export default CreateCustomerPage;
