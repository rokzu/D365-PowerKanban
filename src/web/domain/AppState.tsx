import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";
import { BoardViewConfig } from "./BoardViewConfig";
import { Metadata, Attribute } from "../domain/Metadata";
import { BoardLane } from "./BoardLane";
import { SavedQuery } from "./SavedQuery";
import { CardForm } from "./CardForm";
import { Subscription } from "./Subscription";
import { Notification } from "./Notification";

export enum DisplayType {
    recordForm,
    notifications
}

type Action = { type: "setAppId", payload: string }
    | { type: "setConfigId", payload: string }
    | { type: "setConfig", payload: BoardViewConfig }
    | { type: "setSelectedRecord", payload: Xrm.LookupValue }
    | { type: "setBoardData", payload: Array<BoardLane> }
    | { type: "setSecondaryData", payload: Array<any> }
    | { type: "setMetadata", payload: Metadata }
    | { type: "setSeparatorMetadata", payload: Attribute }
    | { type: "setSecondaryMetadata", payload: Metadata }
    | { type: "setSecondarySeparatorMetadata", payload: Attribute }
    | { type: "setStateMetadata", payload: Attribute }
    | { type: "setSelectedView", payload: SavedQuery }
    | { type: "setSelectedForm", payload: CardForm }
    | { type: "setSelectedSecondaryView", payload: SavedQuery }
    | { type: "setSelectedSecondaryForm", payload: CardForm }
    | { type: "setProgressText", payload: string }
    | { type: "setSubscriptions", payload: Array<Subscription>}
    | { type: "setNotifications", payload: Array<Notification>}
    | { type: "setWorkIndicator", payload: boolean}
    | { type: "setSelectedRecordDisplayType", payload: DisplayType }
    | { type: "setFlyOutForm", payload: any };

export type Dispatch = (action: Action) => void;

export type AppStateProps = {
    appId?: string;
    configId?: string;
    progressText?: string;
    config?: BoardViewConfig;
    metadata?: Metadata;
    secondaryMetadata?: Metadata;
    selectedView?: SavedQuery;
    selectedForm?: CardForm;
    selectedViewData?: { columns: Array<string>; linkEntities: Array<{ entityName: string, alias: string }> }
    selectedSecondaryView?: SavedQuery;
    selectedSecondaryForm?: CardForm;
    selectedSecondaryViewData?: { columns: Array<string>; linkEntities: Array<{ entityName: string, alias: string }> }
    separatorMetadata?: Attribute;
    secondarySeparatorMetadata?: Attribute;
    stateMetadata?: Attribute;
    selectedRecord?: { entityType: string, id: string, name?: string };
    boardData?: Array<BoardLane>;
    secondaryData?: Array<BoardLane>;
    subscriptions?: Array<Subscription>;
    notifications?: Array<Notification>;
    workIndicator?: boolean;
    selectedRecordDisplayType?: DisplayType;
    flyOutForm?: any;
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

const parseStateTransitions = (transitionXml: string): Array<{ source: number; to: number }> => {
    if (!transitionXml) {
        return undefined;
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(transitionXml, "application/xml");
    return Array.from(xml.documentElement.getElementsByTagName("allowedtransition")).map(t => ({ source: parseInt(t.getAttribute("sourcestatusid")), to: parseInt(t.getAttribute("tostatusid"))} ));
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
            if (action.payload?.OptionSet?.Options) {
                action.payload.OptionSet.Options = action.payload.OptionSet.Options.map(o => ({...o, _parsedTransitionData: parseStateTransitions(o.TransitionData)}));
            }
            return { ...state, separatorMetadata: action.payload };
        }
        case "setSecondaryMetadata": {
            return { ...state, secondaryMetadata: action.payload };
        }
        case "setSecondarySeparatorMetadata": {
            if (action.payload?.OptionSet?.Options) {
                action.payload.OptionSet.Options = action.payload.OptionSet.Options.map(o => ({...o, _parsedTransitionData: parseStateTransitions(o.TransitionData)}));
            }

            return { ...state, secondarySeparatorMetadata: action.payload };
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
        case "setSelectedSecondaryView": {
            return { ...state, selectedSecondaryView: action.payload, selectedSecondaryViewData: { columns: parseLayoutColumns(action.payload.layoutxml), linkEntities: parseLinksFromFetch(action.payload.fetchxml) } };
        }
        case "setSelectedSecondaryForm": {
            return { ...state, selectedSecondaryForm: action.payload };
        }
        case "setProgressText": {
            return { ...state, progressText: action.payload };
        }
        case "setSecondaryData": {
            return { ...state, secondaryData: action.payload };
        }
        case "setSubscriptions": {
            return { ...state, subscriptions: action.payload };
        }
        case "setNotifications": {
            return { ...state, notifications: action.payload };
        }
        case "setWorkIndicator": {
            return { ...state, workIndicator: action.payload };
        }
        case "setSelectedRecordDisplayType": {
            return { ...state, selectedRecordDisplayType: action.payload };
        }
        case "setFlyOutForm": {
            return { ...state, flyOutForm: action.payload };
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