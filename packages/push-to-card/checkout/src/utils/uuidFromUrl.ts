/**
 * Converts a Dwolla resource location to its UUID by stripping the URL component(s).
 */
export default function uuidFromUrl(resourceUrl: string): string {
    const lastSlash = resourceUrl.lastIndexOf("/");
    return resourceUrl.substring(lastSlash + 1).trim();
}
