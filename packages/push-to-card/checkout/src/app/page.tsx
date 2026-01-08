"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";

/**
 * Landing Page Component for Push to Card Example
 * 
 * This page provides an overview of the Push to Card integration flow:
 * 1. Create Customer - Establish a Dwolla Customer to receive the payout
 * 2. Add Debit Card - Capture card details via Checkout.com Flow
 * 3. Send Payout - Initiate transfer from settlement account to card
 * 
 * The page includes:
 * - Step-by-step visual walkthrough of the integration
 * - Prerequisites reminder about settlement account configuration
 * - Links to relevant Dwolla documentation
 * - Start button to begin the flow
 */
export default function Home() {
    const cardSx = {
        height: "100%",
        display: "flex",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
        backgroundColor: "#fff"
    };

    const primaryButtonSx = {
        borderRadius: "10px",
        boxShadow: "0 10px 24px rgba(37, 99, 235, 0.18)",
        textTransform: "none",
        px: 3,
        py: 1.5
    };

    const docButtonSx = {
        borderRadius: "10px",
        textTransform: "none",
        borderColor: "#e2e8f0",
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#eef2ff"
        }
    };

    return (
        <main>
            <Stack spacing={4} sx={{ maxWidth: 960, mx: "auto", px: 2, py: 4 }}>
                <Stack spacing={1}>
                    <Chip label="3-step flow" color="default" size="small" sx={{ alignSelf: "flex-start" }} />
                    <Typography variant="h4" component="h1">
                        Integration steps
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        High-level milestones for this example integration.
                    </Typography>
                </Stack>

                <Grid container spacing={2} alignItems="stretch">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={cardSx}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                                <Typography variant="overline" color="text.secondary">
                                    Step 1
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    Create Customer
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Create a Dwolla Customer to own the card funding source.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={cardSx}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                                <Typography variant="overline" color="text.secondary">
                                    Step 2
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    Add Debit Card
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Mount Checkout.com Flow, capture the card, and create a Dwolla card funding source.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={cardSx}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                                <Typography variant="overline" color="text.secondary">
                                    Step 3
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    Send Payout
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Use the settlement account as source and the card funding source as destination.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box>
                    <Button component={Link} href="/create-customer" variant="contained" size="large" sx={primaryButtonSx}>
                        Start
                    </Button>
                </Box>

                <Card variant="outlined" sx={cardSx}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography variant="overline" color="text.secondary">
                            Prerequisites
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            This demo assumes you’ve already added a settlement account in the Dwolla Dashboard and
                            pre-funded it using the API or the Dwolla Dashboard.
                        </Typography>
                    </CardContent>
                </Card>

                <Stack spacing={1}>
                    <Typography variant="h6">Docs</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                            component="a"
                            href="https://developers.dwolla.com/docs/adding-a-debit-card"
                            target="_blank"
                            variant="outlined"
                            sx={docButtonSx}
                        >
                            Adding a Debit Card
                        </Button>
                        <Button
                            component="a"
                            href="https://developers.dwolla.com/docs/push-to-card"
                            target="_blank"
                            variant="outlined"
                            sx={docButtonSx}
                        >
                            Push to Card Concepts
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </main>
    );
}