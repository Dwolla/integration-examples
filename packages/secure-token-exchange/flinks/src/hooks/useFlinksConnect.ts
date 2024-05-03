import { useEventListener } from "usehooks-ts";

export interface ConnectLaunchOptions {
    url: string;
}

export interface ConnectEvent {
    step: string;
}

export interface ConnectSuccessEvent extends ConnectEvent {
    loginId: string;
}

export const useFlinksConnect = (onMessage: (event: MessageEvent) => void) => {
    useEventListener("message", onMessage);

    function applyStyles() {
        const style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.innerHTML = `
        @media (min-width: 768px) {
          .flinksconnect { width: 100%; }
        }`;

        const head = document.getElementsByTagName("head")[0];
        head.appendChild(style);
    }
    return { applyStyles };
};
