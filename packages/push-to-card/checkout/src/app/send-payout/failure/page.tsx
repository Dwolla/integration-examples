import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Placeholder page for failed payment redirects from Checkout.com.
 * 
 * Note: This route is required by the Checkout.com API (failure_url) to create a payment-session
 * 
 * This page serves as a fallback for edge cases like:
 * - 3D Secure authentication failures
 * - Browser issues preventing callback execution
 * - User closes/refreshes during payment
 * 
 * TODO: Implement redirect-based error handling if needed for your use case.
 */
export default function PayoutFailurePage() {
  return (
    <main className="layout stack">
      <Card sx={{ padding: 3, maxWidth: 600, margin: "0 auto" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 4,
              textAlign: "center",
            }}
          >
            <ErrorIcon sx={{ fontSize: 80, color: "error.main" }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }} color="error">
              Payment Failed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The payment could not be processed.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This could be due to insufficient funds, an incorrect card number, or a network issue.
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/send-payout"
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    </main>
  );
}

