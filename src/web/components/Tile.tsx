import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { useAppContext, useAppDispatch, AppStateProps, AppStateDispatch } from "../domain/AppState";
import { Card, Table, Row, Col, DropdownButton, Dropdown, Button, ButtonGroup, Image, Badge } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata, Option, Attribute } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";
import { BoardLane } from "../domain/BoardLane";
import { Lane } from "./Lane";
import { ItemTypes } from "../domain/ItemTypes";
import { refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import WebApiClient from "xrm-webapi-client";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { FlyOutForm } from "../domain/FlyOutForm";
import { Notification } from "../domain/Notification";
import { BoardViewConfig, PrimaryEntity, BoardEntity } from "../domain/BoardViewConfig";
import { Subscription } from "../domain/Subscription";
import { useConfigState } from "../domain/ConfigState";
import { useActionContext, DisplayType, useActionDispatch } from "../domain/ActionState";
import { useMeasurerDispatch } from "../domain/MeasurerState";

interface TileProps {
    borderColor: string;
    cardForm: CardForm;
    config: BoardEntity;
    data: any;
    dndType?: string;
    laneOption?: Option;
    metadata: Metadata;
    notifications: Array<Notification>;
    searchText: string;
    secondaryData?: Array<BoardLane>;
    secondaryNotifications?: {[key: string]: Array<Notification>};
    secondarySubscriptions?: {[key: string]: Array<Subscription>};
    selectedSecondaryForm?: CardForm;
    separatorMetadata: Attribute;
    style?: React.CSSProperties;
    subscriptions: Array<Subscription>;
    refresh: () => Promise<void>;
    preventDrag?: boolean;
}

const TileRender = (props: TileProps) => {
    const appDispatch = useAppDispatch();
    const configState = useConfigState();
    const actionDispatch = useActionDispatch();
    const measurerDispatch = useMeasurerDispatch();

    const secondaryMetadata = configState.secondaryMetadata[configState.config.secondaryEntity.logicalName];
    const secondaryConfig = configState.config.secondaryEntity;
    const secondarySeparator = configState.secondarySeparatorMetadata;
    const stub = useRef(undefined);

    const context = {
        showForm: (form: FlyOutForm) => {
            return new Promise((resolve, reject) => {
                form.resolve = resolve;
                form.reject = reject;

                actionDispatch({ type: "setFlyOutForm", payload: form });
            });
        },
        refresh: props.refresh,
        setWorkIndicator: (working: boolean) => {
            return actionDispatch({ type: "setWorkIndicator", payload: working });
        },
        data: props.data,
        WebApiClient: WebApiClient
    };

    const accessFunc = (identifier: string) => {
        const path = identifier.split(".");
        return path.reduce((all, cur) => !all ? undefined : (all as any)[cur], window);
    };

    const [{ isDragging }, drag] = useDrag({
        item: { id: props.data[props.metadata.PrimaryIdAttribute], sourceLane: props.laneOption, type: props.dndType ?? ItemTypes.Tile },
        end: (item: { id: string; sourceLane: Option } | undefined, monitor: DragSourceMonitor) => {
            const asyncEnd = async (item: { id: string; sourceLane: Option } | undefined, monitor: DragSourceMonitor) => {
                const dropResult = monitor.getDropResult();

                if (!dropResult || !dropResult?.option?.Value || dropResult.option.Value === item.sourceLane.Value) {
                    return;
                }

                let preventDefault = false;

                if (props.config.transitionCallback) {
                    const eventContext = {
                        ...context,
                        target: dropResult.option
                    };

                    const funcRef = accessFunc(props.config.transitionCallback);

                    const result = await Promise.resolve(funcRef(eventContext));
                    preventDefault = result?.preventDefault;
                }

                if (preventDefault) {
                    actionDispatch({ type: "setWorkIndicator", payload: false });
                }
                else {
                    actionDispatch({ type: "setWorkIndicator", payload: true });
                    const itemId = item.id;
                    const targetOption = dropResult.option as Option;
                    const update: any = { [props.separatorMetadata.LogicalName]: targetOption.Value };

                    if (props.separatorMetadata.LogicalName === "statuscode") {
                        update["statecode"] = targetOption.State;
                    }

                    await WebApiClient.Update({ entityName: props.metadata.LogicalName, entityId: itemId, entity: update })
                    .then((r: any) => {
                        actionDispatch({ type: "setWorkIndicator", payload: false });
                        return props.refresh();
                    })
                    .catch((e: any) => {
                        actionDispatch({ type: "setWorkIndicator", payload: false });
                    });
                }

                measurerDispatch({ type: "resetMeasurementCache" });
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
            measurerDispatch({ type: "resetMeasurementCache" });
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

        const subscriptions = await fetchSubscriptions(configState.config);
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

        const subscriptions = await fetchSubscriptions(configState.config);
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

    const initCallBack = (identifier: string) => {
        return async () => {
            const funcRef = accessFunc(identifier);
            return Promise.resolve(funcRef(context));
        };
    };

    const isSubscribed = useMemo(() => props.subscriptions?.some(s => s[`_oss_${props.metadata.LogicalName}id_value`] === props.data[props.metadata.PrimaryIdAttribute]), [props.subscriptions]);

    console.log(`Tile ${props.data[props.metadata.PrimaryIdAttribute]} is rerendering`);

    return (
        <div ref={ props.preventDrag ? stub : drag}>
            <Card style={{opacity, marginBottom: "5px", borderColor: "#d8d8d8", borderLeftColor: props.borderColor, borderLeftWidth: "3px", ...props.style}}>
                <Card.Header style={{ padding: "10px" }}>
                    <div style={{display: "flex", flexDirection: "row"}}>
                        <div style={{display: "flex", flex: "1", overflow: "auto", flexDirection: "column", color: "#666666" }}>
                            { props.cardForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="header" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                        </div>
                        { props.config.notificationLookup && props.config.subscriptionLookup && <Dropdown as={ButtonGroup} style={{ display: "initial", margintop: "5px", marginRight: "5px" }}>
                            <Button onClick={showNotifications} variant="outline-secondary">
                                {
                                <span>{isSubscribed ? <span><i className="fa fa-bell" aria-hidden="true"></i></span> : <span><i className="fa fa-bell-slash" aria-hidden="true"></i></span> } { props.notifications?.length > 0 && <Badge variant="danger">{props.notifications.length}</Badge> }</span>
                                }
                            </Button>
                            <Dropdown.Toggle split variant="outline-secondary" id="dropdown-split-basic" />
                            <Dropdown.Menu>
                                <Dropdown.Item as="button" onClick={subscribe}><span><i className="fa fa-bell" aria-hidden="true"></i></span> Subscribe</Dropdown.Item>
                                <Dropdown.Item as="button" onClick={unsubscribe}><span><i className="fa fa-bell-slash" aria-hidden="true"></i></span> Unsubscribe</Dropdown.Item>
                                <Dropdown.Item as="button" onClick={clearNotifications}><span><i className="fa fa-eye-slash" aria-hidden="true"></i></span> Mark as read</Dropdown.Item>
                                <Dropdown.Item as="button" onClick={showNotifications}><span><i className="fa fa-eye" aria-hidden="true"></i></span> Show notifications</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>}
                        <DropdownButton drop="left" id="displaySelector" variant="outline-secondary" title="" style={{ margintop: "5px" }}>
                            <Dropdown.Item onClick={setSelectedRecord} as="button" id="setSelected"><span><i className="fa fa-angle-double-right" aria-hidden="true"></i></span> Open in split screen</Dropdown.Item>
                            <Dropdown.Item onClick={openInNewTab} as="button" id="setSelected"><span><i className="fa fa-window-maximize" aria-hidden="true"></i></span> Open in new window</Dropdown.Item>
                            { configState.config.secondaryEntity && <Dropdown.Item onClick={createNewSecondary} as="button" id="addSecondary"><span><i className="fa fa-square" aria-hidden="true"></i></span> Create new {secondaryMetadata.DisplayName.UserLocalizedLabel.Label}</Dropdown.Item> }
                            {
                                props.config.customButtons && props.config.customButtons.length &&
                                <>
                                    <Dropdown.Divider></Dropdown.Divider>
                                    { props.config.customButtons.map(b => <Dropdown.Item key={b.id} id={b.id} as="button" onClick={initCallBack(b.callBack)}>
                                        <>
                                            {b.icon && b.icon.type === "url" && <img src={b.icon.value}></img>}
                                            {b.icon && b.icon.type === "fa" && <span><i className={b.icon.value}></i></span>}
                                            {" "}{b.label}
                                        </>
                                    </Dropdown.Item>) }
                                </>
                            }
                        </DropdownButton>
                    </div>
                </Card.Header>
                <Card.Body style={{ padding: "10px" }}>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="body" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                    { props.secondaryData &&
                    <div>
                        <div className="border-top my-3"></div>
                        <span style={{marginLeft: "5px", fontSize: "larger"}}>
                            {secondaryMetadata.DisplayCollectionName.UserLocalizedLabel.Label}
                        </span>
                        <Button style={{marginLeft: "5px"}} variant="outline-secondary" onClick={createNewSecondary}><span><i className="fa fa-plus-square" aria-hidden="true"></i></span></Button>
                        <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "auto" }}>
                            {
                                props.secondaryData.map(d => <Lane
                                refresh={props.refresh}
                                notifications={props.secondaryNotifications}
                                searchText={props.searchText}
                                subscriptions={props.secondarySubscriptions}
                                dndType={`${ItemTypes.Tile}_${props.data[props.metadata.PrimaryIdAttribute]}`}
                                key={`lane_${d.option?.Value ?? "fallback"}`}
                                minWidth="300px"
                                cardForm={props.selectedSecondaryForm}
                                metadata={secondaryMetadata}
                                lane={d}
                                config={secondaryConfig}
                                separatorMetadata={secondarySeparator}
                                isSecondaryLane />)
                            }
                        </div>
                    </div>
                    }
                </Card.Body>
                <Card.Footer style={{ backgroundColor: "#efefef", padding: "10px" }}>
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        { props.cardForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[props.metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1 1 0" }}><FieldRow searchString={props.searchText} type="footer" metadata={props.metadata} data={props.data} cells={r.cells} /></div>) }
                    </div>
                </Card.Footer>
            </Card>
        </div>
    );
};

export const Tile = React.memo(TileRender, (a, b) => {
    if (a.borderColor != b.borderColor) {
        return false;
    }

    if (a.cardForm != b.cardForm) {
        return false;
    }

    if (a.dndType != b.dndType) {
        return false;
    }

    if (a.laneOption != b.laneOption) {
        return false;
    }

    if (a.metadata != b.metadata) {
        return false;
    }

    if (a.searchText != b.searchText) {
        return false;
    }

    if (a.style != b.style) {
        return false;
    }

    if (a.notifications?.length != b.notifications?.length) {
        return false;
    }

    if (a.secondaryData?.length != b.secondaryData?.length) {
        return false;
    }

    if (a.subscriptions?.length != b.subscriptions?.length) {
        return false;
    }

    if (Object.keys(a.data).length != Object.keys(b.data).length) {
        return false;
    }

    if (Object.keys(a.data).some(k => {
        const value = a.data[k];
        return b.data[k] !== value;
    })) {
        return false;
    }

    return true;
});