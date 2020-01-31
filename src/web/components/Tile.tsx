import React, { useContext, useEffect, useState, useMemo } from "react";
import { useAppContext, useAppDispatch, AppStateProps, AppStateDispatch } from "../domain/AppState";
import { Card, Table, Row, Col, DropdownButton, Dropdown, Button, ButtonGroup, Image, Badge } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata, Option, Attribute } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { BoardLane } from "../domain/BoardLane";
import { Lane } from "./Lane";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ItemTypes } from "../domain/ItemTypes";
import { refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import WebApiClient from "xrm-webapi-client";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { FlyOutForm } from "../domain/FlyOutForm";
import { Notification } from "../domain/Notification";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import { Subscription } from "../domain/Subscription";
import { useConfigState } from "../domain/ConfigState";
import { useActionContext, DisplayType, useActionDispatch } from "../domain/ActionState";

interface TileProps {
    data: any;
    metadata: Metadata;
    cardForm: CardForm;
    secondaryData?: Array<BoardLane>;
    selectedSecondaryForm?: CardForm;
    secondaryNotifications?: {[key: string]: Array<Notification>};
    borderColor: string;
    style?: React.CSSProperties;
    laneOption?: Option;
    dndType?: string;
    notifications: Array<Notification>;
    refresh: () => Promise<void>;
    subscriptions: Array<Subscription>;
    searchText: string;
}

const TileRender = (props: TileProps) => {
    const appDispatch = useAppDispatch();
    const configState = useConfigState();
    const actionDispatch = useActionDispatch();

    const secondaryMetadata = configState.secondaryMetadata[configState.config.secondaryEntity.logicalName];

    const [{ isDragging }, drag] = useDrag({
        item: { id: props.data[props.metadata.PrimaryIdAttribute], sourceLane: props.laneOption, type: props.dndType ?? ItemTypes.Tile },
        end: (item: { id: string; sourceLane: Option } | undefined, monitor: DragSourceMonitor) => {
            const asyncEnd = async (item: { id: string; sourceLane: Option } | undefined, monitor: DragSourceMonitor) => {
                const dropResult = monitor.getDropResult();

                if (!dropResult || !dropResult?.option?.Value || dropResult.option.Value === item.sourceLane.Value) {
                    return;
                }

                let preventDefault = true;

                if (configState.config.transitionCallback) {
                    const context = {
                        showForm: (form: FlyOutForm) => {
                            return new Promise((resolve, reject) => {
                                form.resolve = resolve;
                                form.reject = reject;

                                actionDispatch({ type: "setFlyOutForm", payload: form });
                            });
                        },
                        data: props.data,
                        target: dropResult.option,
                        WebApiClient: WebApiClient
                    };

                    const path = configState.config.transitionCallback.split(".");
                    const funcRef = path.reduce((all, cur) => !all ? undefined : (all as any)[cur], window);

                    const result = await Promise.resolve(funcRef(context));
                    preventDefault = result?.preventDefault;
                }

                if (preventDefault) {
                    actionDispatch({ type: "setWorkIndicator", payload: false });
                    await props.refresh();
                }
                else {
                    actionDispatch({ type: "setWorkIndicator", payload: true });
                    const itemId = item.id;
                    const targetOption = dropResult.option as Option;
                    const update: any = { [configState.separatorMetadata.LogicalName]: targetOption.Value };

                    if (configState.separatorMetadata.LogicalName === "statuscode") {
                        update["statecode"] = targetOption.State;
                    }

                    WebApiClient.Update({ entityName: props.metadata.LogicalName, entityId: itemId, entity: update })
                    .then((r: any) => {
                        actionDispatch({ type: "setWorkIndicator", payload: false });
                        return props.refresh();
                    })
                    .catch((e: any) => {
                        actionDispatch({ type: "setWorkIndicator", payload: false });
                    });
                }
            };

            asyncEnd(item, monitor);
        },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        })
    });

    const opacity = isDragging ? 0.4 : 1;

    const setSelectedRecord = () => {
        actionDispatch({ type: "setSelectedRecordDisplayType", payload: DisplayType.recordForm });
        actionDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    const showNotifications = () => {
        actionDispatch({ type: "setSelectedRecordDisplayType", payload: DisplayType.notifications });
        actionDispatch({ type: "setSelectedRecord", payload: { entityType: props.metadata.LogicalName, id: props.data[props.metadata?.PrimaryIdAttribute] } });
    };

    const openInNewTab = () => {
        Xrm.Navigation.openForm({ entityName: props.metadata.LogicalName, entityId: props.data[props.metadata?.PrimaryIdAttribute], openInNewWindow: true });
    };

    const createNewSecondary = async () => {
        const parentLookup = configState.config.secondaryEntity.parentLookup;
        const data = {
            [parentLookup]: props.data[props.metadata.PrimaryIdAttribute],
            [`${parentLookup}type`]: props.metadata.LogicalName,
            [`${parentLookup}name`]: props.data[props.metadata.PrimaryNameAttribute]
        };

        const result = await Xrm.Navigation.openForm({ entityName: secondaryMetadata.LogicalName, useQuickCreateForm: true }, data);

        if (result && result.savedEntityReference) {
            props.refresh();
        }
    };

    const subscribe = async () => {
        actionDispatch({ type: "setWorkIndicator", payload: true });

        await WebApiClient.Create({
            entityName: "oss_subscription",
            entity: {
                [`oss_${props.metadata.LogicalName}id@odata.bind`]: `/${props.metadata.LogicalCollectionName}(${props.data[props.metadata.PrimaryIdAttribute].replace("{", "").replace("}", "")})`
            }
        });

        const subscriptions = await fetchSubscriptions();
        appDispatch({ type: "setSubscriptions", payload: subscriptions });
        actionDispatch({ type: "setWorkIndicator", payload: false });
    };

    const unsubscribe = async () => {
        actionDispatch({ type: "setWorkIndicator", payload: true });
        const subscriptionsToDelete = props.subscriptions.filter(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]);

        await Promise.all(subscriptionsToDelete.map(s =>
            WebApiClient.Delete({
                entityName: "oss_subscription",
                entityId: s.oss_subscriptionid
            })
        ));

        const subscriptions = await fetchSubscriptions();
        appDispatch({ type: "setSubscriptions", payload: subscriptions });
        actionDispatch({ type: "setWorkIndicator", payload: false });
    };

    const clearNotifications = async () => {
        actionDispatch({ type: "setWorkIndicator", payload: true });
        const notificationsToDelete = props.notifications;

        await Promise.all(notificationsToDelete.map(s =>
            WebApiClient.Delete({
                entityName: "oss_notification",
                entityId: s.oss_notificationid
            })
        ));

        const notifications = await fetchNotifications(configState.config);
        appDispatch({ type: "setNotifications", payload: notifications });
        actionDispatch({ type: "setWorkIndicator", payload: false });
    };

    const isSubscribed = useMemo(() => props.subscriptions.some(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]), [props.subscriptions]);

    return (
        <div ref={drag}>
            <Card style={{opacity, marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: props.borderColor, borderLeftWidth: "3px", ...props.style}}>
                <Card.Header>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666", marginRight: "65px" }}>
                        { props.cardForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ margin: "5px", flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="header" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    <Dropdown as={ButtonGroup} style={{float: "right", position: "absolute", top: "5px", right: "40px"}}>
                        <Button onClick={showNotifications} variant="outline-secondary">
                            {
                            <span>{isSubscribed ? <FontAwesomeIcon icon="bell" /> : <FontAwesomeIcon icon="bell-slash" />} { props.notifications.length > 0 && <Badge variant="danger">{props.notifications.length}</Badge> }</span>
                            }
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
                        { configState.config.secondaryEntity && <Dropdown.Item onClick={createNewSecondary} as="button" id="addSecondary"><FontAwesomeIcon icon="plus-square" /> Create new {secondaryMetadata.DisplayName.UserLocalizedLabel.Label}</Dropdown.Item> }
                    </DropdownButton>
                </Card.Header>
                <Card.Body>
                    <Image  />
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="body" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    { props.secondaryData &&
                    <div>
                        <span style={{marginLeft: "5px", fontSize: "larger"}}>
                            {secondaryMetadata.DisplayCollectionName.UserLocalizedLabel.Label}
                        </span>
                        <Button style={{marginLeft: "5px"}} variant="outline-secondary" onClick={createNewSecondary}><FontAwesomeIcon icon="plus-square" /></Button>
                        <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "auto" }}>
                            {
                                props.secondaryData.map(d => <Lane
                                refresh={props.refresh}
                                notifications={props.secondaryNotifications}
                                searchText={props.searchText}
                                subscriptions={props.subscriptions}
                                dndType={`${ItemTypes.Tile}_${props.data[props.metadata.PrimaryIdAttribute]}`}
                                key={`lane_${d.option?.Value ?? "fallback"}`} minWidth="300px"
                                cardForm={props.selectedSecondaryForm}
                                metadata={secondaryMetadata}
                                lane={d} />)
                            }
                        </div>
                    </div>
                    }
                </Card.Body>
                <Card.Footer style={{ backgroundColor: "#efefef" }}>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="footer" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                </Card.Footer>
            </Card>
        </div>
    );
};

TileRender.whyDidYouRender = true;

export const Tile = React.memo(TileRender);