"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // TODO: Documentation
    useEffect(() => {
        const exchangeId = searchParams.get("exchange");
        if (exchangeId) {
            router.push(`/create-funding-source?exchangeId=${exchangeId}`);
        } else {
            router.push("/create-external-party");
        }
    }, [router, searchParams]);

    return <div>Loading...</div>;
}
