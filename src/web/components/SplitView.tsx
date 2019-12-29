import React from "react";
import { Row, Col } from "react-bootstrap";
import { useAppContext } from "../domain/AppState";
import { Board } from "./Board";
import { SideBySideForm } from "./SideBySideForm";

interface SplitViewProps { }

export const SplitView = (props: SplitViewProps) => {
    const [appState, appDispatch] = useAppContext();

    return (
        <div style={{display: "flex", width: "100%", height: "100%"}}>
            <div style={appState.selectedRecord ? { minWidth: "600px", resize: "horizontal", overflow: "auto"} : { width: "100%" }}>
                <Board />
            </div>
            { !!appState.selectedRecord &&
            <div style={{minWidth: "400px", borderLeft: "1px solid", flex: 1 }}>
                <SideBySideForm />
            </div>
            }
        </div>
    );
};