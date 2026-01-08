import { Box, Card, CardContent, Typography } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
/**
 * Placeholder page for successful payment redirects from Checkout.com.
 * 
 * Note: This route is required by the Checkout.com API (success_url) to create a payment-session
 * 
 * This page serves as a fallback for edge cases like:
 * - 3D Secure authentication redirects
 * - Browser issues preventing callback execution
 * - User closes/refreshes during payment
 * 
 * TODO: Implement redirect-based payment completion if needed for your use case.
 */
export default function PayoutSuccessPage() {
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
            <CheckCircleIcon sx={{ fontSize: 80, color: "success.main" }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Payment Successful
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your payment was processed successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <a href="/" style={{ color: "inherit", textDecoration: "underline" }}>
                Return to home page
              </a>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </main>
  );
}

