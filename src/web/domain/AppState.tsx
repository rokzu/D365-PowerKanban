import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";
import { BoardViewConfig } from "./BoardViewConfig";
import { Metadata, Attribute } from "../domain/Metadata";
import { BoardLane } from "./BoardLane";
import { SavedQuery } from "./SavedQuery";
import { CardForm } from "./CardForm";

type Action = { type: "setAppId", payload: string }
    | { type: "setConfigId", payload: string }
    | { type: "setConfig", payload: BoardViewConfig }
    | { type: "setSelectedRecord", payload: Xrm.LookupValue }
    | { type: "setBoardData", payload: Array<BoardLane> }
    | { type: "setTaskData", payload: Array<any> }
    | { type: "setMetadata", payload: Metadata }
    | { type: "setSeparatorMetadata", payload: Attribute }
    | { type: "setStateMetadata", payload: Attribute }
    | { type: "setSelectedView", payload: SavedQuery }
    | { type: "setSelectedForm", payload: CardForm }
    | { type: "setSelectedTaskView", payload: SavedQuery }
    | { type: "setSelectedTaskForm", payload: CardForm }
    | { type: "setProgressText", payload: string };

export type Dispatch = (action: Action) => void;

export type AppStateProps = {
    appId?: string;
    configId?: string;
    progressText?: string;
    config?: BoardViewConfig;
    metadata?: Metadata;
    selectedView?: SavedQuery;
    selectedForm?: CardForm;
    selectedViewData?: { columns: Array<string>; linkEntities: Array<{ entityName: string, alias: string }> }
    selectedTaskView?: SavedQuery;
    selectedTaskForm?: CardForm;
    selectedTaskViewData?: { columns: Array<string>; linkEntities: Array<{ entityName: string, alias: string }> }
    separatorMetadata?: Attribute;
    stateMetadata?: Attribute;
    selectedRecord?: { entityType: string, id: string, name?: string };
    boardData?: Array<BoardLane>;
    taskData?: Array<any>;
};

type AppContextProps = {
    children: React.ReactNode;
};

const parseLayoutColumns = (layoutXml: string): Array<string> => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(layoutXml, "application/xml");
    return Array.from(xml.documentElement.getElementsByTagName("cell")).map(c => c.getAttribute("name"));
};

const parseLinksFromFetch = (fetchXml: string): Array<{ entityName: string, alias: string }> => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(fetchXml, "application/xml");
    return Array.from(xml.documentElement.getElementsByTagName("link-entity")).map(c => ({ entityName: c.getAttribute("name"), alias: c.getAttribute("alias")}));
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
        case "setMetadata": {
            return { ...state, metadata: action.payload };
        }
        case "setSeparatorMetadata": {
            return { ...state, separatorMetadata: action.payload };
        }
        case "setStateMetadata": {
            return { ...state, stateMetadata: action.payload };
        }
        case "setSelectedView": {
            return { ...state, selectedView: action.payload, selectedViewData: { columns: parseLayoutColumns(action.payload.layoutxml), linkEntities: parseLinksFromFetch(action.payload.fetchxml) } };
        }
        case "setSelectedForm": {
            return { ...state, selectedForm: action.payload };
        }
        case "setSelectedTaskView": {
            return { ...state, selectedTaskView: action.payload, selectedTaskViewData: { columns: parseLayoutColumns(action.payload.layoutxml), linkEntities: parseLinksFromFetch(action.payload.fetchxml) } };
        }
        case "setSelectedTaskForm": {
            return { ...state, selectedTaskForm: action.payload };
        }
        case "setProgressText": {
            return { ...state, progressText: action.payload };
        }
        case "setTaskData": {
            return { ...state, taskData: action.payload };
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