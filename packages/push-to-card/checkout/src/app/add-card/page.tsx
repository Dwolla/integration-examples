"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Alert,
  Typography,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Grid from "@mui/material/Grid2";
import {
  type ExternalProviderSessionData,
  createCardFundingSource,
  createExchange,
  createExchangeSession,
  getExchangeSession,
} from "@/integrations/dwolla";

declare global {
  interface Window {
    CheckoutWebComponents?: any;
  }
}

/**
 * Add a debit card page.
 * Steps: 
 * (1) Create and retrieve exchange session, 
 * (2) Mount Checkout.com Flow,
 * (3) Create Exchange in Dwolla, 
 * (4) Create funding source in Dwolla.
 * On success, stores lastAddedFundingSource in sessionStorage and links to send-payout.
 */
export default function AddCardPage() {
  const [paymentSession, setPaymentSession] = useState<ExternalProviderSessionData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [events, setEvents] = useState<
    Array<{ id: string; message: string; severity: "info" | "success" | "error"; timestamp: string }>
  >([]);
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);
  const [exchangeUrl, setExchangeUrl] = useState<string | null>(null);
  const [fundingSourceName, setFundingSourceName] = useState("My Visa Debit Card");
  const [firstName, setFirstName] = useState("Jane");
  const [lastName, setLastName] = useState("Doe");
  const [billing, setBilling] = useState({
    address1: "123 Main St",
    city: "Des Moines",
    stateProvinceRegion: "IA",
    country: "US",
    postalCode: "50301",
  });
  const [formReady, setFormReady] = useState(false);
  const [fundingSourceLoading, setFundingSourceLoading] = useState(false);
  const [storedCustomerId, setStoredCustomerId] = useState<string | null>(null);
  const router = useRouter();

  const handleStartOver = useCallback(() => {
    sessionStorage.removeItem("customerId");
    sessionStorage.removeItem("lastAddedFundingSource");
    router.push("/");
  }, [router]);

  const logEvent = useCallback(
    (message: string, severity: "info" | "success" | "error" = "info") => {
      const timestamp = new Date().toISOString();
      setStatus(message);
      setEvents((prev) => [
        ...prev,
        { id: `${timestamp}-${prev.length}`, message, severity, timestamp },
      ]);
    },
    []
  );

  // Customer ID is required; set by create-customer page and stored in sessionStorage.
  useEffect(() => {
    const id = sessionStorage.getItem("customerId");
    setStoredCustomerId(id);
  }, []);

  // Step 2: Mount Flow with session data. Step 3 runs inside onPaymentCompleted (create Exchange).
  const loadFlow = useCallback(
    async (session: ExternalProviderSessionData) => {
      if (!window.CheckoutWebComponents) {
        await loadScript("https://checkout-web-components.checkout.com/index.js");
      }

      const checkout = await window.CheckoutWebComponents({
        publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY || "",
        environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
        paymentSession: session,
        componentOptions: {
          card: { displayCardholderName: "hidden" },
        },
        locale: "en-US",
        translations: {
          "en-US": {
            "pay_button.pay": "Connect Card",
            "pay_button.payment_processing": "Connecting card...",
            "pay_button.payment_complete": "Card connected",
            "pay_button.payment_failed": "Connection failed, please try again"
          }
        },
        onPaymentCompleted: async (_component: any, paymentResponse: any) => {
          // Step 3: Create Dwolla Exchange using the payment id from Flow; exchange URL is needed for step 4.
          logEvent("Creating Dwolla exchange...");
          const exchangeResult = await createExchange(storedCustomerId ?? "", paymentResponse.id);
          if (!exchangeResult.success || !exchangeResult.resource) {
            logEvent(exchangeResult.message ?? "Failed to create exchange", "error");
            return;
          }
          setExchangeUrl(exchangeResult.resource);
          const exchangeId = exchangeResult.resource.split("/").filter(Boolean).pop();
          logEvent(`Exchange created (ID: ${exchangeId ?? "—"}). Enter cardholder name and billing below.`, "success");
        },
        onError: (_component: any, error: unknown) => {
          console.error("Flow error", error);
          logEvent("Flow error", "error");
        },
      });

      const flowComponent = checkout.create("flow");
      flowComponent.mount(document.getElementById("card-capture-container"));
    },
    [storedCustomerId, logEvent]
  );

  // Step 1: Create exchange session, then fetch session to get externalProviderSessionData for Flow.
  useEffect(() => {
    if (!formReady || paymentSession || !storedCustomerId) return;

    (async () => {
      logEvent("Creating exchange session...");
      const createResult = await createExchangeSession(storedCustomerId);
      if (!createResult.success || !createResult.resource) {
        logEvent(createResult.message ?? "Failed to create exchange session", "error");
        return;
      }
      const exchangeSessionId = createResult.resource.split("/").filter(Boolean).pop();
      if (!exchangeSessionId) {
        logEvent("Invalid exchange-session Location", "error");
        return;
      }
      logEvent("Retrieving exchange session...");
      const result = await getExchangeSession(exchangeSessionId);
      if (!result.success) {
        logEvent(result.message ?? "Failed to get payment session", "error");
        return;
      }
      if (!result.resource) {
        logEvent("Failed to get payment session", "error");
        return;
      }
      setPaymentSession(result.resource);
      logEvent("Session ready.");
      await loadFlow(result.resource);
    })();
  }, [formReady, paymentSession, storedCustomerId, loadFlow, logEvent]);

  function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = true;
      tag.onload = () => resolve();
      tag.onerror = reject;
      document.body.appendChild(tag);
    });
  }

  const steps = [
    { label: "Create and retrieve exchange session", owner: "Dwolla API" },
    { label: "Mount Checkout.com Flow", owner: "Checkout Flow" },
    { label: "Create Exchange in Dwolla", owner: "Dwolla API" },
    { label: "Create funding source in Dwolla", owner: "Dwolla API" },
  ];

  const nextYearTwoDigit = String(new Date().getFullYear() + 1).slice(-2);
  const exampleExpiry = `12/${nextYearTwoDigit}`;

  const getActiveStep = () => {
    if (cardFundingSource || status?.includes("Card funding source created")) return 4;
    if (status?.includes("Creating Dwolla card funding source")) return 3;
    if (exchangeUrl || status?.includes("Exchange created")) return 3;
    if (paymentSession || status?.includes("Session ready")) return 1;
    return 0;
  };

  // Step 4: Create card funding source in Dwolla (exchange URL from step 3). Persist ID for payout.
  const handleCreateFundingSource = async () => {
    if (!exchangeUrl || !storedCustomerId) return;
    setFundingSourceLoading(true);
    logEvent("Creating Dwolla card funding source...");
    const fundingSourceResult = await createCardFundingSource(
      storedCustomerId,
      exchangeUrl,
      fundingSourceName,
      { firstName, lastName, billingAddress: billing }
    );
    setFundingSourceLoading(false);
    setCardFundingSource(fundingSourceResult.resource ?? null);
    if (!fundingSourceResult.success || !fundingSourceResult.resource) {
      logEvent(fundingSourceResult.message ?? "Failed to create funding source", "error");
      return;
    }
    logEvent("Card funding source created", "success");
    sessionStorage.setItem("lastAddedFundingSource", fundingSourceResult.resource);
  };

  return (
    <main className="layout stack">
      <h1>Add a debit card</h1>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
        {storedCustomerId ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Card will be linked to Customer:
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
        <Button component="button" onClick={handleStartOver} sx={{ ml: "auto" }} size="small" color="inherit">
          Start over
        </Button>
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
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "start" }}>
        <Box>
          {!formReady ? (
            <Card sx={{ padding: 3 }}>
              <CardContent>
                <LoadingButton
                  type="button"
                  fullWidth
                  disabled={!storedCustomerId}
                  size="large"
                  variant="contained"
                  onClick={() => setFormReady(true)}
                >
                  Start
                </LoadingButton>
              </CardContent>
            </Card>
          ) : !paymentSession ? (
            <Card sx={{ padding: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Loading…
                </Typography>
              </CardContent>
            </Card>
          ) : exchangeUrl && !cardFundingSource ? (
            <Card sx={{ padding: 3 }}>
              <CardHeader title="Cardholder name and billing" />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Required to create the Dwolla funding source for the card you just entered.
                    </Typography>
                  </Alert>
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      label="Funding source name"
                      name="fundingSourceName"
                      value={fundingSourceName}
                      onChange={(e) => setFundingSourceName(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
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
                          onChange={(e) => setBilling({ ...billing, stateProvinceRegion: e.target.value })}
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
                      loading={fundingSourceLoading}
                      disabled={
                        !firstName?.trim() ||
                        !lastName?.trim() ||
                        Object.values(billing).some((v) => !v)
                      }
                      size="large"
                      variant="contained"
                      onClick={handleCreateFundingSource}
                      sx={{ mt: 2 }}
                    >
                      Create funding source
                    </LoadingButton>
                  </Box>
                </CardContent>
            </Card>
          ) : cardFundingSource ? (
            <Card sx={{ padding: 3 }}>
              <CardHeader title="Card added" />
              <CardContent>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Card added successfully
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Funding source ID: {cardFundingSource.split("/").pop()}
                  </Typography>
                  <Button component={Link} href="/send-payout" variant="contained" size="medium">
                    Send a payout
                  </Button>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: { xs: "static", md: "absolute" },
                  right: { md: "100%" },
                  marginRight: { md: 2 },
                  marginBottom: { xs: 2, md: 0 },
                  top: { md: 0 },
                  width: 340,
                  zIndex: 2,
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
              <Card sx={{ padding: 3 }}>
                <CardHeader title="Card capture" />
                <CardContent>
                  <div id="card-capture-container" />
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        <Card id="events-log" sx={{ p: 3, position: { md: "sticky" }, top: 16 }} component="section">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Events log
          </Typography>
          {events.length > 0 ? (
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
          ) : (
            <Typography variant="body2" color="text.secondary">
              Events will appear here as you progress.
            </Typography>
          )}
        </Card>
      </Box>
    </main>
  );
}
