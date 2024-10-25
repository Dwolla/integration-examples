"use client";
import { Container, styled } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import Head from "next/head";

const ParentBox = styled("div", { name: "ParentBox" })(({ theme }) => ({
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginTop: theme.spacing(4)
}));

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <Head>
                <title>Dwolla Open Banking Example</title>
                <meta
                    name="description"
                    content="Sample app demonstrating Dwolla's open banking integration with Visa"
                />
            </Head>
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <Container component="main" maxWidth="lg">
                            <ParentBox>{children}</ParentBox>
                        </Container>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
