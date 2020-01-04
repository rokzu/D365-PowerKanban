import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Col, Card, Button } from "react-bootstrap";
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

    const openRecord = (event: any) => {
        const [entity, id] = event.target.id.split("_");
        Xrm.Navigation.openForm({ entityName: entity, entityId: id, openInNewWindow: true });
    };

    const getData = (fieldName: string) => {
        const formattedValue = props.data[`${fieldName}@OData.Community.Display.V1.FormattedValue`];

        if (formattedValue) {
            return formattedValue;
        }

        const lookupFormatted = props.data[`_${fieldName}_value@OData.Community.Display.V1.FormattedValue`];

        if (lookupFormatted) {
            const targetEntity = props.data[`_${fieldName}_value@Microsoft.Dynamics.CRM.lookuplogicalname`];
            return (<Button style={{padding: "0px"}} id={`${targetEntity}_${props.data[`_${fieldName}_value`]}`} onClick={openRecord} variant="link">{lookupFormatted}</Button>);
        }

        return props.data[fieldName];
    };

    if (props.type === "header") {
        return (
            <div style={{ display: "flex", flexDirection: "row" }}>
                { props.cells.map((c, i) => <div title={appState.metadata.Attributes.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label} key={`cell_${props.data[appState.metadata.PrimaryIdAttribute]}_${c.field}`} style={{marginLeft: "5px", marginRight: "5px"}}>{ getData(c.field) }</div>) }
            </div>
        );
    }

    if (props.type === "footer") {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                { props.cells.map((c, i) => {
                    const data = getData(c.field);

                    // tslint:disable-next-line: no-null-keyword
                    if (data == null || data == "") {
                        return (<div key={`cell_${props.data[appState.metadata.PrimaryIdAttribute]}_${c.field}`}></div>);
                    }

                    return (<div key={`cell_${props.data[appState.metadata.PrimaryIdAttribute]}_${c.field}`}>{ data }<span style={{float: "right", color: "#666666"}}>{appState.metadata.Attributes.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label}</span></div>);
                 })
                }
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            { props.cells.map((c, i) => <div key={`cell_${props.data[appState.metadata.PrimaryIdAttribute]}_${c.field}`}>{ getData(c.field) }</div>) }
        </div>
    );
};