import { Box, Container } from "@mui/material";
import Head from "next/head";
import React from "react";

interface Props {
    children?: React.ReactNode;
    title: string;
}

const MainLayout: (props: Props) => JSX.Element = ({ children, title }) => (
    <>
        <Head>
            <title>{title}</title>
        </Head>
        <Container component="main" maxWidth="lg">
            <Box
                sx={{
                    my: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                {children}
            </Box>
        </Container>
    </>
);

export default MainLayout;
