import type { AlertColor } from "@mui/material";
import { useState } from "react";

export enum NetworkState {
    LOADING = "LOADING",
    NOT_LOADING = "NOT_LOADING"
}

export interface MuiAlert {
    message: string;
    severity: AlertColor;
}

export interface UpdateNetworkAlertOptions {
    alert?: MuiAlert;
    networkState: NetworkState;
}

export const useNetworkAlert = () => {
    /**
     * The current alert state. Is usually shown to the user if not `undefined`.
     */
    const [alert, setAlert] = useState<MuiAlert | undefined>();

    /**
     * The current network state. Is usually used to indicate if a resource is loading.
     */
    const [networkState, setNetworkState] = useState<NetworkState>(NetworkState.NOT_LOADING);

    /**
     * Update the current alert by specifying both the new message (or none) and whether
     * a resource has begun/finished loading.
     */
    function updateNetworkAlert({ alert, networkState }: UpdateNetworkAlertOptions) {
        setAlert(alert);
        setNetworkState(networkState);
    }

    return {
        alert,
        networkState,
        updateNetworkAlert
    };
};
