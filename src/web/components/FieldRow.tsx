import React, { useContext, useEffect, useState } from "react";
import { Col, Card, Button } from "react-bootstrap";
import { CardCell } from "../domain/CardForm";
import { Metadata } from "../domain/Metadata";

interface FieldRowProps {
    cells: Array<CardCell>;
    data: any;
    type: "header" | "footer" | "body";
    metadata: Metadata;
}

export const FieldRow = (props: FieldRowProps) => {
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

    // tslint:disable-next-line: no-null-keyword
    const rows = props.cells.map(c => [c, getData(c.field)]).filter(([c, data]) => data != null && data != "");

    if (props.type === "header") {
        return (
            <div style={{ display: "flex", flexDirection: "row" }}>
                { rows.map(([c, data], i) => <div title={props.metadata.Attributes.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label} key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`} style={{marginLeft: "5px", marginRight: "5px"}}>{ data }</div>) }
            </div>
        );
    }

    if (props.type === "footer") {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                { rows.map(([c, data], i) => {
                    return (<div key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`}>{ data }<span style={{float: "right", color: "#666666"}}>{props.metadata.Attributes.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label}</span></div>);
                 })
                }
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            { rows.map(([c, data], i) => <div title={props.metadata.Attributes.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label} key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`}>{ data }</div>) }
        </div>
    );
};