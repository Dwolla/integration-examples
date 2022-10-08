import { Container, styled } from "@mui/material";
import Head from "next/head";
import type { ReactNode } from "react";

interface Props {
    children?: ReactNode;
    title: string;
}

const ParentBox = styled("div", { name: "ParentBox" })(({ theme }) => ({
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginTop: theme.spacing(4)
}));

const MainLayout: (props: Props) => JSX.Element = ({ children, title }) => (
    <>
        <Head>
            <title>{title}</title>
        </Head>
        <Container component="main" maxWidth="lg">
            <ParentBox>{children}</ParentBox>
        </Container>
    </>
);

export default MainLayout;
