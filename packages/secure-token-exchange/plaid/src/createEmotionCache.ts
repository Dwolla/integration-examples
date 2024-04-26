import createCache from "@emotion/cache";

const isBrowser = typeof document !== "undefined";

export default function createEmotionCache() {
    const insertionPoint: HTMLMetaElement | undefined = isBrowser
        ? document.querySelector<HTMLMetaElement>("meta[name='emotion-insertion-point']") ?? undefined
        : undefined;
    return createCache({ key: "mui-style", insertionPoint });
}
