import { NextPage } from "next";
import { ChangeEventHandler, useCallback, useEffect } from "react";
import { PlaidLinkOnSuccess, usePlaidLink } from "react-plaid-link";
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap";
import { CreateFundingSourceOptions } from "../app/dwolla";
import useState from "react-usestateref";
import Head from "next/head";

type InputChangedEvent = ChangeEventHandler<HTMLInputElement>;

const Home: NextPage = () => {
    /**
     * An alert message, either `success` or `danger`, that is shown to the user on the web page
     */
    const [alertMessage, setAlertMessage] = useState<{
        message: string;
        variant: "danger" | "info" | "success";
    } | null>(null);

    /**
     * The ID of the customer that the new funding source will be assigned to
     */
    const [customerId, setCustomerId, customerIdRef] = useState<string | null>(null);

    /**
     * The name of the funding source that will be shown to the customer (and returned via Dwolla's API)
     */
    const [fundingSourceName, setFundingSourceName, fundingSourceNameRef] = useState<string | null>(null);

    /**
     * The link token that is returned from Plaid used when instantiating Instant Account Verification
     */
    const [linkToken, setLinkToken] = useState<string | null>(null);

    /**
     * The body text that is returned from the /on-demand-authorizations endpoint
     */
    const [bodyText, setBodyText] = useState<string | null>(null);

    /**
     * The button text that is returned from the /on-demand-authorizations endpoint
     */
    const [buttonText, setButtonText] = useState<string | null>(null);

    /**
     * The ODA link that is returned from the /on-demand-authorizations endpoint
     */
    const [odaLink, setOdaLink, odaLinkRef] = useState<string | null>(null);

    /**
     * Controls checkbox for on demand authorization
     */
    const [checked, setChecked] = useState<boolean>(false);

    /**
     * Create a Plaid Link token and persist it in our component state
     */
    const createLinkToken = useCallback(async () => {
        const response = await fetch("/api/plaid/create-link-token", { method: "POST" });
        const data = await response.json();
        setLinkToken(data.link_token);
        console.log(`Created Link Token: ${data.link_token}`);
    }, [setLinkToken]);

    /**
     * Update our `customerId` state when the associated `<input />` element changes
     */
    const handleCustomerIdChanged: InputChangedEvent = ({ target }) => setCustomerId(target.value);

    /**
     * Update our `fundingSourceName` state when the associated `<input />` element changes
     */
    const handleFundingSourceNameChanged: InputChangedEvent = ({ target }) => setFundingSourceName(target.value);

    /**
     * Exchange Plaid's Link Token for a Process Token when Link finishes successfully
     */
    const handlePlaidLinkSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
        setAlertMessage({
            message: "Exchanging Plaid token. Please wait...",
            variant: "info"
        });

        // Exchange Plaid's Public Token for a Processor Token
        const processorTokenResponse = await fetch("/api/plaid/exchange-public-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: metadata.accounts[0].id,
                publicToken
            })
        });

        const { processorToken } = await processorTokenResponse.json();

        if (processorToken) {
            setAlertMessage({
                message: "Sending Plaid Token to Dwolla. Please wait...",
                variant: "info"
            });

            // Create a Dwolla Funding Source using Plaid's Processor Token
            const fundingSourceResponse = await fetch(`/api/dwolla/create-funding-source`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customerId: customerIdRef.current,
                    fundingSourceName: fundingSourceNameRef.current,
                    plaidToken: processorToken,
                    _links: {
                        "on-demand-authorizations": {
                            href: odaLinkRef.current
                        }
                    }
                } as CreateFundingSourceOptions)
            });

            const { location } = await fundingSourceResponse.json();

            if (location) {
                setAlertMessage({
                    message: `Funding Source Created: ${location}`,
                    variant: "success"
                });
            } else {
                setAlertMessage({
                    message: "An unexpected error occurred when creating the Dwolla funding source",
                    variant: "danger"
                });
            }
        } else {
            setAlertMessage({
                message: "An unexpected error occurred when exchanging the Plaid token",
                variant: "danger"
            });
        }
    };

    const { open: openPlaidLink, ready: isPlaidLinkReady } = usePlaidLink({
        onSuccess: handlePlaidLinkSuccess,
        token: linkToken
    });

    const isReady = customerId && fundingSourceName && checked && odaLink && isPlaidLinkReady;

    /**
     * Create a Link Token if one does not already exist
     */
    useEffect(() => {
        if (createLinkToken && !linkToken) {
            createLinkToken().catch((err) => console.error(err));
        }
    }, [createLinkToken, linkToken]);

    /**
     * Inital request to create ODA when page loads
     */
    useEffect(() => {
        const onDemandAuthRequest = async () => {
            const response = await fetch("/api/dwolla/create-on-demand-auth", { method: "POST" });
            const data = await response.json();
            setBodyText(data.body.bodyText);
            setButtonText(data.body.buttonText);
            setOdaLink(data.body._links.self.href);
        };
        onDemandAuthRequest();
    }, []);

    return (
        <>
            <Head>
                <title>Dwolla-Plaid Integration Example</title>
            </Head>

            <Container className="p-5">
                <Col md={{ offset: 3, span: 6 }}>
                    {alertMessage && <Alert variant={alertMessage.variant}>{alertMessage.message}</Alert>}

                    <Row className="bg-light p-5">
                        <h1 className="header">Dwolla-Plaid Integration Example</h1>
                    </Row>

                    <Row className="border border-light p-4">
                        <Form>
                            <Form.Group as={Row} className="mb-3" controlId="formGroupCustomerId">
                                <Form.Label>Customer ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    onChange={handleCustomerIdChanged}
                                    placeholder="Enter your Dwolla customer ID"
                                />
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3" controlId="formGroupFundingSourceName">
                                <Form.Label>Funding Source Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    onChange={handleFundingSourceNameChanged}
                                    placeholder="Enter your Dwolla funding source name"
                                />
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formGroupOnDemandChecked">
                                <p>{bodyText}</p>
                                <Form.Check
                                    label={buttonText}
                                    checked={checked}
                                    onChange={(e) => setChecked(e.target.checked)}
                                />
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formGroupOpenPlaidLink">
                                <Button type="button" disabled={!isReady} onClick={() => openPlaidLink()}>
                                    Open Plaid Link — Institution Select
                                </Button>
                            </Form.Group>
                        </Form>
                    </Row>
                </Col>
            </Container>
        </>
    );
};

export default Home;
