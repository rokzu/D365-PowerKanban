import React, { useContext, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Card } from "react-bootstrap";

interface TileProps {
    data: any;
}

export const Tile = (props: TileProps) => {
    const [ appState, appDispatch ] = useAppContext();

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecord", payload: { entityType: appState.config.entityName, id: props.data[`${appState.config.entityName}id`] } });
    };

    return (
        <Card onClick={setSelectedRecord} style={{marginBottom: "5px"}}>
            <Card.Body>
                {props.data.createdon}
            </Card.Body>
        </Card>
    );
};