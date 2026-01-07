"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { Box, Card, CardContent, CardHeader, TextField, Alert, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { createPaymentSession, exchangePaymentForCardToken } from "@/integrations/checkout";
import { createCardFundingSource, sendPayout } from "@/integrations/dwolla";

declare global {
  interface Window {
    CheckoutWebComponents?: any;
  }
}

export default function AddCardPage() {
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [cardFundingSource, setCardFundingSource] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<any>(null);
  const [amount, setAmount] = useState("100.00");
  const [billing, setBilling] = useState({
    address1: "123 Main St",
    city: "Des Moines",
    stateProvinceRegion: "IA",
    country: "US",
    postalCode: "50301"
  });
  const [formReady, setFormReady] = useState(false);

  /**
   * The Dwolla Customer ID that we will use when creating the Exchange and Funding source for.
   */
  const storedCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("customerId") : null;


  const loadFlow = useCallback(async (session: any) => {
    if (!window.CheckoutWebComponents) {
      await loadScript("https://checkout-web-components.checkout.com/index.js");
    }

    const checkout = await window.CheckoutWebComponents({
      // Use Next.js public env vars; these are inlined at build time.
      publicKey: process.env.NEXT_PUBLIC_CKO_PUBLIC_KEY || "",
      environment: process.env.NEXT_PUBLIC_CKO_ENV || "sandbox",
      paymentSession: session,
      onPaymentCompleted: async (_component: any, paymentResponse: any) => {
        setStatus("Fetching card token from Checkout.com...");
        const cardToken = await exchangePaymentForCardToken(paymentResponse.id);

        setStatus("Creating Dwolla card funding source...");
        const fundingSourceLocation = await createCardFundingSource(
          storedCustomerId ?? "",
          cardToken,  
          billing
        );
        setCardFundingSource(fundingSourceLocation.resource ?? null);
        setStatus("Card funding source created");

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
      onError: (_component: any, error: unknown) => {
        console.error("Flow error", error);
        setStatus("Flow error");
      }
    });

    const flowComponent = checkout.create("flow");
    flowComponent.mount(document.getElementById("card-capture-container"));
  }, [amount, billing, storedCustomerId]);

  useEffect(() => {
    if (!formReady || paymentSession) return;
    (async () => {
      setStatus("Creating payment session...");
      const session = await createPaymentSession(); 
      setPaymentSession(session);
      setStatus("Session ready.");    
      await loadFlow(session);
    })();
  }, [formReady, paymentSession, loadFlow]);

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
      </Card>
      )}
    </main>
  );
}

