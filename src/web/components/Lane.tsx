import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import Tile from "./Tile";
import { BoardLane } from "../domain/BoardLane";
import { Metadata } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { ConnectDropTarget, DropTarget, DropTargetConnector, DropTargetMonitor } from "react-dnd";
import { ItemTypes } from "../domain/ItemTypes";

interface LaneProps {
    lane: BoardLane;
    metadata: Metadata;
    cardForm: CardForm;
    minWidth?: string;

    canDrop: boolean;
    isOver: boolean;
    connectDropTarget: ConnectDropTarget;
}

const Lane: React.FC<LaneProps> = (props: LaneProps) => {
    const borderColor = props.lane.option.Color ?? "#3b79b7";

    const isActive = props.canDrop && props.isOver;
    let backgroundColor = "#efefef";

    if (isActive) {
      backgroundColor = "darkgreen";
    } else if (props.canDrop) {
      backgroundColor = "darkkhaki";
    }

    return (
        <div ref={props.connectDropTarget} style={{ backgroundColor, minWidth: props.minWidth ?? "400px", margin: "5px", flex: "1 1 0" }}>
            <Card style={{borderColor: "#d8d8d8", borderTopColor: borderColor, borderTopWidth: "3px", color: "#333333"}}>
                <Card.Body>
                    <Card.Title style={{color: "#045999"}}>{props.lane.option.Label.UserLocalizedLabel.Label}</Card.Title>
                    { props.lane.data.map(d => <Tile borderColor={borderColor} metadata={props.metadata} cardForm={props.cardForm} key={`tile_${d[props.metadata.PrimaryIdAttribute]}`} data={d} />) }
                </Card.Body>
            </Card>
        </div>
    );
};

export default DropTarget(
    ItemTypes.Tile,
    {
      drop: () => ({ }),
    },
    (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  )(Lane);