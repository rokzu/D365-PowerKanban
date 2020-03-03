import React, { useContext } from "react";
import { CellMeasurerCache } from "react-virtualized";

type Action = { type: "resetMeasurementCache" }
| { type: "initializeCaches", payload: Array<string> };

export type MeasurerStateDispatch = (action: Action) => void;

export type MeasurerStateProps = {
    measurementCaches: { [key: string]: CellMeasurerCache };
};

type MeasurerContextProps = {
    children: React.ReactNode;
};

const defaultOptions = {
    defaultHeight: 400,
    minHeight: 50,
    fixedWidth: true
};

function stateReducer(state: MeasurerStateProps, action: Action): MeasurerStateProps {
    switch (action.type) {
        case "resetMeasurementCache": {
            return {...state, measurementCaches: Object.keys(state.measurementCaches).reduce((all, cur) => { all[cur] = new CellMeasurerCache(defaultOptions); return all; }, {} as { [key: string]: CellMeasurerCache })};
        }
        case "initializeCaches": {
            return {...state, measurementCaches: action.payload.reduce((all, cur) => { all[cur] = new CellMeasurerCache(defaultOptions); return all; }, {} as { [key: string]: CellMeasurerCache })};
        }
    }
}

const MeasurerState = React.createContext<MeasurerStateProps | undefined>(undefined);
const MeasurerDispatch = React.createContext<MeasurerStateDispatch | undefined>(undefined);

export function MeasurerStateProvider({ children }: MeasurerContextProps) {
    const [state, dispatch] = React.useReducer(stateReducer, { measurementCaches: {} });

    return (
        <MeasurerState.Provider value={state}>
            <MeasurerDispatch.Provider value={dispatch}>
                {children}
            </MeasurerDispatch.Provider>
        </MeasurerState.Provider>
    );
}

export function useMeasurerState() {
    const context = useContext(MeasurerState);

    if (!context) {
        throw new Error("useMeasurerState must be used within a state provider!");
    }

    return context;
}

export function useMeasurerDispatch() {
    const context = useContext(MeasurerDispatch);

    if (!context) {
        throw new Error("useAppDispatch must be used within a state provider!");
    }

    return context;
}

export function useMeasurerContext(): [ MeasurerStateProps, MeasurerStateDispatch ] {
    return [ useMeasurerState(), useMeasurerDispatch() ];
}