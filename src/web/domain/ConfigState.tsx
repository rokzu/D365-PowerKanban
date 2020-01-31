import React, { useContext } from "react";
import { ParseSearch } from "./ParseSearch";
import { BoardViewConfig } from "./BoardViewConfig";
import { Metadata, Attribute } from "./Metadata";
import { CardForm } from "./CardForm";

type Action = { type: "setAppId", payload: string }
    | { type: "setConfigId", payload: string }
    | { type: "setConfig", payload: BoardViewConfig }
    | { type: "setMetadata", payload: Metadata }
    | { type: "setSeparatorMetadata", payload: Attribute }
    | { type: "setSecondaryMetadata", payload: { entity: string; data: Metadata } }
    | { type: "setSecondarySeparatorMetadata", payload: Attribute }
    | { type: "setStateMetadata", payload: Attribute }
    | { type: "setNotificationForm", payload: CardForm };

export type ConfigDispatch = (action: Action) => void;

export type ConfigStateProps = {
    appId?: string;
    configId?: string;
    config?: BoardViewConfig;
    metadata?: Metadata;
    secondaryMetadata?: {[key: string]: Metadata};
    notificationForm?: CardForm;
    separatorMetadata?: Attribute;
    secondarySeparatorMetadata?: Attribute;
    stateMetadata?: Attribute;
};

const parseStateTransitions = (transitionXml: string): Array<{ source: number; to: number }> => {
    if (!transitionXml) {
        return undefined;
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(transitionXml, "application/xml");
    return Array.from(xml.documentElement.getElementsByTagName("allowedtransition")).map(t => ({ source: parseInt(t.getAttribute("sourcestatusid")), to: parseInt(t.getAttribute("tostatusid"))} ));
};

function stateReducer(state: ConfigStateProps, action: Action): ConfigStateProps {
    switch (action.type) {
        case "setAppId": {
            return { ...state, appId: action.payload };
        }
        case "setConfigId": {
            return { ...state, configId: action.payload };
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
            return { ...state, secondaryMetadata: {...state.secondaryMetadata, [action.payload.entity]: action.payload.data } };
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
        case "setNotificationForm": {
            return { ...state, notificationForm: action.payload };
        }
    }
}

const ConfigState = React.createContext<ConfigStateProps | undefined>(undefined);
const ConfigDispatch = React.createContext<ConfigDispatch | undefined>(undefined);

export const ConfigStateProvider: React.FC = ({ children }) => {
    const search = ParseSearch();

    const appId = search["appid"];

    const [state, dispatch] = React.useReducer(stateReducer, {
        appId
    });

    return (
        <ConfigState.Provider value={state}>
            <ConfigDispatch.Provider value={dispatch}>
                {children}
            </ConfigDispatch.Provider>
        </ConfigState.Provider>
    );
};

export const useConfigState = () => {
    const context = useContext(ConfigState);

    if (!context) {
        throw new Error("useConfigState must be used within a state provider!");
    }

    return context;
};

export const useConfigDispatch = () => {
    const context = useContext(ConfigDispatch);

    if (!context) {
        throw new Error("useConfigDispatch must be used within a state provider!");
    }

    return context;
};

export const useConfigContext = (): [ ConfigStateProps, ConfigDispatch ] => {
    return [ useConfigState(), useConfigDispatch() ];
};