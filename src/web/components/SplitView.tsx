import React from "react";
import { Modal, ProgressBar } from "react-bootstrap";
import { useAppContext } from "../domain/AppState";
import { Board } from "./Board";
import { SideBySideForm } from "./SideBySideForm";

interface SplitViewProps { }

export const SplitView = (props: SplitViewProps) => {
    const [appState, appDispatch] = useAppContext();

    return (<>
        <Modal show={!!appState.progressText} size="lg">
            <Modal.Header>
                <Modal.Title>Loading...</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div>
                    <div style={{textAlign: "center", width: "100%", fontSize: "large"}}>{appState.progressText}</div>
                    <br />
                    <ProgressBar animated now={100} />
                </div>
            </Modal.Body>
        </Modal>
        <div style={{display: "flex", width: "100%", height: "100%"}}>
            <div style={appState.selectedRecord ? { minWidth: "600px", resize: "horizontal", overflow: "auto"} : { width: "100%" }}>
                <Board />
            </div>
            { !!appState.selectedRecord &&
            <div style={{minWidth: "400px", borderLeft: "1px solid", flex: "1 1 0" }}>
                <SideBySideForm />
            </div>
            }
        </div>
        </>
    );
};