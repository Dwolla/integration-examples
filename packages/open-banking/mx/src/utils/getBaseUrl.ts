/**
 * Utility function to get the Dwolla base URL for generating API endpoints where needed
 */
export default function getDwollaBaseUrl(): string {
    const env = process.env.DWOLLA_ENV?.toLowerCase();
    switch (env) {
        case "production":
            return "https://api.dwolla.com";
        default:
            return `https://api-${env}.dwolla.com`;
    }
}
