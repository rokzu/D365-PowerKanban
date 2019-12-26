import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";

type Action = { type: "setAppId", payload: string }
    | { type: "setSelectedRecord", payload: Xrm.LookupValue };

export type Dispatch = (action: Action) => void;

export type AppStateProps = {
    appId?: string;
    configId?: string;
    selectedRecord?: { entityType: string, id: string, name?: string };
};

type AppContextProps = {
    children: React.ReactNode;
};

function stateReducer(state: AppStateProps, action: Action): AppStateProps {
    switch (action.type) {
        case "setAppId": {
            return { appId: action.payload };
        }
        case "setSelectedRecord": {
            return { selectedRecord: action.payload };
        }
    }
}

export const AppState = React.createContext<AppStateProps | undefined>(undefined);
export const AppDispatch = React.createContext<Dispatch | undefined>(undefined);

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
            <AppDispatch.Provider value={dispatch}>
                {children}
            </AppDispatch.Provider>
        </AppState.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppState);

    if (!context) {
        throw new Error("useAppState must be used within a state provider!");
    }

    return context;
}

export function useAppDispatch() {
    const context = useContext(AppDispatch);

    if (!context) {
        throw new Error("useAppDispatch must be used within a state provider!");
    }

    return context;
}

export function useAppContext(): [ AppStateProps, Dispatch ] {
    return [ useAppState(), useAppDispatch() ];
}