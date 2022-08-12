import { GetServerSideProps, GetServerSidePropsResult, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { CreateExchangeOptions, CreateFundingSourceOptions, getExchangeId } from "../integrations/dwolla";
import { ChangeEvent, FormEvent, useState } from "react";
import { getMissingKeys } from "../utils";

interface Props {
    exchangeId: string;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
    encodedReceipt: string;
}

type FormData = Partial<CreateFundingSourceOptions>;

export const ConnectExchangePage: NextPage<Props> = ({ exchangeId }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({ type: "checking" });

    const { dwollaCustomerId, encodedReceipt } = router.query as Query;
    const decodedReceipt = JSON.parse(Buffer.from(decodeURIComponent(encodedReceipt), "base64").toString("ascii"));

    /**
     * Calls our API to create a Dwolla exchange.
     * @returns - The location of the new exchange resource
     */
    async function createExchange(customerId: string): Promise<string | null> {
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
        if (!isFormValid()) return alert("Please fill out all of the required form fields.");

        const exchangeUrl = await createExchange(dwollaCustomerId);
        if (!exchangeUrl) return alert("No exchange URL was returned from createExchange().");

        const fundingSourceUrl = await createFundingSource(exchangeUrl);
        if (!fundingSourceUrl) return alert("No funding source URL was returned from createFundingSource().");

        console.log("Success! Funding Source Location: ", fundingSourceUrl);
    }

    /**
     * Mutates the form state if the input value changes.
     */
    function handleInputChanged({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
        setFormData({ ...formData, [target.name]: target.value });
    }

    /**
     * Gets if all the required form fields have been entered.
     */
    function isFormValid(): boolean {
        return getMissingKeys(formData, ["name", "type"]).length === 0;
    }

    return (
        <>
            <Head>
                <title>Step 3: Create Exchange and Funding Source</title>
            </Head>

            <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        onChange={handleInputChanged}
                        placeholder="Funding Source Name"
                        value={formData?.name || ""}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select id="type" name="type" onChange={handleInputChanged} value={formData?.type || "checking"}>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                    </select>
                </div>

                <div className="form-group">
                    <button type="submit">Create Funding Source</button>
                </div>
            </form>
        </>
    );
};

/**
 * When the page loads, fetch Finicity's exchange ID from Dwolla and pass it as a prop.
 */
export const getServerSideProps: GetServerSideProps = async (context): Promise<GetServerSidePropsResult<Props>> => {
    const exchangeId = await getExchangeId();

    return {
        props: {
            exchangeId
        }
    };
};

export default ConnectExchangePage;
