import React, { useContext, useEffect, useState, useRef } from "react";
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
import { List, CellMeasurerCache, CellMeasurer } from "react-virtualized";
import AutoSizer from "react-virtualized-auto-sizer";
import { useMeasurerState } from "../domain/MeasurerState";

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

    const listRef = useRef<List>(undefined);
    const measurerState = useMeasurerState();
    const borderColor = props.lane.option.Color ?? "#3b79b7";

    useEffect(() => void listRef && listRef.current && listRef.current.recomputeRowHeights(), [ measurerState.measurementCaches[props.lane.option.Value.toString()] ]);

    const isActive = canDrop && isOver;
    let style: React.CSSProperties = {
      height: "100%"
    };

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

    const rowRenderer = ({key, index, parent, isScrolling, isVisible, style}: {
      key: string;
      index: number;
      parent: any;
      isScrolling: boolean;
      isVisible: boolean;
      style: React.CSSProperties
    }) => (
      <CellMeasurer
          cache={measurerState.measurementCaches[`${props.isSecondaryLane ? "secondary" : "primary"}-${props.lane.option.Value.toString()}`]}
          columnIndex={0}
          key={key}
          parent={parent}
          rowIndex={index}
      >
        <div style={style}>
          { mapDataToTile(props.lane.data[index]) }
        </div>
      </CellMeasurer>
    );

    return (
        <div ref={drop} style={{ ...style, minWidth: props.minWidth ?? "400px", margin: "5px", flex: "1" }}>
            <Card style={{borderColor: "#d8d8d8", height: props.isSecondaryLane ? "600px" : "100%", borderTopColor: borderColor, borderTopWidth: "3px", color: "#333333"}}>
                <Card.Header>
                  <Card.Title style={{color: "#045999"}}>{props.lane.option.Label.UserLocalizedLabel.Label}</Card.Title>
                </Card.Header>
                <Card.Body>
                    {
                      props.cardForm &&
                      <AutoSizer>
                        {
                          ({ height, width }) =>
                            <List
                              ref={listRef}
                              className="List"
                              height={height}
                              rowCount={props.lane.data.length}
                              width={width}
                              rowRenderer={rowRenderer}
                              rowHeight={measurerState.measurementCaches[`${props.isSecondaryLane ? "secondary" : "primary"}-${props.lane.option.Value.toString()}`].rowHeight}
                              deferredMeasurementCache={measurerState.measurementCaches[`${props.isSecondaryLane ? "secondary" : "primary"}-${props.lane.option.Value.toString()}`]}
                            >
                            </List>
                        }
                      </AutoSizer>
                    }
                </Card.Body>
            </Card>
        </div>
    );
};

export const Lane = React.memo(LaneRender);