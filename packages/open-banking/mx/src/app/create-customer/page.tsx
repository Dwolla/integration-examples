"use client";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoadingButton } from "@mui/lab";
import { Alert, Box, Card, CardContent, CardHeader, Grid, TextField } from "@mui/material";
import { NetworkState, useNetworkAlert } from "../../hooks/useNetworkAlert";
import { getMissingKeys, uuidFromUrl } from "../../utils";
import type { CreateCustomerOptions } from "../integrations/dwolla";
import { createCustomer, createExchangeSession, getExchangeSession } from "../integrations/dwolla";

type FormState = Partial<CreateCustomerOptions>;

export default function Page() {
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
     * Status of the form submission. Used to disable the submit button while the form is being processed.
     */
    const { pending } = useFormStatus();

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({ target: { name, value } }: ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [name]: value });
    }

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
     * Calls the integration to create a Customer in Dwolla.
     * @param formData The form data containing the customer information.
     * @returns The created customer's ID if successful, otherwise undefined.
     */
    async function createCustomerHandler(formData: FormData): Promise<string | undefined> {
        const response = await createCustomer(formData);
        return response.resourceHref ? uuidFromUrl(response.resourceHref) : undefined;
    }

    /**
     * Calls the integration to create an Exchange Session in Dwolla.
     * @param customerId The ID of the created customer.
     * @returns The created exchange session's ID if successful, otherwise undefined.
     */
    async function createExchangeSessionHandler(customerId: string): Promise<string | undefined> {
        const response = await createExchangeSession(customerId);
        return response.resourceHref ? uuidFromUrl(response.resourceHref) : undefined;
    }

    /**
     * Handles the form submission to create a customer and initiate an exchange session.
     * @param formData The form data submitted by the user.
     */
    const onSubmitAction = async (formData: FormData) => {
        if (!checkFormValidity()) return;
        updateNetworkAlert({ networkState: NetworkState.LOADING });

        const dwollaCustomerId = await createCustomerHandler(formData);

        if (!dwollaCustomerId) {
            return updateNetworkAlert({
                alert: {
                    severity: "error",
                    message: "No Customer ID was returned from createCustomerHandler()"
                },
                networkState: NetworkState.NOT_LOADING
            });
        }

        // Store customerId in session storage for use in /create-funding-source page
        sessionStorage.setItem("customerId", dwollaCustomerId);

        const exchangeSessionId = await createExchangeSessionHandler(dwollaCustomerId);

        if (!exchangeSessionId) {
            return updateNetworkAlert({
                alert: {
                    severity: "error",
                    message: "No Exchange Session ID was returned from createExchangeSessionHandler()"
                },
                networkState: NetworkState.NOT_LOADING
            });
        }

        const exchangeSessionResponse = await getExchangeSession(exchangeSessionId);

        const mxExchangeSessionUrl = exchangeSessionResponse.resourceHref;

        if (!mxExchangeSessionUrl) {
            return updateNetworkAlert({
                alert: { severity: "error", message: "No Exchange session URL was returned from getExchangeSession()" },
                networkState: NetworkState.NOT_LOADING
            });
        }

        // Navigate to /create-funding-source with the MX exchange session URL
        router.push(`/connect-mx?widgetUrl=${encodeURIComponent(mxExchangeSessionUrl)}`);
    };

    return (
        <div>
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}
            <Card sx={{ padding: 3 }}>
                <CardHeader title="Create Customer" />
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
                            value={formData.email ?? "hard coded email"}
                        />

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
