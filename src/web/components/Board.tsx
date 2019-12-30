import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Button, Card, Col, Row, DropdownButton, Dropdown } from "react-bootstrap";
import WebApiClient from "xrm-webapi-client";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import UserInputModal from "./UserInputModalProps";
import { AppStateProps, Dispatch, useAppContext } from "../domain/AppState";
import { formatGuid } from "../domain/GuidFormatter";
import { Lane } from "./Lane";
import { Metadata, Attribute, Option } from "../domain/Metadata";
import { BoardLane } from "../domain/BoardLane";
import { SavedQuery } from "../domain/SavedQuery";

const determineAttributeUrl = (attribute: Attribute) => {
  if (attribute.AttributeType === "Picklist") {
    return "Microsoft.Dynamics.CRM.PicklistAttributeMetadata";
  }

  if (attribute.AttributeType === "Status") {
    return "Microsoft.Dynamics.CRM.StatusAttributeMetadata";
  }

  if (attribute.AttributeType === "State") {
    return "Microsoft.Dynamics.CRM.StateAttributeMetadata";
  }

  if (attribute.AttributeType === "Boolean") {
    return "Microsoft.Dynamics.CRM.BooleanAttributeMetadata";
  }

  throw new Error(`Type ${attribute.AttributeType} is not allowed as swim lane separator.`);
};

const fetchSeparatorMetadata = async (entity: string, swimLaneSource: string, metadata: Metadata) => {
  const field = metadata.Attributes.find(a => a.LogicalName.toLowerCase() === swimLaneSource.toLowerCase());
  const typeUrl = determineAttributeUrl(field);

  const response: Attribute = await WebApiClient.Retrieve({entityName: "EntityDefinition", queryParams: `(LogicalName='${entity}')/Attributes(LogicalName='${field.LogicalName}')/${typeUrl}?$expand=OptionSet`});
  return response;
};

const fetchMetadata = async (entity: string) => {
  const response: Metadata = await WebApiClient.Retrieve({entityName: "EntityDefinition", queryParams: `(LogicalName='${entity}')?$expand=Attributes`});

  return response;
};

const fetchConfig = async (configId: string): Promise<BoardViewConfig> => {
  const config = await WebApiClient.Retrieve({overriddenSetName: "webresourceset", entityId: configId, queryParams: "?$select=content" });

  return JSON.parse(atob(config.content));
};

const fetchData = async (config: BoardViewConfig, attribute: Attribute) => {
  const lanes = attribute.AttributeType === "Boolean" ? [ attribute.OptionSet.FalseOption, attribute.OptionSet.TrueOption ] : attribute.OptionSet.Options.sort((a, b) => a.State - b.State);
  const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: config.entityName });

  return data.reduce((all: Array<BoardLane>, record) => {
    const laneSource = record[config.swimLaneSource];

    if (!laneSource) {
      const undefinedLane = all.find(l => !l.option);

      if (undefinedLane) {
        undefinedLane.data.push(record);
      }
      else {
        all.push({ option: undefined, data: [ record ] });
      }

      return all;
    }

    if (attribute.AttributeType === "Boolean") {
      const lane = all.find(l => l.option && l.option.Value == laneSource);

      if (lane) {
        lane.data.push(record);
      }
      else {
        all.push({ option: !laneSource ? lanes[0] : lanes[1], data: [ record ]});
      }

      return all;
    }

    const lane = all.find(l => l.option && l.option.Value === laneSource);

    if (lane) {
      lane.data.push(record);
    }
    else {
      const existingLane = lanes.find(l => l.Value === laneSource);

      if (existingLane) {
        all.push({ option: existingLane, data: [record]});
      }
      else {
        console.warn(`Found data with non valid option set data, did you reorganize or delete option set values? Data needs to be reorganized then. Value found: ${laneSource}`);
      }
    }

    return all;
    }, lanes.map(l => ({ option: l, data: [] })) as Array<BoardLane>);
};

export const Board = () => {
  const [ appState, appDispatch ] = useAppContext();
  const [ views, setViews ]: [ Array<SavedQuery>, (views: Array<SavedQuery>) => void ] = useState([]);
  const [ selectedView, setSelectedView ]: [ SavedQuery, (view: SavedQuery) => void ] = useState();
  const [ showDeletionVerification, setShowDeletionVerification ] = useState(false);

  useEffect(() => {
    async function initializeConfig() {
      const userId = formatGuid(Xrm.Page.context.getUserId());
      const user = await WebApiClient.Retrieve({ entityName: "systemuser", entityId: userId, queryParams: "?$select=oss_defaultboardid"});

      const config = await fetchConfig(user.oss_defaultboardid);
      const metadata = await fetchMetadata(config.entityName);
      const attributeMetadata = await fetchSeparatorMetadata(config.entityName, config.swimLaneSource, metadata);

      appDispatch({ type: "setConfig", payload: config });
      appDispatch({ type: "setMetadata", payload: metadata });
      appDispatch({ type: "setSeparatorMetadata", payload: attributeMetadata });

      const { value: views} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$filter=returnedtypecode eq '${config.entityName}' and querytype eq 0`});
      setViews(views);
      setSelectedView(views[0]);

      const data = await fetchData(config, attributeMetadata);
      appDispatch({ type: "setBoardData", payload: data });
    }

    initializeConfig();
  }, []);

  const verifyDeletion = () => setShowDeletionVerification(true);
  const hideDeletionVerification = () => setShowDeletionVerification(false);

  const deleteRecord = () => {

  };

  const refresh = async () => {
    const data = await fetchData(appState.config, appState.separatorMetadata);
    appDispatch({ type: "setBoardData", payload: data });
  };

  const newRecord = async () => {
    await Xrm.Navigation.openForm({ entityName: appState.config.entityName, useQuickCreateForm: true }, undefined);
    refresh();
  };

  const setView = (event: any) => {
    const viewId = event.target.id;

    setSelectedView(views.find(v => v.savedqueryid === viewId));
    refresh();
  };

  return (
    <div style={{height: "100%"}}>
      <UserInputModal title="Verify Deletion" yesCallBack={deleteRecord} finally={hideDeletionVerification} show={showDeletionVerification}>
        <div>Are you sure you want to delete  '{appState.selectedRecord && appState.selectedRecord.name}' (ID: {appState.selectedRecord && appState.selectedRecord.id})?</div>
      </UserInputModal>
      <Navbar bg="light" variant="light" fixed="top">
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="pull-left">
            <DropdownButton id="viewSelector" title={selectedView?.name ?? "Select view"}>
              { views?.map(v => <Dropdown.Item onClick={setView} as="button" id={v.savedqueryid} key={v.savedqueryid}>{v.name}</Dropdown.Item>) }
            </DropdownButton>
          </Nav>
          <Nav className="pull-right">
            { appState.config && appState.config.showCreateButton && <Button onClick={newRecord}>Create New</Button> }
            <Button style={{marginLeft: "5px"}} onClick={refresh}>Refresh</Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Card style={{marginTop: "54px"}}>
        <div id="flexContainer" style={{ display: "flex", margin: "5px", flexDirection: "row" }}>
          { appState.boardData && appState.boardData.map(d => <Lane key={`lane_${d.option?.Value ?? "fallback"}`} lane={d} />)}
        </div>
      </Card>
    </div>
  );
};
