import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { CreateUnverifiedCustomerOptions } from "../integrations/dwolla";
import type { CreateCustomerOptions } from "../integrations/finicity";
import { getMissingKeys, uuidFromUrl } from "../utils";

type FormState = Partial<CreateUnverifiedCustomerOptions>;

const CreateCustomerPage: NextPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<FormState>({});

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
        if (!isFormValid()) return alert("Please fill out all of the required form fields.");

        const dwollaCustomerId = await createDwollaCustomer();
        if (!dwollaCustomerId) return alert("No customer ID was returned from createDwollaCustomer().");

        const finicityCustomerId = await createFinicityCustomer();
        if (!finicityCustomerId) return alert("No customer ID was returned from createFinicityCustomer().");

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

    /**
     * Gets if all the required form fields have been entered.
     */
    function isFormValid(): boolean {
        return getMissingKeys(formData, ["firstName", "lastName", "email"]).length === 0;
    }

    return (
        <>
            <Head>
                <title>Step 1: Create a Customer</title>
            </Head>

            <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                    <label htmlFor="first-name">First Name</label>
                    <input
                        type="text"
                        id="first-name"
                        name="firstName"
                        onChange={handleInputChanged}
                        placeholder="First Name"
                        value={formData?.firstName || ""}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="last-name">Last Name</label>
                    <input
                        type="text"
                        id="last-name"
                        name="lastName"
                        onChange={handleInputChanged}
                        placeholder="Last Name"
                        value={formData?.lastName || ""}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        onChange={handleInputChanged}
                        placeholder="Email Address"
                        value={formData?.email || ""}
                    />
                </div>

                <div className="form-group">
                    <button type="submit">Create Customer</button>
                </div>
            </form>
        </>
    );
};

export default CreateCustomerPage;
