import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Card, Table, Row, Col } from "react-bootstrap";

interface TileProps {
    data: any;
}

export const Tile = (props: TileProps) => {
    const [ appState, appDispatch ] = useAppContext();

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecord", payload: { entityType: appState.config.entityName, id: props.data[appState.metadata?.PrimaryIdAttribute] } });
    };

    const view = appState.selectedView;

    return (
        <Card onClick={setSelectedRecord} style={{marginBottom: "5px"}}>
            <Card.Body>
                { appState.selectedViewData?.columns.map(c =>
                    <div key={`${props.data[appState.metadata?.PrimaryIdAttribute]}_${c}_header`}>
                        <h4>{appState.metadata.Attributes.find(a => a.LogicalName === c)?.DisplayName.UserLocalizedLabel.Label}</h4>
                        <span>{props.data[`${c}@OData.Community.Display.V1.FormattedValue`] ?? props.data[`_${c}_value@OData.Community.Display.V1.FormattedValue`] ?? props.data[c]}</span>
                        <br />
                    </div>)
                }
            </Card.Body>
        </Card>
    );
};