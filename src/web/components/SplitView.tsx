import React from "react";
import { Row, Col } from "react-bootstrap";
import { useAppContext } from "../domain/AppState";
import { Board } from "./Board";
import { SideBySideForm } from "./SideBySideForm";

interface SplitViewProps { }

export const SplitView = (props: SplitViewProps) => {
    const [appState, appDispatch] = useAppContext();

    return (
        <Row>
            <Col xs={!!appState.selectedRecord ? 9 : 12}>
            <Board appState={appState} appDispatch={appDispatch} />
            </Col>
            { !!appState.selectedRecord &&
            <Col xs={3}>
                <SideBySideForm />
            </Col>
            }
        </Row>
    );
};