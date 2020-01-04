import React, { useContext, useEffect, useState } from "react";
import { useAppContext, useAppDispatch } from "../domain/AppState";
import { Card, Table, Row, Col } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { BoardLane } from "../domain/BoardLane";
import { Lane } from "./Lane";

interface TileProps {
    data: any;
    metadata: Metadata;
    cardForm: CardForm;
    secondaryData?: Array<BoardLane>;
    style?: React.CSSProperties;
}

export const Tile = (props: TileProps) => {
    const [appState, appDispatch] = useAppContext();

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    return (
        <Card onClick={setSelectedRecord} style={{marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: "#3b79b7", borderLeftWidth: "3px", ...props.style}}>
            <Card.Header>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666" }}>
                    { props.cardForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="header" data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Header>
            <Card.Body>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { props.cardForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="body" data={props.data} cells={r.cells} /></div>) }
                </div>
                { props.secondaryData &&
                    <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "inherit" }}>
                        { props.secondaryData.map(d => <Lane key={`lane_${d.option?.Value ?? "fallback"}`} cardForm={appState.selectedSecondaryForm} metadata={appState.secondaryMetadata} lane={d} />) }
                    </div>
                }
            </Card.Body>
            <Card.Footer style={{ backgroundColor: "#efefef" }}>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { props.cardForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="footer" data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Footer>
        </Card>
    );
};