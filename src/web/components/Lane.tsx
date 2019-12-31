import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import { Tile } from "./Tile";
import { BoardLane } from "../domain/BoardLane";

interface LaneProps {
    lane: BoardLane;
}

export const Lane = (props: LaneProps) => {
    const [ appState, appDispatch ] = useAppContext();

    return (
        <div style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}>
            <Card style={{borderColor: "#d8d8d8", borderTopColor: "#3b79b7", borderTopWidth: "3px"}}>
                <Card.Body>
                    <Card.Title>{props.lane.option.Label.UserLocalizedLabel.Label}</Card.Title>
                    { props.lane.data.map(d => <Tile key={`tile_${d[appState.metadata.PrimaryIdAttribute]}`} data={d} />) }
                </Card.Body>
            </Card>
        </div>
    );
};