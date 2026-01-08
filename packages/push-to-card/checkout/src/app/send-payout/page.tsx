"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { Box, Card, CardContent, CardHeader, TextField, Alert, Typography, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Grid from "@mui/material/Grid2";
import { createPaymentSession, exchangePaymentForCardToken } from "@/integrations/checkout";
import { createCardFundingSource, sendPayout } from "@/integrations/dwolla";

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
export default function AddCardPage() {
  // Payment session object returned by Checkout.com
  const [paymentSession, setPaymentSession] = useState<any>(null);
  
  // Current status message to display to the user
  const [status, setStatus] = useState<string | null>(null);
  
  // URL of the created Dwolla card funding source
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);
  
  // URL of the created Dwolla transfer
  const [transfer, setTransfer] = useState<any>(null);
  
  // Payout amount in USD (default: $100.00)
  const [amount, setAmount] = useState("100.00");
  
  // Billing address for the card (required by Dwolla)
  // Pre-filled with sample data for easier testing
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
   */
  const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;


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
  const loadFlow = useCallback(async (session: any) => {
    // Load the Checkout.com Web Components SDK if not already loaded.
    // This script provides the Flow component for secure card capture.
    if (!window.CheckoutWebComponents) {
      await loadScript("https://checkout-web-components.checkout.com/index.js");
    }

    // Initialize the Checkout.com SDK with our configuration
    const checkout = await window.CheckoutWebComponents({
      // Public key - safe to expose client-side
      publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY || "",
      
      // Environment - "sandbox" for testing, "production" for live
      environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
      
      // Payment session created server-side
      paymentSession: session,
      onPaymentCompleted: async (_component: any, paymentResponse: any) => {
        // Step 1: Exchange the payment ID for a card token
        setStatus("Fetching card token from Checkout.com...");
        const cardToken = await exchangePaymentForCardToken(paymentResponse.id);

        // Step 2: Create a Dwolla card funding source with the token
        setStatus("Creating Dwolla card funding source...");
        const fundingSourceLocation = await createCardFundingSource(
          storedCustomerId ?? "",
          cardToken,  
          billing
        );
        setCardFundingSource(fundingSourceLocation.resource ?? null);
        setStatus("Card funding source created");

        // Step 3: Initiate the Push to Card transfer
        setStatus("Sending payout...");
        const fd = new FormData();
        fd.set("amount", amount);
        const transferResponse = await sendPayout(fundingSourceLocation.resource ?? "", fd);
      
        if (!transferResponse.success) {
          setStatus("An error occurred while sending the payout");
          return;
        }
        setTransfer(transferResponse.resource ?? null);
        setStatus("Transfer created successfully ✅");
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
        setStatus("Flow error");
      }
    });

    // Create the Flow component and mount it to the DOM
    const flowComponent = checkout.create("flow");
    flowComponent.mount(document.getElementById("card-capture-container"));
  }, [amount, billing, storedCustomerId]);

  /**
   * Effect to initialize the payment session and load Flow when user clicks "Start checkout".
   * 
   * This effect runs when formReady changes from false to true, triggering the sequence:
   * 1. Create a payment session on the server
   * 2. Load and mount the Checkout.com Flow component with the session
   */
  useEffect(() => {
    // Only run if the form is ready and we haven't already created a session
    if (!formReady || paymentSession) return;
    
    (async () => {
      setStatus("Creating payment session...");
      const session = await createPaymentSession(); 
      setPaymentSession(session);
      setStatus("Session ready.");    
      await loadFlow(session);
    })();
  }, [formReady, paymentSession, loadFlow]);

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

  return (
    <main className="layout stack">
      <h1>Add debit card and send payout</h1>
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
                  Object.values(billing).some((v) => !v) ||
                  formReady
                }
                size="large"
                variant="contained"
                onClick={() => setFormReady(true)}
                sx={{ mt: 2 }}
              >
                Start checkout
              </LoadingButton>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ padding: 3 }}>
          <CardHeader title="Card capture" />
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
        </Card>
      </Box>

      {/* Developer documentation */}
      {status && (
      <Card sx={{ padding: 3 }}>
          <CardContent>
            {/* Test Card Details */}
            <Box sx={{ mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Test Cards
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
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
                <Typography variant="caption" color="text.secondary">Visa</Typography>
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
                <Typography variant="caption" color="text.secondary">Mastercard</Typography>
                
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
               Exp: any future date, CVV: any 3 digits 
              </Typography>
            </Box>

            {/* Status Updates */}
            {status && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Status: {status}
              </Alert>
            )}
            {cardFundingSource && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Funding source created: <span className="code">{cardFundingSource}</span>
              </Alert>
            )}
            {transfer && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Transfer created: <span className="code">{transfer}</span>
              </Alert>
            )}
          </CardContent>
      </Card>
      )}
    </main>
  );
}

