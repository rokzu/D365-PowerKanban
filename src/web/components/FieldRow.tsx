import * as React from "react";
import { Col, Card, Button } from "react-bootstrap";
import { CardCell } from "../domain/CardForm";
import { Metadata } from "../domain/Metadata";
import { RegexEscape } from "../domain/RegexEscape";

interface FieldRowProps {
    cells: Array<CardCell>;
    data: any;
    type: "header" | "footer" | "body";
    metadata: Metadata;
    searchString?: string;
}

const FieldRowRender = (props: FieldRowProps) => {
    const openRecord = (event: any) => {
        const [entity, id] = event.target.id.split("_");
        Xrm.Navigation.openForm({ entityName: entity, entityId: id, openInNewWindow: true });
    };

    const highlightSearch = (text: string) => {
        if (!props.searchString || !text) {
            return text;
        }

        const substrings = text.toString().split(new RegExp(`(${RegexEscape(props.searchString)})`, "gi"));
        return (<span>
            {
                substrings.map((s, i) => (<span key={i} style={s.toLowerCase() === props.searchString.toLowerCase() ? { backgroundColor: "yellow" } : {}}>{s}</span>))
            }
        </span>);
    };

    const getData = (fieldName: string): React.ReactNode => {
        const formattedValue = props.data[`${fieldName}@OData.Community.Display.V1.FormattedValue`];

        if (formattedValue) {
            return highlightSearch(formattedValue);
        }

        const lookupFormatted = props.data[`_${fieldName}_value@OData.Community.Display.V1.FormattedValue`];

        if (lookupFormatted) {
            const targetEntity = props.data[`_${fieldName}_value@Microsoft.Dynamics.CRM.lookuplogicalname`];
            return (<Button style={{padding: "0px"}} id={`${targetEntity}_${props.data[`_${fieldName}_value`]}`} onClick={openRecord} variant="link">{highlightSearch(lookupFormatted)}</Button>);
        }

        return highlightSearch(props.data[fieldName]);
    };

    // tslint:disable-next-line: no-null-keyword
    const rows: Array<[CardCell, React.ReactNode]> = props.cells.map(c => [c, getData(c.field)] as [CardCell, React.ReactNode]).filter(([c, data]) => data != null && data != "");

    if (props.type === "header") {
        return (
            <div style={{ display: "flex", flexDirection: "row" }}>
                { rows.map(([c, data], i) => <div title={props.metadata.Attributes.find(a => a.LogicalName === c.field)?.DisplayName.UserLocalizedLabel.Label} key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`} style={{marginLeft: i === 0 ? "0px" : "5px", marginRight: i === rows.length - 1 ? "0px" : "5px"}}>{ data }</div>) }
            </div>
        );
    }

    if (props.type === "footer") {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                { rows.map(([c, data], i) => {
                    return (<div key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`}>{ data }<span style={{float: "right", color: "#666666"}}>{props.metadata.Attributes?.find(a => a.LogicalName === c.field).DisplayName.UserLocalizedLabel.Label}</span></div>);
                 })
                }
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            { rows.map(([c, data], i) => <div title={props.metadata.Attributes.find(a => a.LogicalName === c.field)?.DisplayName.UserLocalizedLabel.Label} key={`cell_${props.data[props.metadata.PrimaryIdAttribute]}_${c.field}`}>{ data }</div>) }
        </div>
    );
};

export const FieldRow = React.memo(FieldRowRender);