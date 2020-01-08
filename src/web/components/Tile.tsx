import React, { useContext, useEffect, useState } from "react";
import { useAppContext, useAppDispatch } from "../domain/AppState";
import { Card, Table, Row, Col, DropdownButton, Dropdown, Button } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { BoardLane } from "../domain/BoardLane";
import Lane from "./Lane";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ConnectDragSource, DragSourceMonitor, DragSource, DragSourceConnector } from "react-dnd";
import { ItemTypes } from "../domain/ItemTypes";
import { DndContainer } from "./DndContainer";

interface TileProps {
    data: any;
    metadata: Metadata;
    cardForm: CardForm;
    secondaryData?: Array<BoardLane>;
    borderColor: string;
    style?: React.CSSProperties;

    isDragging: boolean;
    connectDragSource: ConnectDragSource;
}

const Tile: React.FC<TileProps> = (props: TileProps) => {
    const [appState, appDispatch] = useAppContext();
    const opacity = props.isDragging ? 0.4 : 1;

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    const openInNewTab = () => {
        Xrm.Navigation.openForm({ entityName: props.metadata.LogicalName, entityId: props.data[props.metadata?.PrimaryIdAttribute], openInNewWindow: true });
    };

    return (
        <div ref={props.connectDragSource}>
            <Card style={{opacity, marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: props.borderColor, borderLeftWidth: "3px", ...props.style}}>
                <Card.Header>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666", marginRight: "65px" }}>
                        { props.cardForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ margin: "5px", flex: "1 1 0" }}><FieldRow type="header" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    <Button variant="outline-secondary" style={{float: "right", position: "absolute", top: "5px", right: "40px"}}><FontAwesomeIcon icon="bell" /></Button>
                    <DropdownButton id="displaySelector" variant="outline-secondary" title="" style={{ float: "right", position: "absolute", "top": "5px", right: "5px"}}>
                        <Dropdown.Item onClick={setSelectedRecord} as="button" id="setSelected"><FontAwesomeIcon icon="angle-double-right" /> Open in split screen</Dropdown.Item>
                        <Dropdown.Item onClick={openInNewTab} as="button" id="setSelected"><FontAwesomeIcon icon="window-maximize" /> Open in new window</Dropdown.Item>
                    </DropdownButton>
                </Card.Header>
                <Card.Body>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="body" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    { props.secondaryData &&
                        <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "auto" }}>
                            { props.secondaryData.map(d => <Lane key={`lane_${d.option?.Value ?? "fallback"}`} minWidth="300px" cardForm={appState.selectedSecondaryForm} metadata={appState.secondaryMetadata} lane={d} />) }
                        </div>
                    }
                </Card.Body>
                <Card.Footer style={{ backgroundColor: "#efefef" }}>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="footer" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                </Card.Footer>
            </Card>
        </div>
    );
};

export default DragSource(
    ItemTypes.Tile,
    {
        beginDrag: (props: TileProps) => ({ }),
        endDrag(props: TileProps, monitor: DragSourceMonitor) {
        const item = monitor.getItem();
        const dropResult = monitor.getDropResult();

        if (dropResult) {
            alert(`You dropped ${item.name} into ${dropResult.name}!`);
        }
    },
},
(connect: DragSourceConnector, monitor: DragSourceMonitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}),
)(Tile);