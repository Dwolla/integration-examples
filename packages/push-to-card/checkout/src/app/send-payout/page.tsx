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
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { getSettlementFundingSource, sendPayout } from "@/integrations/dwolla";

/**
 * Send a payout page.
 * Collects amount for payout; settlement and card retrieval run in the background.
 * Events log tracks server-side API calls. Requires lastAddedFundingSource in sessionStorage (set by add-card page).
 */
export default function SendPayoutPage() {
  const [storedCustomerId, setStoredCustomerId] = useState<string | null>(null);
  const [lastAddedFundingSource, setLastAddedFundingSource] = useState<string | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(true);
  const [amount, setAmount] = useState("100.00");
  const [sending, setSending] = useState(false);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [events, setEvents] = useState<
    Array<{ id: string; message: string; severity: "info" | "success" | "error"; timestamp: string }>
  >([]);

  const router = useRouter();

  const handleStartOver = useCallback(() => {
    sessionStorage.removeItem("customerId");
    sessionStorage.removeItem("lastAddedFundingSource");
    router.push("/");
  }, [router]);

  const logEvent = useCallback(
    (message: string, severity: "info" | "success" | "error" = "info") => {
      const timestamp = new Date().toISOString();
      setEvents((prev) => [
        ...prev,
        { id: `${timestamp}-${prev.length}`, message, severity, timestamp },
      ]);
    },
    []
  );

  // Card funding source (payout destination) is set by add-card and stored in sessionStorage.
  useEffect(() => {
    const customerId = sessionStorage.getItem("customerId");
    const fundingSource = sessionStorage.getItem("lastAddedFundingSource");
    setStoredCustomerId(customerId);
    setLastAddedFundingSource(fundingSource);
  }, []);

  // Settlement funding source = source of funds for the transfer (e.g. your platform's Dwolla balance).
  useEffect(() => {
    if (!lastAddedFundingSource) {
      setSettlementLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setSettlementLoading(true);
      logEvent("Retrieving settlement account…");
      const result = await getSettlementFundingSource();
      if (cancelled) return;
      setSettlementLoading(false);
      if (result.success && result.resource) {
        logEvent("Settlement account ready", "success");
      } else {
        logEvent(result.message ?? "Failed to get settlement funding source", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lastAddedFundingSource, logEvent]);

  // Transfer: destination = card funding source, amount from form. Source (settlement) is resolved in API.
  const handleSendPayout = async () => {
    if (!lastAddedFundingSource || !amount || Number(amount) <= 0) return;
    setSending(true);
    logEvent("Sending payout...");
    const fd = new FormData();
    fd.set("amount", amount);
    const result = await sendPayout(lastAddedFundingSource, fd);
    setSending(false);
    if (result.success && result.resource) {
      setTransfer(result.resource);
      logEvent("Transfer created successfully", "success");
    } else {
      logEvent(result.message ?? "Failed to send payout", "error");
    }
  };

  if (!lastAddedFundingSource && !settlementLoading) {
    return (
      <main className="layout stack">
        <h1>Send a payout</h1>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Button component="button" onClick={handleStartOver} size="small" color="inherit" sx={{ ml: "auto" }}>
            Start over
          </Button>
        </Box>
        <Alert severity="warning" sx={{ maxWidth: 560 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            No card funding source found. Add a debit card first; the card is then used as the
            destination for the payout.
          </Typography>
          <Button component={Link} href="/add-card" variant="contained" size="small">
            Add a debit card
          </Button>
        </Alert>
      </main>
    );
  }

  return (
    <main className="layout stack">
      <h1>Send a payout</h1>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
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
            Customer ID missing. Create a customer and add a card first.
          </Alert>
        )}
        <Button component="button" onClick={handleStartOver} sx={{ ml: "auto" }} size="small" color="inherit">
          Start over
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "start" }}>
        <Card sx={{ padding: 3, maxWidth: 400 }}>
          <CardHeader title="Send a payout" />
          <CardContent>
            <TextField
              type="number"
              label="Amount (USD)"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              inputProps={{ min: "0.01", step: "0.01" }}
              sx={{ mb: 2 }}
            />
            <LoadingButton
              type="button"
              variant="contained"
              size="large"
              loading={sending}
              disabled={!amount || Number(amount) <= 0}
              onClick={handleSendPayout}
            >
              Send payout
            </LoadingButton>
          </CardContent>
        </Card>

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
          {transfer && (
            <Card variant="outlined" sx={{ bgcolor: "#ffffff", borderColor: "#e0e0e0", mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  Payout initiated successfully
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
                      <TableCell>{lastAddedFundingSource?.split("/").pop() ?? "—"}</TableCell>
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
      </Box>
    </main>
  );
}
