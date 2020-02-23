import React, { useContext, useEffect, useState, useRef } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import { Tile } from "./Tile";
import { BoardLane } from "../domain/BoardLane";
import { Metadata, Attribute } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../domain/ItemTypes";
import { Option } from "../domain/Metadata";
import { Notification } from "../domain/Notification";
import { BoardViewConfig, BoardEntity } from "../domain/BoardViewConfig";
import { Subscription } from "../domain/Subscription";

interface LaneProps {
    config: BoardEntity;
    cardForm: CardForm;
    dndType?: string;
    lane: BoardLane;
    metadata: Metadata;
    minWidth?: string;
    notifications: {[key: string]: Array<Notification>};
    refresh: () => Promise<void>;
    searchText: string;
    selectedSecondaryForm?: CardForm;
    separatorMetadata: Attribute;
    subscriptions: {[key: string]: Array<Subscription>};
    isSecondaryLane?: boolean;
}

const LaneRender = (props: LaneProps) => {
    const [{ canDrop, isOver }, drop] = useDrop({
      accept: props.dndType ?? ItemTypes.Tile,
      drop: () => ({ option: props.lane.option }),
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      canDrop: (item, monitor) => {
        const typedItem = item as unknown as { id: string; sourceLane: Option } | undefined;

        if (!typedItem.sourceLane._parsedTransitionData) {
          return true;
        }

        return typedItem.sourceLane._parsedTransitionData.some(p => p.to === props.lane.option.Value);
      }
    });

    const borderColor = props.lane.option.Color ?? "#3b79b7";

    const isActive = canDrop && isOver;
    let style: React.CSSProperties = { };

    if (isActive) {
      style = { borderWidth: "3px", borderStyle: "dashed", borderColor: "#02f01c" };
    } else if (canDrop) {
      style = { borderWidth: "3px", borderStyle: "dashed", borderColor: "#3b79b7" };
    }

    const mapDataToTile = ((d: any) => <Tile
      notifications={props.notifications[d[props.metadata.PrimaryIdAttribute]] ?? []}
      dndType={props.dndType}
      laneOption={props.lane.option}
      borderColor={borderColor}
      metadata={props.metadata}
      cardForm={props.cardForm}
      key={`tile_${d[props.metadata.PrimaryIdAttribute]}`}
      refresh={props.refresh}
      subscriptions={props.subscriptions[d[props.metadata.PrimaryIdAttribute]]}
      searchText={props.searchText}
      data={d}
      config={props.config}
      separatorMetadata={props.separatorMetadata} />
    );

    return (
        <div ref={drop} style={{ ...style, minWidth: props.minWidth ?? "400px", margin: "5px", flex: "1 1 0" }}>
            <Card style={{borderColor: "#d8d8d8", borderTopColor: borderColor, borderTopWidth: "3px", color: "#333333"}}>
                <Card.Body>
                    <Card.Title style={{color: "#045999"}}>{props.lane.option.Label.UserLocalizedLabel.Label}</Card.Title>
                    { props.cardForm && props.isSecondaryLane && props.lane.data.map(mapDataToTile) }
                    { props.cardForm && !props.isSecondaryLane && props.lane.data.map(mapDataToTile) }
                </Card.Body>
            </Card>
        </div>
    );
};

export const Lane = React.memo(LaneRender);