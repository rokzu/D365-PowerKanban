import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import { Tile } from "./Tile";
import { BoardLane } from "../domain/BoardLane";
import { Metadata } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";

interface LaneProps {
    lane: BoardLane;
    metadata: Metadata;
    cardForm: CardForm;
    minWidth?: string;
}

export const Lane = (props: LaneProps) => {
    const borderColor = props.lane.option.Color ?? "#3b79b7";

    return (
        <div style={{ minWidth: props.minWidth ?? "400px", margin: "5px", flex: "1 1 0" }}>
            <Card style={{borderColor: "#d8d8d8", borderTopColor: borderColor, borderTopWidth: "3px", color: "#333333"}}>
                <Card.Body>
                    <Card.Title style={{color: "#045999"}}>{props.lane.option.Label.UserLocalizedLabel.Label}</Card.Title>
                    { props.lane.data.map(d => <Tile borderColor={borderColor} metadata={props.metadata} cardForm={props.cardForm} key={`tile_${d[props.metadata.PrimaryIdAttribute]}`} data={d} />) }
                </Card.Body>
            </Card>
        </div>
    );
};