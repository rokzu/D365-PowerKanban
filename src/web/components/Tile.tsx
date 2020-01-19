import React, { useContext, useEffect, useState } from "react";
import { useAppContext, useAppDispatch, AppStateProps, Dispatch, DisplayType } from "../domain/AppState";
import { Card, Table, Row, Col, DropdownButton, Dropdown, Button, ButtonGroup } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata, Option } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { BoardLane } from "../domain/BoardLane";
import { Lane } from "./Lane";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ItemTypes } from "../domain/ItemTypes";
import { refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import WebApiClient from "xrm-webapi-client";
import { useDrag, DragSourceMonitor } from "react-dnd";

interface TileProps {
    data: any;
    metadata: Metadata;
    cardForm: CardForm;
    secondaryData?: Array<BoardLane>;
    borderColor: string;
    style?: React.CSSProperties;
    laneOption?: Option;
    dndType?: string;
}

export const Tile = (props: TileProps) => {
    const [appState, appDispatch] = useAppContext();
    const [{ isDragging }, drag] = useDrag({
        item: { id: props.data[props.metadata.PrimaryIdAttribute], sourceLane: props.laneOption, type: props.dndType ?? ItemTypes.Tile },
        end: (item: { id: string; sourceLane: Option } | undefined, monitor: DragSourceMonitor) => {
            const dropResult = monitor.getDropResult();

            if (!dropResult || !dropResult?.option?.Value || dropResult.option.Value === item.sourceLane.Value) {
                return;
            }

            appDispatch({ type: "setWorkIndicator", payload: true });
            const itemId = item.id;
            const targetOption = dropResult.option as Option;
            const update: any = { [appState.separatorMetadata.LogicalName]: targetOption.Value };

            if (appState.separatorMetadata.LogicalName === "statuscode") {
                update["statecode"] = targetOption.State;
            }

            WebApiClient.Update({ entityName: props.metadata.LogicalName, entityId: itemId, entity: update })
            .then((r: any) => {
                appDispatch({ type: "setWorkIndicator", payload: false });
                return refresh(appDispatch, appState);
            });
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        })
    });

    const opacity = isDragging ? 0.4 : 1;

    const setSelectedRecord = () => {
        appDispatch({ type: "setSelectedRecordDisplayType", payload: DisplayType.recordForm });
        appDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    const showNotifications = () => {
        appDispatch({ type: "setSelectedRecordDisplayType", payload: DisplayType.notifications });
        appDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    const openInNewTab = () => {
        Xrm.Navigation.openForm({ entityName: props.metadata.LogicalName, entityId: props.data[props.metadata?.PrimaryIdAttribute], openInNewWindow: true });
    };

    const createNewSecondary = async () => {
        const parentLookup = appState.config.secondaryEntity.parentLookup;
        const data = {
            [parentLookup]: props.data[props.metadata.PrimaryIdAttribute],
            [`${parentLookup}type`]: props.metadata.LogicalName,
            [`${parentLookup}name`]: props.data[props.metadata.PrimaryNameAttribute]
        };

        const result = await Xrm.Navigation.openForm({ entityName: appState.secondaryMetadata.LogicalName, useQuickCreateForm: true }, data);

        if (result && result.savedEntityReference) {
            refresh(appDispatch, appState);
        }
    };

    const subscribe = async () => {
        appDispatch({ type: "setWorkIndicator", payload: true });

        await WebApiClient.Create({
            entityName: "oss_subscription",
            entity: {
                [`oss_${props.metadata.LogicalName}id@odata.bind`]: `/${props.metadata.LogicalCollectionName}(${props.data[props.metadata.PrimaryIdAttribute].replace("{", "").replace("}", "")})`
            }
        });

        const subscriptions = await fetchSubscriptions();
        appDispatch({ type: "setSubscriptions", payload: subscriptions });
        appDispatch({ type: "setWorkIndicator", payload: false });
    };

    const unsubscribe = async () => {
        appDispatch({ type: "setWorkIndicator", payload: true });
        const subscriptionsToDelete = appState.subscriptions.filter(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]);

        await Promise.all(subscriptionsToDelete.map(s =>
            WebApiClient.Delete({
                entityName: "oss_subscription",
                entityId: s.oss_subscriptionid
            })
        ));

        const subscriptions = await fetchSubscriptions();
        appDispatch({ type: "setSubscriptions", payload: subscriptions });
        appDispatch({ type: "setWorkIndicator", payload: false });
    };

    const clearNotifications = async () => {
        appDispatch({ type: "setWorkIndicator", payload: true });
        const notificationsToDelete = appState.notifications.filter(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]);

        await Promise.all(notificationsToDelete.map(s =>
            WebApiClient.Delete({
                entityName: "oss_notification",
                entityId: s.oss_notificationid
            })
        ));

        const notifications = await fetchNotifications();
        appDispatch({ type: "setNotifications", payload: notifications });
        appDispatch({ type: "setWorkIndicator", payload: false });
    };

    const notifications = appState.notifications.filter(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]);
    const bellStyle = notifications.length > 0 ? { color: "red" } : {};

    return (
        <div ref={drag}>
            <Card style={{opacity, marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: props.borderColor, borderLeftWidth: "3px", ...props.style}}>
                <Card.Header>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666", marginRight: "65px" }}>
                        { props.cardForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ margin: "5px", flex: "1 1 0" }}><FieldRow type="header" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    <Dropdown as={ButtonGroup} style={{float: "right", position: "absolute", top: "5px", right: "40px"}}>
                        <Button style={bellStyle} variant="outline-secondary">
                            { appState.subscriptions.some(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]) ? <FontAwesomeIcon icon="bell" /> : <FontAwesomeIcon icon="bell-slash" /> }
                        </Button>
                        <Dropdown.Toggle split variant="outline-secondary" id="dropdown-split-basic" />
                        <Dropdown.Menu>
                            <Dropdown.Item as="button" onClick={subscribe}><FontAwesomeIcon icon="bell" /> Subscribe</Dropdown.Item>
                            <Dropdown.Item as="button" onClick={unsubscribe}><FontAwesomeIcon icon="bell-slash" /> Unsubscribe</Dropdown.Item>
                            <Dropdown.Item as="button" onClick={clearNotifications}><FontAwesomeIcon icon="eye-slash" /> Mark as read</Dropdown.Item>
                            <Dropdown.Item as="button" onClick={showNotifications}><FontAwesomeIcon icon="eye" /> Show notifications</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <DropdownButton drop="left" id="displaySelector" variant="outline-secondary" title="" style={{ float: "right", position: "absolute", "top": "5px", right: "5px"}}>
                        <Dropdown.Item onClick={setSelectedRecord} as="button" id="setSelected"><FontAwesomeIcon icon="angle-double-right" /> Open in split screen</Dropdown.Item>
                        <Dropdown.Item onClick={openInNewTab} as="button" id="setSelected"><FontAwesomeIcon icon="window-maximize" /> Open in new window</Dropdown.Item>
                        { appState.config.secondaryEntity && <Dropdown.Item onClick={createNewSecondary} as="button" id="addSecondary"><FontAwesomeIcon icon="plus-square" /> Create new {appState.secondaryMetadata.DisplayName.UserLocalizedLabel.Label}</Dropdown.Item> }
                    </DropdownButton>
                </Card.Header>
                <Card.Body>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="body" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    { props.secondaryData &&
                    <div>
                        <span style={{marginLeft: "5px", fontSize: "larger"}}>
                            {appState.secondaryMetadata.DisplayCollectionName.UserLocalizedLabel.Label}
                        </span>
                        <Button style={{marginLeft: "5px"}} variant="outline-secondary" onClick={createNewSecondary}><FontAwesomeIcon icon="plus-square" /></Button>
                        <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "auto" }}>
                            { props.secondaryData.map(d => <Lane dndType={`${ItemTypes.Tile}_${props.data[props.metadata.PrimaryIdAttribute]}`} key={`lane_${d.option?.Value ?? "fallback"}`} minWidth="300px" cardForm={appState.selectedSecondaryForm} metadata={appState.secondaryMetadata} lane={d} />) }
                        </div>
                    </div>
                    }
                </Card.Body>
                <Card.Footer style={{ backgroundColor: "#efefef" }}>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow type="footer" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                </Card.Footer>
            </Card>
        </div>
    );
};