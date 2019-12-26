import React, { useContext } from "react";
import { Row, Col } from "react-bootstrap";
import { useAppState } from "../domain/AppState";
import { Board } from "./Board";
import { SideBySideForm } from "./SideBySideForm";

interface SplitViewProps { }

export const SplitView = (props: SplitViewProps) => {
    const appState = useAppState();

    return (
        <Row>
            <Col xs={appState.secondaryVisible ? 9 : 12}>
            <Board />
            </Col>
            { appState.secondaryVisible &&
            <Col xs={3}>
                <SideBySideForm />
            </Col>
            }
        </Row>
    );
};