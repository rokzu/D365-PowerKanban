import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import { Tile } from "./Tile";

interface LaneProps {
    laneId: string;
}

export const Lane = (props: LaneProps) => {
    const [ appState, appDispatch ] = useAppContext();

    return (
        <div style={{ minWidth: "100px", margin: "5px", flex: "1 1 0" }}>
            <Card key={`lane_${props.laneId}`}>
                <Card.Body>
                    <Card.Title>{props.laneId}</Card.Title>
                    {appState.boardData[props.laneId].map(d => <Tile data={d} />)}
                </Card.Body>
            </Card>
        </div>
    );
};