import React from "react";
import { Modal, ProgressBar } from "react-bootstrap";
import { useAppContext, DisplayType } from "../domain/AppState";
import { Board } from "./Board";
import { SideBySideForm } from "./SideBySideForm";
import { NotificationList } from "./NotificationList";
import { UserInputModal } from "./UserInputModalProps";
import { ExternalForm } from "./ExternalForm";

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
        { appState.flyOutForm && <ExternalForm /> }
        <div style={{display: "flex", width: "100%", height: "100%", backgroundColor: "#efefef", paddingTop: "50px"}}>
            <div style={appState.selectedRecord ? { minWidth: "600px", resize: "horizontal", overflow: "auto"} : { width: "100%" }}>
                <Board />
            </div>
            { !!appState.selectedRecord && appState.selectedRecordDisplayType === DisplayType.recordForm &&
                <div style={{minWidth: "400px", borderLeft: "1px solid", flex: "1 1 0" }}>
                    <SideBySideForm />
                </div>
            }
            { !!appState.selectedRecord && appState.selectedRecordDisplayType === DisplayType.notifications &&
                <div style={{minWidth: "400px", borderLeft: "1px solid", flex: "1 1 0" }}>
                    <NotificationList />
                </div>
            }
        </div>
        </>
    );
};