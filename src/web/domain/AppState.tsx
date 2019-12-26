import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";

type Action = { type: "setAppId", payload: string }
    | { type: "setSelectedRecord", payload: Xrm.LookupValue };

type AppState = {
    appId?: string;
    configId?: string;
    selectedRecord?: { entityType: string, id: string, name?: string };
    secondaryVisible?: boolean;
    setSecondaryVisible?: (visible: boolean) => void;
    dispatch?: (action: Action) => void;
};

type AppContextProps = {
    children: React.ReactNode;
};

function stateReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case "setAppId": {
            return { appId: action.payload };
        }
        case "setSelectedRecord": {
            return { selectedRecord: action.payload };
        }
    }
}

export const AppState = React.createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: AppContextProps) {
    const search = ParseSearch();

    const appId = search["appid"];
    const configId = search["data"];

    const [state, dispatch] = React.useReducer(stateReducer, {
        appId,
        configId
    });

    return (
        <AppState.Provider value={state}>
            {children}
        </AppState.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppState);

    if (!context) {
        throw new Error("Use App State must be used within a state provider!");
    }

    return context;
}