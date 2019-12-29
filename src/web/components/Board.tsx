import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Button, Card, Col, Row } from "react-bootstrap";
import WebApiClient from "xrm-webapi-client";
import { Option, Attribute } from "../domain/Option";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import UserInputModal from "./UserInputModalProps";
import { AppStateProps, Dispatch, useAppContext } from "../domain/AppState";
import { formatGuid } from "../domain/GuidFormatter";
import { Lane } from "./Lane";

const fetchSwimLaneField = async (entity: string) => {
  const response = await WebApiClient.Retrieve({entityName: "EntityDefinition", queryParams: `(LogicalName='${entity}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet`});
  const value = response.value as Array<any>;

  if (!value || !value.length) {
    return undefined;
  }

  return value[0];
};

const fetchConfig = async (configId: string): Promise<BoardViewConfig> => {
  const config = await WebApiClient.Retrieve({overriddenSetName: "webresourceset", entityId: configId, queryParams: "?$select=content" });

  return JSON.parse(atob(config.content));
};

const fetchData = async (config: BoardViewConfig) => {
  const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: config.entityName });

  const lanes = data.reduce((all, record) => {
    const laneId = record[config.swimLaneSource] ? record[config.swimLaneSource].toString() : "__unset";

    if (all[laneId]) {
      all[laneId].push(record);
    }
    else {
      all[laneId] = [ record ];
    }

    return all;
    }, {} as {[key: string]: Array<any>});

  return lanes;
};

export const Board = () => {
  const [ appState, appDispatch ] = useAppContext();
  const [ showDeletionVerification, setShowDeletionVerification ] = useState(false);

  useEffect(() => {
    async function initializeConfig() {
      const userId = formatGuid(Xrm.Page.context.getUserId());
      const user = await WebApiClient.Retrieve({ entityName: "systemuser", entityId: userId, queryParams: "?$select=oss_defaultboardid"});

      const config = await fetchConfig(user.oss_defaultboardid);
      const swimLaneField = await fetchSwimLaneField(config.entityName);

      appDispatch({ type: "setConfig", payload: config });

      const data = await fetchData(config);
      appDispatch({ type: "setBoardData", payload: data });
    }

    initializeConfig();
  }, []);

  const verifyDeletion = () => setShowDeletionVerification(true);
  const hideDeletionVerification = () => setShowDeletionVerification(false);

  const deleteRecord = () => {

  };

  const refresh = async () => {
    const data = await fetchData(appState.config);
    appDispatch({ type: "setBoardData", payload: data });
  };

  return (
    <div style={{height: "100%"}}>
      <UserInputModal title="Verify Deletion" yesCallBack={deleteRecord} finally={hideDeletionVerification} show={showDeletionVerification}>
        <div>Are you sure you want to delete  '{appState.selectedRecord && appState.selectedRecord.name}' (ID: {appState.selectedRecord && appState.selectedRecord.id})?</div>
      </UserInputModal>
      <Navbar bg="light" variant="light">
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto"></Nav>
          { appState.config && appState.config.showCreateButton && <Button>Create New</Button> }
          <Button onClick={refresh}>Refresh</Button>
        </Navbar.Collapse>
      </Navbar>
      <Card>
        <div id="flexContainer" style={{ display: "flex", margin: "5px", flexDirection: "row" }}>
          { appState.boardData && Object.keys(appState.boardData).map(d => <Lane key={d} laneId={d} />)}
        </div>
      </Card>
    </div>
  );
};
