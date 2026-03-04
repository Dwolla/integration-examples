"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { Box, Card, CardContent, CardHeader, TextField, Alert, Typography, IconButton, Tooltip, Stepper, Step, StepLabel, Chip, Table, TableBody, TableRow, TableCell, Divider, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Grid from "@mui/material/Grid2";
import {
  type ExternalProviderSessionData,
  createCardFundingSource,
  createExchange,
  createExchangeSession,
  getExchangeSession,
  sendPayout
} from "@/integrations/dwolla";

/**
 * Type declaration for Checkout.com Web Components SDK.
 * The SDK is loaded dynamically from a CDN to maintain PCI compliance.
 */
declare global {
  interface Window {
    CheckoutWebComponents?: any;
  }
}

/**
 * Add Card and Send Payout Page
 * 
 * This is the main page of the Push to Card flow where users:
 * 1. Enter payout amount and billing address
 * 2. Submit card details through Checkout.com Flow component
 * 3. Automatically create a Dwolla card funding source
 * 4. Automatically initiate a Push to Card transfer
 * 
 * The page handles the complete end-to-end flow:
 * - Creating a Checkout.com payment session (server-side)
 * - Loading and mounting the Flow component (client-side)
 * - Processing the payment completion callback
 * - Exchanging the payment ID for a card token
 * - Creating the Dwolla card funding source
 * - Initiating the Push to Card transfer
 * 
 * Flow Component Integration:
 * The Checkout.com Flow component is loaded from their CDN for PCI compliance.
 * It handles secure card capture without sensitive data touching our servers.
 * 
 */

/**
 * Wrapper that strips the `last` prop before rendering Box.
 * A parent (e.g. layout or Stepper) may inject `last` for styling; Box forwards unknown props
 * to the DOM, which triggers "Received `true` for a non-boolean attribute `last`" since
 * `last` is not a valid HTML attribute. We strip it here so it never reaches the DOM.
 */
function StripLastBox(props: React.ComponentProps<typeof Box> & { last?: boolean }) {
  const { last: _last, ...rest } = props;
  void _last;
  return <Box {...rest} />;
}

export default function AddCardPage() {
  // Payment session from Dwolla exchange-session (externalProviderSessionData) for Flow
  const [paymentSession, setPaymentSession] = useState<ExternalProviderSessionData | null>(null);
  
  // Current status message to display to the user
  const [status, setStatus] = useState<string | null>(null);

  // Timeline of key events shown in the event log
  const [events, setEvents] = useState<
    Array<{ id: string; message: string; severity: "info" | "success" | "error"; timestamp: string }>
  >([]);

  /**
   * Record a status update and add it to the event log.
   */
  const logEvent = useCallback(
    (message: string, severity: "info" | "success" | "error" = "info") => {
      const timestamp = new Date().toISOString();
      setStatus(message);
      setEvents((prev) => [
        ...prev,
        {
          id: `${timestamp}-${prev.length}`,
          message,
          severity,
          timestamp,
        },
      ]);
    },
    []
  );
  
  // URL of the created Dwolla card funding source
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);
  
  // URL of the created Dwolla transfer (Location header from create transfer)
  const [transfer, setTransfer] = useState<string | null>(null);
  
  // Payout amount in USD (default: $100.00)
  const [amount, setAmount] = useState("100.00");
  
  // Cardholder name (required for funding source creation)
  const [firstName, setFirstName] = useState("Jane");
  const [lastName, setLastName] = useState("Doe");

  // Billing address for the card (required by Dwolla)
  const [billing, setBilling] = useState({
    address1: "123 Main St",
    city: "Des Moines",
    stateProvinceRegion: "IA",
    country: "US",
    postalCode: "50301"
  });
  
  // Flag indicating whether the user has clicked "Start checkout"
  const [formReady, setFormReady] = useState(false);

  /**
   * Retrieve the Dwolla Customer ID from session storage.
   * This ID was stored in the previous step (create-customer page).
   * 
   * Note: we load this in an effect to avoid SSR/client markup mismatches.
   */
  const [storedCustomerId, setStoredCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Defer sessionStorage access to the client to keep hydration stable.
    const id = sessionStorage.getItem("customerId");
    setStoredCustomerId(id);
  }, []);


  /**
   * Loads and initializes the Checkout.com Flow component.
   * 
   * This function:
   * 1. Loads the Checkout.com Web Components SDK from their CDN (if not already loaded)
   * 2. Initializes the SDK with the payment session and public key
   * 3. Configures callbacks for payment completion and errors
   * 4. Mounts the Flow component to the DOM
   * 
   * The onPaymentCompleted callback orchestrates the complete Push to Card flow:
   * - Exchange payment ID for card token from Checkout.com
   * - Create Dwolla card funding source with the token
   * - Initiate Push to Card transfer from settlement account to card
   * 
   * @param session - The payment session object from Checkout.com
   */
  const loadFlow = useCallback(async (session: ExternalProviderSessionData) => {
    // Load the Checkout.com Web Components SDK if not already loaded.
    // This script provides the Flow component for secure card capture.
    if (!window.CheckoutWebComponents) {
      await loadScript("https://checkout-web-components.checkout.com/index.js");
    }

    // Initialize the Checkout.com SDK. API returns externalProviderSessionData in the shape Flow expects; pass through.
    const checkout = await window.CheckoutWebComponents({
      // Public key - safe to expose client-side
      publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY || "",
      // Environment - "sandbox" for testing, "production" for live
      environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
      // Payment session created server-side
      paymentSession: session,
        componentOptions: {
          card: {
            displayCardholderName: "hidden"
          }
        },
        onPaymentCompleted: async (_component: any, paymentResponse: any) => {
          // Use the payment ID (pay_xxx) from Flow directly when creating the Exchange
          logEvent("Creating Dwolla exchange...");
          const exchangeResult = await createExchange(storedCustomerId ?? "", paymentResponse.id);
          if (!exchangeResult.success || !exchangeResult.resource) {
            logEvent(exchangeResult.message ?? "Failed to create exchange", "error");
            return;
          }

          logEvent("Creating Dwolla card funding source...");
          const fundingSourceResult = await createCardFundingSource(
            storedCustomerId ?? "",
            exchangeResult.resource,
            "My Visa Debit Card",
            { firstName, lastName, billingAddress: billing }
          );
          setCardFundingSource(fundingSourceResult.resource ?? null);
          if (!fundingSourceResult.success || !fundingSourceResult.resource) {
            logEvent(fundingSourceResult.message ?? "Failed to create funding source", "error");
            return;
          }
          logEvent("Card funding source created", "success");

          logEvent("Sending payout...");
          const fd = new FormData();
          fd.set("amount", amount);
          const transferResponse = await sendPayout(fundingSourceResult.resource, fd);
          if (!transferResponse.success) {
            logEvent("An error occurred while sending the payout", "error");
            return;
          }
          setTransfer(transferResponse.resource ?? null);
          logEvent("Transfer created successfully ✅", "success");
        },
      
      /**
       * onError - Called if there's an error in the Flow component
       * 
       * This could be triggered by:
       * - Card validation errors
       * - Network issues
       * - Checkout.com API errors
       */
      onError: (_component: any, error: unknown) => {
        console.error("Flow error", error);
        logEvent("Flow error", "error");
      }
    });

    // Create the Flow component and mount it to the DOM
    const flowComponent = checkout.create("flow");
    flowComponent.mount(document.getElementById("card-capture-container"));
  }, [amount, billing, firstName, lastName, storedCustomerId, logEvent]);

  /**
   * Effect to initialize the payment session and load Flow when user clicks "Start checkout".
   * 
   * This effect runs when formReady changes from false to true, triggering the sequence:
   * 1. Create a payment session on the server
   * 2. Load and mount the Checkout.com Flow component with the session
   */
  useEffect(() => {
    // Only run if the form is ready and we haven't already created a session
    if (!formReady || paymentSession || !storedCustomerId) return;

    (async () => {
      logEvent("Creating exchange session...");
      const createResult = await createExchangeSession(storedCustomerId);
      if (!createResult.success || !createResult.resource) {
        const msg = createResult.success ? "Failed to create exchange session" : (createResult.message ?? "Failed to create exchange session");
        logEvent(msg, "error");
        return;
      }
      const exchangeSessionId = createResult.resource.split("/").filter(Boolean).pop();
      if (!exchangeSessionId) {
        logEvent("Invalid exchange-session Location", "error");
        return;
      }
      logEvent("Retrieving exchange session...");
      const result = await getExchangeSession(exchangeSessionId);
      if (!result.success || !result.resource) {
        const msg = result.success ? "Failed to get payment session" : (result.message ?? "Failed to get payment session");
        logEvent(msg, "error");
        return;
      }
      setPaymentSession(result.resource);
      logEvent("Session ready.");
      await loadFlow(result.resource);
    })();
  }, [formReady, paymentSession, storedCustomerId, loadFlow, logEvent]);

  /**
   * Dynamically loads a JavaScript file from a CDN.
   * 
   * This is used to load the Checkout.com Web Components SDK, which must be
   * loaded from their CDN for PCI compliance (never self-host payment SDKs).
   * 
   * @param src - The URL of the script to load
   * @returns Promise that resolves when the script is loaded
   */
  function loadScript(src: string) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = true;
      tag.onload = resolve;
      tag.onerror = reject;
      document.body.appendChild(tag);
    });
  }

  const steps = [
    { label: "Create exchange session", owner: "Dwolla API" },
    { label: "Capture card in Flow", owner: "Checkout Flow" },
    { label: "Create Dwolla exchange", owner: "Dwolla API" },
    { label: "Create Dwolla funding source", owner: "Dwolla API" },
    { label: "Send payout", owner: "Dwolla API" },
  ];

  const nextYearTwoDigit = String(new Date().getFullYear() + 1).slice(-2);
  const exampleExpiry = `12/${nextYearTwoDigit}`;

  const getActiveStep = () => {
    if (transfer || status?.includes("Transfer created")) return 4;
    if (status?.includes("Sending payout")) return 4;
    if (cardFundingSource || status?.includes("Card funding source created")) return 3;
    if (status?.includes("Creating Dwolla card funding source")) return 3;
    if (status?.includes("Creating Dwolla exchange")) return 2;
    if (paymentSession || status?.includes("Session ready")) return 1;
    return 0;
  };

  return (
    <main className="layout stack">
      <h1>Add debit card and send payout</h1>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {storedCustomerId ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Payout will go to Customer:
            </Typography>
            <Chip
              label={storedCustomerId}
              size="small"
              onClick={() => navigator.clipboard.writeText(storedCustomerId)}
              onDelete={() => navigator.clipboard.writeText(storedCustomerId)}
              deleteIcon={<ContentCopyIcon fontSize="small" />}
              sx={{ cursor: "pointer" }}
              variant="outlined"
            />
          </>
        ) : (
          <Alert severity="warning" sx={{ py: 0, alignItems: "center" }}>
            Customer ID missing. Please create a customer first.
          </Alert>
        )}
      </Box>
      <Stepper activeStep={getActiveStep()} alternativeLabel sx={{ mb: 2 }}>
        {steps.map(({ label, owner }) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.25,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  color: "text.secondary",
                  fontSize: "0.7rem",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                {owner}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {(events.length > 0 || cardFundingSource || transfer) && (
        <StripLastBox sx={{ mb: 2 }}>
          <Chip
            icon={<KeyboardArrowDownIcon />}
            label={events.length > 0 ? `View events log (${events.length})` : "View events log"}
            onClick={() => document.getElementById("events-log")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            variant="outlined"
            sx={{ cursor: "pointer" }}
          />
        </StripLastBox>
      )}
      <Box sx={{ position: "relative" }}>
        {formReady && (
          <Box
            sx={{
              position: { xs: "static", md: "absolute" },
              top: { md: 0 },
              left: { md: "calc(100% + 16px)" },
              zIndex: 2,
              width: { xs: "100%", md: 350 },
              mb: { xs: 2, md: 0 },
            }}
          >
            <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Test cards
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                    4024 7644 4997 1519
                  </Typography>
                  <Tooltip title="Copy Visa">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText("4024764449971519")}
                      sx={{ p: 0.5 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    Visa
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                    5318 7730 1249 0080
                  </Typography>
                  <Tooltip title="Copy Mastercard">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText("5318773012490080")}
                      sx={{ p: 0.5 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    Mastercard
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Exp: any future date (e.g. {exampleExpiry})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  CVV: any 3 digits (e.g. 123)
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
        <Card sx={{ padding: 3 }}>
          <CardHeader title="Payment details" />
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                The exchange session (step 1) only needs your Dwolla customer. Amount, cardholder name, and billing address are used in <strong>later steps</strong> — funding source creation and payout - not for creating the session.
              </Typography>
            </Alert>
            <Box sx={{ mt: 1 }}>
              <TextField
                type="number"
                label="Amount (USD)"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                inputProps={{ min: "0.01", step: "0.01" }}
                sx={{ mb: 3 }}
              />

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Cardholder name
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="First name"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Last name"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Billing address
              </Typography>
              <TextField
                label="Address 1"
                name="address1"
                value={billing.address1}
                onChange={(e) => setBilling({ ...billing, address1: e.target.value })}
                required
                fullWidth
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="City"
                    name="city"
                    value={billing.city}
                    onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="State/Region"
                    name="stateProvinceRegion"
                    value={billing.stateProvinceRegion}
                    onChange={(e) =>
                      setBilling({ ...billing, stateProvinceRegion: e.target.value })
                    }
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Country"
                    name="country"
                    value={billing.country}
                    onChange={(e) => setBilling({ ...billing, country: e.target.value })}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Postal Code"
                    name="postalCode"
                    value={billing.postalCode}
                    onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>

              <LoadingButton
                type="button"
                fullWidth
                loading={formReady && !paymentSession}
                disabled={
                  !amount ||
                  Number(amount) <= 0 ||
                  !firstName?.trim() ||
                  !lastName?.trim() ||
                  Object.values(billing).some((v) => !v) ||
                  formReady
                }
                size="large"
                variant="contained"
                onClick={() => {
                  setFormReady(true);
                }}
                sx={{ mt: 2 }}
              >
                Add card and send payout
              </LoadingButton>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ padding: 3 }}>
          <CardHeader title="Card capture" />
          <CardContent>
            {!formReady ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 300,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="h1" sx={{ mb: 2, opacity: 0.3 }}>
                    💳
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete payment details to begin card capture
                  </Typography>
                </Box>
              ) : (
                <div id="card-capture-container" />
              )}
          </CardContent>
        </Card>
        </Box>
      </Box>

      {/* Events log */}
      {(events.length > 0 || cardFundingSource || transfer) && (
        <Card id="events-log" sx={{ p: 3, mt: 2 }} component="section">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Events log
          </Typography>

          {events.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}>
              {events.map(({ id, message, severity, timestamp }) => (
                <Alert key={id} severity={severity}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {new Date(timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2">{message}</Typography>
                </Alert>
              ))}
            </Box>
          )}

          {transfer && (
            <Card
              variant="outlined"
              sx={{
                bgcolor: "#ffffff",
                borderColor: "#e0e0e0",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  ✅ Payout initiated successfully
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Table size="small" sx={{ mb: 2 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: 180, fontWeight: 600 }}>Transfer ID</TableCell>
                      <TableCell>{transfer.split("/").pop()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell>${amount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Funding source</TableCell>
                      <TableCell>{cardFundingSource?.split("/").pop() ?? "—"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Button
                  component="a"
                  href={`https://dashboard-sandbox.dwolla.com/transfers/${transfer.split("/").pop()}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  size="small"
                >
                  View in Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </Card>
      )}
    </main>
  );
}

