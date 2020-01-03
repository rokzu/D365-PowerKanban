import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Card, Table, Row, Col } from "react-bootstrap";
import { FieldRow } from "./FieldRow";

interface TileProps {
    data: any;
}

export const Tile = (props: TileProps) => {
    const [ appState, appDispatch ] = useAppContext();

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecord", payload: { entityType: appState.config.entityName, id: props.data[appState.metadata?.PrimaryIdAttribute] } });
    };

    const cardForm = appState.selectedForm;

    return (
        <Card onClick={setSelectedRecord} style={{marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: "#3b79b7", borderLeftWidth: "3px"}}>
            <Card.Header>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666" }}>
                    { cardForm.parsed.header.rows.map(r => <div style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="header" data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Header>
            <Card.Body>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { cardForm.parsed.body.rows.map(r => <div style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="body" data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Body>
            <Card.Footer style={{ backgroundColor: "#efefef" }}>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { cardForm.parsed.footer.rows.map(r => <div style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="footer" data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Footer>
        </Card>
    );
};