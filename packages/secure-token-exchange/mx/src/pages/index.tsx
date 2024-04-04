import type { GetServerSideProps, NextPage } from "next";

const HomePage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/create-customers",
            permanent: true
        }
    };
};

export default HomePage;
