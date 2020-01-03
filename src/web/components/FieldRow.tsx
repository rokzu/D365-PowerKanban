import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card } from "react-bootstrap";
import { Tile } from "./Tile";
import { BoardLane } from "../domain/BoardLane";
import { CardCell } from "../domain/CardForm";

interface FieldRowProps {
    cells: Array<CardCell>;
    data: any;
    type: "header" | "footer" | "body";
}

export const FieldRow = (props: FieldRowProps) => {
    const [ appState, appDispatch ] = useAppContext();

    const getData = (fieldName: string) => {
        return props.data[`${fieldName}@OData.Community.Display.V1.FormattedValue`] ?? props.data[`_${fieldName}_value@OData.Community.Display.V1.FormattedValue`] ?? props.data[fieldName];
    };

    if (props.type === "header") {
        return (
            <div style={{ display: "flex", flexDirection: "row" }}>
                { props.cells.map(c => <div style={{marginLeft: "5px", marginRight: "5px"}}>{ getData(c.field) }</div>) }
            </div>
        );
    }

    if (props.type === "footer") {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                { props.cells.map(c => <div>{ getData(c.field) }</div>) }
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            { props.cells.map(c => <div>{ getData(c.field) }</div>) }
        </div>
    );
};