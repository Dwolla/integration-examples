import type { AlertColor } from "@mui/lab";
import { useState } from "react";

export enum NetworkState {
    LOADING = "LOADING",
    NOT_LOADING = "NOT_LOADING"
}

export interface MuiAlert {
    message: string;
    severity: AlertColor;
}

export const useNetworkAlert = () => {
    /**
     * The current MuiAlert state. Could be shown to the user.
     */
    const [alert, setAlert] = useState<MuiAlert | null>(null);

    /**
     * The current network state. Could be used to avoid indicate if a resource is loading.
     */
    const [networkState, setNetworkState] = useState<NetworkState>(NetworkState.NOT_LOADING);

    /**
     * Update the current network alert by specifying both the updated alert message (or null)
     * and whether we have started/finished loading a resource.
     */
    function updateNetworkAlert(alert: MuiAlert | null, networkState: NetworkState): void {
        setAlert(alert);
        setNetworkState(networkState);
    }

    return {
        alert,
        networkState,
        updateNetworkAlert
    };
};
