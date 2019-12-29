import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";
import { BoardViewConfig } from "./BoardViewConfig";

type Action = { type: "setAppId", payload: string }
    | { type: "setConfigId", payload: string }
    | { type: "setConfig", payload: BoardViewConfig }
    | { type: "setSelectedRecord", payload: Xrm.LookupValue }
    | { type: "setBoardData", payload: { [key: string]: Array<any> } };

export type Dispatch = (action: Action) => void;

export type AppStateProps = {
    appId?: string;
    configId?: string;
    config?: BoardViewConfig;
    selectedRecord?: { entityType: string, id: string, name?: string };
    boardData?: { [key: string]: Array<any> };
};

type AppContextProps = {
    children: React.ReactNode;
};

function stateReducer(state: AppStateProps, action: Action): AppStateProps {
    switch (action.type) {
        case "setAppId": {
            return { ...state, appId: action.payload };
        }
        case "setConfigId": {
            return { ...state, configId: action.payload };
        }
        case "setSelectedRecord": {
            return { ...state, selectedRecord: action.payload };
        }
        case "setBoardData": {
            return { ...state, boardData: action.payload };
        }
        case "setConfig": {
            return { ...state, config: action.payload };
        }
    }
}

export const AppState = React.createContext<AppStateProps | undefined>(undefined);
export const AppDispatch = React.createContext<Dispatch | undefined>(undefined);

export function AppStateProvider({ children }: AppContextProps) {
    const search = ParseSearch();

    const appId = search["appid"];

    const [state, dispatch] = React.useReducer(stateReducer, {
        appId
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