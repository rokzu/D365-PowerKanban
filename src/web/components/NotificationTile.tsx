import * as React from "react";
import { useAppContext, useAppDispatch, AppStateProps, AppStateDispatch } from "../domain/AppState";
import { Card, Table, Row, Col, DropdownButton, Dropdown, Button, ButtonGroup, Image, Badge } from "react-bootstrap";
import { FieldRow } from "./FieldRow";
import { Metadata, Option } from "../domain/Metadata";
import { CardForm } from "../domain/CardForm";

import { refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import * as WebApiClient from "xrm-webapi-client";
import { Notification } from "../domain/Notification";
import { useConfigState } from "../domain/ConfigState";
import { useActionContext } from "../domain/ActionState";

interface NotificationTileProps {
    data: Notification;
    parent: Xrm.LookupValue;
    style?: React.CSSProperties;
}

const NotificationTileRender = (props: NotificationTileProps) => {
    const configState = useConfigState();
    const appDispatch = useAppDispatch();
    const [ actionState, actionDispatch ] = useActionContext();
    const metadata = configState.secondaryMetadata["oss_notification"];
    const eventRecord = props.data.parsed.eventRecordReference;

    const eventMeta = eventRecord.LogicalName === configState.config.primaryEntity.logicalName ? configState.metadata : configState.secondaryMetadata[eventRecord.LogicalName];

    const clearNotification = async () => {
        actionDispatch({ type: "setWorkIndicator", payload: true });

        await WebApiClient.Delete({
                entityName: "oss_notification",
                entityId: props.data.oss_notificationid
        });

        const notifications = await fetchNotifications(configState.config);
        appDispatch({ type: "setNotifications", payload: notifications });
        actionDispatch({ type: "setWorkIndicator", payload: false });
    };

    const openInNewTab = () => {
        Xrm.Navigation.openForm({ entityName: eventRecord.LogicalName, entityId: eventRecord.Id, openInNewWindow: true });
    };

    return (
        <Card style={{ margin: "5px", borderColor: "#d8d8d8", borderLeftWidth: "3px", ...props.style }}>
            <Card.Header>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column", color: "#666666", marginRight: "65px" }}>
                    { configState.notificationForm.parsed.header.rows.map((r, i) => <div key={`headerRow_${props.data[metadata.PrimaryIdAttribute]}_${i}`} style={{ margin: "5px", flex: "1" }}><FieldRow type="header" metadata={metadata} data={props.data} cells={r.cells} /></div>) }
                </div>
                <Button title="Mark as read" onClick={clearNotification} style={{float: "right", position: "absolute", top: "5px", right: "5px"}}><span><i className="fa fa-eye-slash" aria-hidden="true"></i></span></Button>
                { props.data.oss_event !== 863910000 && <Button title="Open in new window" onClick={openInNewTab} style={{float: "right", position: "absolute", top: "5px", right: "40px"}} ><span><i className="fa fa-window-maximize" aria-hidden="true"></i></span></Button> }
            </Card.Header>
            <Card.Body>
                { props.data.oss_event === 863910000 &&
                    <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                        <div style={{ minWidth: "200px", margin: "5px", flex: "1" }}><strong>Updated Fields</strong></div>
                        { props.data.parsed.updatedFields.filter(f => ["createdby", "modifiedon", "modifiedby", "modifiedonbehalfby", eventMeta.PrimaryIdAttribute].every(s => s !== f)).map(f => <div id={f} style={{ minWidth: "200px", margin: "5px", flex: "1" }} key={props.data[metadata.PrimaryIdAttribute] + f}>{eventMeta.Attributes.find(a => a.LogicalName === f).DisplayName.UserLocalizedLabel.Label}</div>) }
                    </div>
                }
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { configState.notificationForm.parsed.body.rows.map((r, i) => <div key={`bodyRow_${props.data[metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1" }}><FieldRow type="body" metadata={metadata} data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Body>
            <Card.Footer style={{ backgroundColor: "#efefef" }}>
                <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                    { configState.notificationForm.parsed.footer.rows.map((r, i) => <div key={`footerRow_${props.data[metadata.PrimaryIdAttribute]}_${i}`} style={{ minWidth: "200px", margin: "5px", flex: "1" }}><FieldRow type="footer" metadata={metadata} data={props.data} cells={r.cells} /></div>) }
                </div>
            </Card.Footer>
        </Card>
    );
};

export const NotificationTile = React.memo(NotificationTileRender);