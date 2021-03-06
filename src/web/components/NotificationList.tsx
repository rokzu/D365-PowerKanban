import * as React from "react";
import { useAppContext } from "../domain/AppState";
import { Button, Card } from "react-bootstrap";

import { fetchData, refresh, fetchNotifications } from "../domain/fetchData";
import { NotificationTile } from "./NotificationTile";
import * as WebApiClient from "xrm-webapi-client";
import { FieldRow } from "./FieldRow";
import { useActionContext } from "../domain/ActionState";
import { useConfigState } from "../domain/ConfigState";

interface NotificationListProps {
}

export const NotificationList = (props: NotificationListProps) => {
  const [ actionState, actionDispatch ] = useActionContext();
  const [ eventRecord, setEventRecord ] = React.useState(undefined);
  const configState = useConfigState();
  const [ appState, appDispatch ] = useAppContext();

  const notificationRecord = actionState.selectedRecord;
  const notifications = appState.notifications[actionState.selectedRecord.id] ?? [];
  const columns = Array.from(new Set(notifications.reduce((all, cur) => [...all, ...cur.parsed.updatedFields], [] as Array<string>)));
  const eventMeta = actionState.selectedRecord.entityType === configState.config.primaryEntity.logicalName ? configState.metadata : configState.secondaryMetadata[actionState.selectedRecord.entityType];

  React.useEffect(() => {
    const fetchEventRecord = async() => {
      const data = await WebApiClient.Retrieve({ entityName: actionState.selectedRecord.entityType, entityId: actionState.selectedRecord.id, queryParams: `?$select=${columns.join(",")}`, headers: [ { key: "Prefer", value: "odata.include-annotations=\"*\"" } ] });
      setEventRecord(data);
    };
    fetchEventRecord();
  }, []);

  const closeSideBySide = () => {
    actionDispatch({ type: "setSelectedRecord", payload: undefined });
  };

  const openInNewTab = () => {
    Xrm.Navigation.openForm({ entityName: actionState.selectedRecord.entityType, entityId: actionState.selectedRecord.id, openInNewWindow: true });
  };

  const clearAndRefresh = async () => {
    actionDispatch({ type: "setWorkIndicator", payload: true });

    await Promise.all(notifications.map(s =>
        WebApiClient.Delete({
            entityName: "oss_notification",
            entityId: s.oss_notificationid
        })
    ));

    const newNotifications = await fetchNotifications(configState.config);
    appDispatch({ type: "setNotifications", payload: newNotifications });
    actionDispatch({ type: "setWorkIndicator", payload: false });
    closeSideBySide();
};

  return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Button title="Close" onClick={closeSideBySide} style={{ position: "absolute", zIndex: 1, top: "calc(50% - 40px)", left: "-18px" }}><span><i className="fa fa-window-close" aria-hidden="true"></i></span></Button>
        <Button title="Mark as read and close" onClick={clearAndRefresh} style={{ position: "absolute", zIndex: 1, top: "50%", left: "-18px" }}><span><i className="fa fa-eye-slash" aria-hidden="true"></i></span></Button>
        <Button title="Open in new window" onClick={openInNewTab} style={{ position: "absolute", zIndex: 1, top: "calc(50% + 40px)", left: "-18px" }}><span><i className="fa fa-window-maximize" aria-hidden="true"></i></span></Button>
        { eventRecord &&
          <Card style={{ margin: "5px", borderColor: "#d8d8d8", borderLeftWidth: "3px" }}>
            <Card.Title style={{margin: "5px"}}>Current Data</Card.Title>
            <Card.Body>
              <div style={{display: "flex", overflow: "auto", flexDirection: "column" }}>
                {
                  columns.filter(c => ["createdby", "modifiedon", "modifiedby", "modifiedonbehalfby", eventMeta.PrimaryIdAttribute].every(s => s !== c)).map(c =>
                    <div key={`currentRecord_${c}`} style={{ minWidth: "200px", margin: "5px", flex: "1" }}>
                      <FieldRow type="footer" metadata={eventMeta} data={eventRecord} cells={[ { field: c } ]} />
                    </div>
                  )
                }
                </div>
            </Card.Body>
          </Card>
        }
        { notifications.map(n => <NotificationTile key={n.oss_notificationid} parent={notificationRecord} data={n}></NotificationTile>) }
      </div>
  );
};