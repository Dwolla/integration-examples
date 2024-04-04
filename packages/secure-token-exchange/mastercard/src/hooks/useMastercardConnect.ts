import useScript from "react-script-hook";

export interface CommonExitEvent {
    code: number;
    reason: string;
}

interface CommonOptions {
    overlay?: string;
    selector?: string;
}

export interface ConnectLaunchOptions {
    destroyPrevious?: boolean;
    url: string;
}

export interface ConnectOptions extends CommonOptions {
    onCancel: (event: ConnectCancelEvent) => void;
    onError: (event: ConnectErrorEvent) => void;
    onSuccess: (event: ConnectSuccessEvent) => void;
}

export interface ConnectSuccessEvent {
    code: number;
    reason: string;
    reportData: [
        {
            portfolioId: string;
            reportId: string;
            type: string;
        }
    ];
}

export type ConnectCancelEvent = CommonExitEvent;

export type ConnectErrorEvent = CommonExitEvent;

type FinicityWindow = Window &
    typeof globalThis & {
        finicityConnect: {
            destroy: () => void;

            launch: (
                url: string,
                options: CommonOptions & {
                    cancel: (event: ConnectCancelEvent) => void;
                    error: (event: ConnectErrorEvent) => void;
                    success: (event: ConnectSuccessEvent) => void;
                }
            ) => void;
        };
    };

// https://connect2.finicity.com/assets/sdk/finicity-connect.min.js
const MASTERCARD_CONNECT_URL = "https://connect2.finicity.com/assets/sdk/finicity-connect.min.js";

// Extracted from MASTERCARD_CONNECT_URL above
const MASTERCARD_IFRAME_ID = "finicityConnectIframe";

const noop = () => undefined;

export const useMastercardConnect = (options: ConnectOptions) => {
    // Load Mastercard's script from their CDN
    const [loading, error] = useScript({
        checkForExisting: true,
        src: MASTERCARD_CONNECT_URL
    });

    /**
     * Creates a `<style>` tag that is the entire height and width of the page, and applies it to the
     * `<head>` element of the page. Mastercard Connect already does this; however, `DOMContentLoaded`
     * is not a good way to detect if the DOM has loaded when using React/Next, and it often breaks,
     * leaving its implementor(s) uncalled.
     */
    function applyStyles() {
        const style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.innerHTML = `#${MASTERCARD_IFRAME_ID} {
            background: rgba(0, 0, 0, 0.8);
            height: 100vh;
            left: 0;
            position: absolute;
            top: 0;
            width: 100vw;
            z-index: 10;
        }`;

        const head = document.getElementsByTagName("head")[0];
        head.appendChild(style);
    }

    /**
     * Destroys Mastercard Connect
     * @see {@link https://docs.finicity.com/c_connect-web-2-0-embed-iframe/#connect-web-embed-5|Connect Web 2.0 Embed iFrame}
     */
    function destroy() {
        if (failNoWindow()) return;
        (window as FinicityWindow).finicityConnect.destroy();
    }

    /**
     * Outputs a message to the console if `window` is not defined (`undefined`)
     * @returns - true if a failure message was sent, otherwise false
     */
    function failNoWindow() {
        if (typeof window === "undefined") {
            console.error("useMastercardConnect: Failed to perform operation. `window` is not defined.");
            return true;
        }
        return false;
    }

    /**
     * Launches Mastercard Connect to the specified URL.
     * @param options - Configuration options that are used to create Connect's iFrame
     */
    function launch({ destroyPrevious = true, url }: ConnectLaunchOptions) {
        if (failNoWindow()) return;
        if (destroyPrevious) destroy();
        (window as FinicityWindow).finicityConnect.launch(url, {
            cancel: options.onCancel,
            error: options.onError,
            overlay: options.overlay,
            selector: options.selector,
            success: options.onSuccess
        });
        applyStyles();
    }

    // Check if no error has been thrown, and we're finished loading
    const ready = !error && !loading;

    return {
        destroy: ready ? destroy : noop,
        error,
        launch: ready ? launch : noop,
        ready
    };
};
