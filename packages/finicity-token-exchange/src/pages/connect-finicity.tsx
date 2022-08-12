import { GetServerSideProps, GetServerSidePropsResult, NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { FetchPartnerConsentOptions, generateConnectUrl, GenerateConnectUrlOptions } from "../integrations/finicity";
import { useFinicityConnect } from "../hooks/useFinicityConnect";
import { CustomerAccount } from "@finicity/node-sdk";
import { ParsedUrlQuery } from "querystring";

interface Props {
    connectUrl: string;
}

interface Query extends ParsedUrlQuery {
    dwollaCustomerId: string;
    finicityCustomerId: string;
}

export const ConnectFinicityPage: NextPage<Props> = ({ connectUrl }) => {
    const router = useRouter();
    const { dwollaCustomerId, finicityCustomerId } = router.query as Query;

    const { launch: launchConnect, ready: isConnectReady } = useFinicityConnect({
        onCancel(): void {
            alert("User exited Connect. Please reload page to try again.");
        },
        onError(): void {
            alert("Received an error from Connect. Please reload page to try again.");
        },
        /**
         * NOTE: This function fetches a customer account and only sends partner consent for the first item.
         * This should NOT be used in a production environment. Instead, the user should be given the option
         * to choose which FI account they'd like to associate with their Dwolla exchange resource.
         */
        async onSuccess(): Promise<void> {
            const accounts = await fetchCustomerAccounts();
            if (!accounts) return alert("No accounts were returned from fetchCustomerAccounts().");

            const rawReceipt = await fetchPartnerConsent(accounts[0]);
            if (!rawReceipt) return alert("No partner receipt was returned from fetchPartnerConsent().");

            const encodedReceipt = encodeURIComponent(
                Buffer.from(JSON.stringify(rawReceipt), "ascii").toString("base64")
            );

            await router.push({
                pathname: "/connect-exchange",
                query: { dwollaCustomerId, encodedReceipt }
            });
        },
        overlay: "rgba(200, 200, 200, 0.5)"
    });

    /**
     * Calls our API to fetch the connected FI accounts for the customer.
     * @returns - An array of connected FI accounts. Only the first is used.
     */
    async function fetchCustomerAccounts(): Promise<CustomerAccount[] | null> {
        const response = await fetch(`/api/finicity/accounts/${finicityCustomerId}`);
        if (!response.ok) return null;
        return response.json();
    }

    /**
     * Calls our API to fetch partner consent for the customer.
     * @returns - The receipt that is then sent to Dwolla when creating an exchange
     */
    async function fetchPartnerConsent(account: CustomerAccount): Promise<any> {
        const response = await fetch("/api/finicity/consent", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: account.id,
                customerId: finicityCustomerId
            } as FetchPartnerConsentOptions)
        });

        if (!response.ok) return null;
        return await response.json();
    }

    // Once Connect is ready, launch the widget
    if (isConnectReady) launchConnect({ url: connectUrl });

    return (
        <>
            <Head>
                <title>Step 2: Connect Bank Account (with Finicity)</title>
            </Head>
        </>
    );
};

/**
 * When the page loads, fetch the Connect URL for the customer and pass it as a prop.
 */
export const getServerSideProps: GetServerSideProps = async (context): Promise<GetServerSidePropsResult<Props>> => {
    const { finicityCustomerId } = context.query;
    const connectUrl = await generateConnectUrl({ customerId: finicityCustomerId } as GenerateConnectUrlOptions);

    return {
        props: {
            connectUrl
        }
    };
};

export default ConnectFinicityPage;
