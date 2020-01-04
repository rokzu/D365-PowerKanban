import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Button, Card, Col, Row, DropdownButton, Dropdown, FormControl } from "react-bootstrap";
import WebApiClient from "xrm-webapi-client";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import UserInputModal from "./UserInputModalProps";
import { useAppContext } from "../domain/AppState";
import { formatGuid } from "../domain/GuidFormatter";
import { Lane } from "./Lane";
import { Metadata, Attribute, Option } from "../domain/Metadata";
import { SavedQuery } from "../domain/SavedQuery";
import { CardForm, parseCardForm } from "../domain/CardForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData } from "../domain/fetchData";

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

type DisplayState = "simple" | "task";

export const Board = () => {
  const [ appState, appDispatch ] = useAppContext();
  const [ views, setViews ]: [ Array<SavedQuery>, (views: Array<SavedQuery>) => void ] = useState([]);
  const [ taskViews, setTaskViews ]: [ Array<SavedQuery>, (views: Array<SavedQuery>) => void ] = useState([]);
  const [ cardForms, setCardForms ]: [Array<CardForm>, (forms: Array<CardForm>) => void ] = useState([]);
  const [ taskCardForms, setTaskCardForms ]: [Array<CardForm>, (forms: Array<CardForm>) => void ] = useState([]);
  const [ showDeletionVerification, setShowDeletionVerification ] = useState(false);
  const [ stateFilters, setStateFilters ]: [Array<Option>, (options: Array<Option>) => void] = useState([]);
  const [ displayState, setDisplayState ]: [DisplayState, (state: DisplayState) => void] = useState("simple" as any);

  useEffect(() => {
    async function initializeConfig() {
      const userId = formatGuid(Xrm.Page.context.getUserId());

      appDispatch({ type: "setProgressText", payload: "Retrieving user settings" });

      const user = await WebApiClient.Retrieve({ entityName: "systemuser", entityId: userId, queryParams: "?$select=oss_defaultboardid"});

      appDispatch({ type: "setProgressText", payload: "Fetching configuration" });

      const config = await fetchConfig(user.oss_defaultboardid);

      appDispatch({ type: "setProgressText", payload: "Fetching meta data" });

      const metadata = await fetchMetadata(config.entityName);
      const attributeMetadata = await fetchSeparatorMetadata(config.entityName, config.swimLaneSource, metadata);
      const stateMetadata = await fetchSeparatorMetadata(config.entityName, "statecode", metadata);

      appDispatch({ type: "setConfig", payload: config });
      appDispatch({ type: "setMetadata", payload: metadata });
      appDispatch({ type: "setSeparatorMetadata", payload: attributeMetadata });
      appDispatch({ type: "setStateMetadata", payload: stateMetadata });
      appDispatch({ type: "setProgressText", payload: "Fetching views" });

      const { value: views} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$select=layoutxml,fetchxml,savedqueryid,name&$filter=returnedtypecode eq '${config.entityName}' and querytype eq 0`});
      setViews(views);

      if (config.secondaryEntities && config.secondaryEntities.length) {
        const { value: taskViews} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$select=layoutxml,fetchxml,savedqueryid,name&$filter=returnedtypecode eq '${config.secondaryEntities[0].logicalName}' and querytype eq 0`});
        setTaskViews(taskViews);
        const defaultTaskView = taskViews[0];

        appDispatch({ type: "setSelectedTaskView", payload: defaultTaskView });
      }

      const defaultView = views[0];

      appDispatch({ type: "setSelectedView", payload: defaultView });
      appDispatch({ type: "setProgressText", payload: "Fetching forms" });

      const { value: forms} = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq '${config.entityName}' and type eq 11`});
      const processedForms = forms.map((f: any) => ({ ...f, parsed: parseCardForm(f) }));
      setCardForms(processedForms);

      if (config.secondaryEntities && config.secondaryEntities.length) {
        const { value: forms} = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq '${config.secondaryEntities[0].logicalName}' and type eq 11`});
        const processedTaskForms = forms.map((f: any) => ({ ...f, parsed: parseCardForm(f) }));
        setTaskCardForms(processedTaskForms);

        const defaultTaskForm = processedTaskForms[0];
        appDispatch({ type: "setSelectedTaskForm", payload: defaultTaskForm });
      }

      const defaultForm = processedForms[0];

      appDispatch({ type: "setSelectedForm", payload: defaultForm });
      appDispatch({ type: "setProgressText", payload: "Fetching data" });

      const data = await fetchData(defaultView.fetchxml, defaultForm, config, metadata, attributeMetadata);

      appDispatch({ type: "setBoardData", payload: data });
      appDispatch({ type: "setProgressText", payload: undefined });
    }

    initializeConfig();
  }, []);

  const verifyDeletion = () => setShowDeletionVerification(true);
  const hideDeletionVerification = () => setShowDeletionVerification(false);

  const deleteRecord = () => {

  };

  const refresh = async (fetchXml?: string, selectedForm?: CardForm) => {
    appDispatch({ type: "setProgressText", payload: "Fetching data" });

    const data = await fetchData(fetchXml ?? appState.selectedView.fetchxml, selectedForm ?? appState.selectedForm, appState.config, appState.metadata, appState.separatorMetadata);

    appDispatch({ type: "setBoardData", payload: data });
    appDispatch({ type: "setProgressText", payload: undefined });
  };

  const newRecord = async () => {
    await Xrm.Navigation.openForm({ entityName: appState.config.entityName, useQuickCreateForm: true }, undefined);
    refresh();
  };

  const setView = (event: any) => {
    const viewId = event.target.id;
    const view = views.find(v => v.savedqueryid === viewId);

    appDispatch({ type: "setSelectedView", payload: view });
    refresh(view.fetchxml);
  };

  const setForm = (event: any) => {
    const formId = event.target.id;
    const form = cardForms.find(f => f.formid === formId);

    appDispatch({ type: "setSelectedForm", payload: form });
    refresh(undefined, form);
  };

  const setTaskView = (event: any) => {
    const viewId = event.target.id;
    const view = taskViews.find(v => v.savedqueryid === viewId);

    appDispatch({ type: "setSelectedTaskView", payload: view });
  };

  const setTaskForm = (event: any) => {
    const formId = event.target.id;
    const form = taskCardForms.find(f => f.formid === formId);

    appDispatch({ type: "setSelectedTaskForm", payload: form });
  };

  const setStateFilter = (event: any) => {
    const stateValue = event.target.id;

    if (stateFilters.some(f => f.Value == stateValue)) {
      setStateFilters(stateFilters.filter(f => f.Value != stateValue));
    }
    else {
      setStateFilters([...stateFilters, appState.stateMetadata.OptionSet.Options.find(o => o.Value == stateValue)]);
    }
  };

  const setSimpleDisplay = () => {
    setDisplayState("simple");
  };

  const setTaskDisplay = () => {
    setDisplayState("task");
  };

  return (
    <div style={{height: "100%"}}>
      <UserInputModal title="Verify Deletion" yesCallBack={deleteRecord} finally={hideDeletionVerification} show={showDeletionVerification}>
        <div>Are you sure you want to delete  '{appState.selectedRecord && appState.selectedRecord.name}' (ID: {appState.selectedRecord && appState.selectedRecord.id})?</div>
      </UserInputModal>
      <Navbar bg="light" variant="light" fixed="top">
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="pull-left">
            <DropdownButton id="viewSelector" title={appState.selectedView?.name ?? "Select view"}>
              { views?.map(v => <Dropdown.Item onClick={setView} as="button" id={v.savedqueryid} key={v.savedqueryid}>{v.name}</Dropdown.Item>) }
            </DropdownButton>
            <DropdownButton id="formSelector" title={appState.selectedForm?.name ?? "Select form"} style={{marginLeft: "5px"}}>
              { cardForms?.map(f => <Dropdown.Item onClick={setForm} as="button" id={f.formid} key={f.formid}>{f.name}</Dropdown.Item>) }
            </DropdownButton>
            <DropdownButton id="displaySelector" title={displayState === "simple" ? "Simple" : "Tasks"} style={{marginLeft: "5px"}}>
              <Dropdown.Item onClick={setSimpleDisplay} as="button" id="display_simple">Simple</Dropdown.Item>
              <Dropdown.Item onClick={setTaskDisplay} as="button" id="display_tasks">Tasks</Dropdown.Item>
            </DropdownButton>
            { displayState === "task" &&
              <>
                <DropdownButton id="taskViewSelector" title={appState.selectedTaskView?.name ?? "Select view"} style={{marginLeft: "5px"}}>
                  { taskViews?.map(v => <Dropdown.Item onClick={setTaskView} as="button" id={v.savedqueryid} key={v.savedqueryid}>{v.name}</Dropdown.Item>) }
                </DropdownButton>
                <DropdownButton id="taskFormSelector" title={appState.selectedTaskForm?.name ?? "Select form"} style={{marginLeft: "5px"}}>
                  { taskCardForms?.map(f => <Dropdown.Item onClick={setTaskForm} as="button" id={f.formid} key={f.formid}>{f.name}</Dropdown.Item>) }
                </DropdownButton>
              </>
            }
            { appState.config?.swimLaneSource === "statuscode" &&
              <DropdownButton id="formSelector" title={stateFilters.length ? stateFilters.map(f => f.Label.UserLocalizedLabel.Label).join("|") : "All states"} style={{marginLeft: "5px"}}>
                { appState.stateMetadata?.OptionSet.Options.map(o => <Dropdown.Item onClick={setStateFilter} as="button" id={o.Value} key={o.Value}>{o.Label.UserLocalizedLabel.Label}</Dropdown.Item>) }
              </DropdownButton>
            }
          </Nav>
          <Nav className="pull-right">
            { appState.config && appState.config.showCreateButton && <Button onClick={newRecord}>Create New</Button> }
            <Button style={{marginLeft: "5px"}} onClick={() => refresh()}>
              <FontAwesomeIcon icon="sync" />
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "inherit" }}>
        { appState.boardData && appState.boardData.filter(d => !stateFilters.length || stateFilters.some(f => f.Value === d.option.State)).map(d => <Lane key={`lane_${d.option?.Value ?? "fallback"}`} lane={d} />)}
      </div>
    </div>
  );
};
