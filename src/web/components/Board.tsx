import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Button, Card, Col, Row, DropdownButton, Dropdown, FormControl, Badge, InputGroup } from "react-bootstrap";
import WebApiClient from "xrm-webapi-client";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import { UserInputModal } from "./UserInputModalProps";
import { useAppContext } from "../domain/AppState";
import { formatGuid } from "../domain/GuidFormatter";
import { Lane } from "./Lane";
import { Metadata, Attribute, Option } from "../domain/Metadata";
import { SavedQuery } from "../domain/SavedQuery";
import { CardForm, parseCardForm } from "../domain/CardForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import { Tile } from "./Tile";
import { DndContainer } from "./DndContainer";
import { loadExternalScript } from "../domain/LoadExternalScript";
import { useConfigContext } from "../domain/ConfigState";
import { useActionContext } from "../domain/ActionState";

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

type DisplayState = "simple" | "advanced";

export const Board = () => {
  const [ appState, appDispatch ] = useAppContext();
  const [ actionState, actionDispatch ] = useActionContext();
  const [ configState, configDispatch ] = useConfigContext();

  const [ views, setViews ]: [ Array<SavedQuery>, (views: Array<SavedQuery>) => void ] = useState([]);
  const [ secondaryViews, setSecondaryViews ]: [ Array<SavedQuery>, (views: Array<SavedQuery>) => void ] = useState([]);
  const [ cardForms, setCardForms ]: [Array<CardForm>, (forms: Array<CardForm>) => void ] = useState([]);
  const [ secondaryCardForms, setSecondaryCardForms ]: [Array<CardForm>, (forms: Array<CardForm>) => void ] = useState([]);
  const [ showDeletionVerification, setShowDeletionVerification ] = useState(false);
  const [ stateFilters, setStateFilters ]: [Array<Option>, (options: Array<Option>) => void] = useState([]);
  const [ displayState, setDisplayState ]: [DisplayState, (state: DisplayState) => void] = useState("simple" as any);
  const [ searchText, setSearch] = useState("");
  const [ appliedSearchText, setAppliedSearch ] = useState(undefined);

  useEffect(() => {
    async function initializeConfig() {
      try {
        const userId = formatGuid(Xrm.Page.context.getUserId());

        actionDispatch({ type: "setProgressText", payload: "Retrieving user settings" });

        const user = await WebApiClient.Retrieve({ entityName: "systemuser", entityId: userId, queryParams: "?$select=oss_defaultboardid"});

        actionDispatch({ type: "setProgressText", payload: "Fetching configuration" });

        const config = await fetchConfig(user.oss_defaultboardid);

        if (config.customScriptUrl) {
          actionDispatch({ type: "setProgressText", payload: "Loading custom scripts" });
          await loadExternalScript(config.customScriptUrl);
        }

        actionDispatch({ type: "setProgressText", payload: "Fetching meta data" });

        const metadata = await fetchMetadata(config.entityName);
        const attributeMetadata = await fetchSeparatorMetadata(config.entityName, config.swimLaneSource, metadata);
        const stateMetadata = await fetchSeparatorMetadata(config.entityName, "statecode", metadata);

        const notificationMetadata = await fetchMetadata("oss_notification");
        configDispatch({ type: "setSecondaryMetadata", payload: { entity: "oss_notification", data: notificationMetadata } });

        let secondaryMetadata: Metadata;
        let secondaryAttributeMetadata: Attribute;

        if (config.secondaryEntity) {
          secondaryMetadata = await fetchMetadata(config.secondaryEntity.logicalName);
          secondaryAttributeMetadata = await fetchSeparatorMetadata(config.secondaryEntity.logicalName, config.secondaryEntity.swimLaneSource, secondaryMetadata);

          configDispatch({ type: "setSecondaryMetadata", payload: { entity: config.secondaryEntity.logicalName, data: secondaryMetadata } });
          configDispatch({ type: "setSecondarySeparatorMetadata", payload: secondaryAttributeMetadata });
        }

        configDispatch({ type: "setConfig", payload: config });
        configDispatch({ type: "setMetadata", payload: metadata });
        configDispatch({ type: "setSeparatorMetadata", payload: attributeMetadata });
        configDispatch({ type: "setStateMetadata", payload: stateMetadata });
        actionDispatch({ type: "setProgressText", payload: "Fetching views" });

        const { value: views} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$select=layoutxml,fetchxml,savedqueryid,name&$filter=returnedtypecode eq '${config.entityName}' and querytype eq 0`});
        setViews(views);

        let defaultSecondaryView;
        if (config.secondaryEntity) {
          const { value: secondaryViews} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$select=layoutxml,fetchxml,savedqueryid,name&$filter=returnedtypecode eq '${config.secondaryEntity.logicalName}' and querytype eq 0`});
          setSecondaryViews(secondaryViews);
          defaultSecondaryView = secondaryViews[0];

          actionDispatch({ type: "setSelectedSecondaryView", payload: defaultSecondaryView });
        }

        const defaultView = views[0];

        actionDispatch({ type: "setSelectedView", payload: defaultView });
        actionDispatch({ type: "setProgressText", payload: "Fetching forms" });

        const { value: forms} = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq '${config.entityName}' and type eq 11`});
        const processedForms = forms.map((f: any) => ({ ...f, parsed: parseCardForm(f) }));
        setCardForms(processedForms);

        const { value: notificationForms } = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq 'oss_notification' and type eq 11`});
        const processedNotificationForms = notificationForms.map((f: any) => ({ ...f, parsed: parseCardForm(f) }));
        configDispatch({ type: "setNotificationForm", payload: processedNotificationForms[0] });

        let defaultSecondaryForm;
        if (config.secondaryEntity) {
          const { value: forms} = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq '${config.secondaryEntity.logicalName}' and type eq 11`});
          const processedSecondaryForms = forms.map((f: any) => ({ ...f, parsed: parseCardForm(f) }));
          setSecondaryCardForms(processedSecondaryForms);

          defaultSecondaryForm = processedSecondaryForms[0];
          actionDispatch({ type: "setSelectedSecondaryForm", payload: defaultSecondaryForm });
        }

        const defaultForm = processedForms[0];

        actionDispatch({ type: "setSelectedForm", payload: defaultForm });

        actionDispatch({ type: "setProgressText", payload: "Fetching subscriptions" });
        const subscriptions = await fetchSubscriptions();
        appDispatch({ type: "setSubscriptions", payload: subscriptions });

        actionDispatch({ type: "setProgressText", payload: "Fetching notifications" });
        const notifications = await fetchNotifications(config);
        appDispatch({ type: "setNotifications", payload: notifications });

        actionDispatch({ type: "setProgressText", payload: "Fetching data" });

        const data = await fetchData(config.entityName, defaultView.fetchxml, config.swimLaneSource, defaultForm, metadata, attributeMetadata);

        if (config.secondaryEntity) {
          const secondaryData = await fetchData(config.secondaryEntity.logicalName,
            defaultSecondaryView.fetchxml,
            config.secondaryEntity.swimLaneSource,
            defaultSecondaryForm, secondaryMetadata,
            secondaryAttributeMetadata,
            {
              additionalFields: [ config.secondaryEntity.parentLookup ],
              additionalConditions: [{
                attribute: config.secondaryEntity.parentLookup,
                operator: "in",
                values: data.length > 1 ? data.reduce((all, d) => [...all, ...d.data.map(laneData => laneData[metadata.PrimaryIdAttribute] as string)], [] as Array<string>) : ["00000000-0000-0000-0000-000000000000"]
              }]
            }
          );
          appDispatch({ type: "setSecondaryData", payload: secondaryData });
        }

        appDispatch({ type: "setBoardData", payload: data });
        actionDispatch({ type: "setProgressText", payload: undefined });
      }
      catch (e) {
        Xrm.Utility.alertDialog(e?.message ?? e, () => {});
      }
    }

    initializeConfig();
  }, []);

  const verifyDeletion = () => setShowDeletionVerification(true);
  const hideDeletionVerification = () => setShowDeletionVerification(false);

  const deleteRecord = () => {

  };

  const newRecord = async () => {
    const result = await Xrm.Navigation.openForm({ entityName: configState.config.entityName, useQuickCreateForm: true }, undefined);

    if (result && result.savedEntityReference) {
      refreshBoard();
    }
  };

  const setView = (event: any) => {
    const viewId = event.target.id;
    const view = views.find(v => v.savedqueryid === viewId);

    actionDispatch({ type: "setSelectedView", payload: view });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, view.fetchxml);
  };

  const setForm = (event: any) => {
    const formId = event.target.id;
    const form = cardForms.find(f => f.formid === formId);

    actionDispatch({ type: "setSelectedForm", payload: form });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, form);
  };

  const setSecondaryView = (event: any) => {
    const viewId = event.target.id;
    const view = secondaryViews.find(v => v.savedqueryid === viewId);

    actionDispatch({ type: "setSelectedSecondaryView", payload: view });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, undefined, view.fetchxml, undefined);
  };

  const setSecondaryForm = (event: any) => {
    const formId = event.target.id;
    const form = secondaryCardForms.find(f => f.formid === formId);

    actionDispatch({ type: "setSelectedSecondaryForm", payload: form });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, undefined, undefined, form);
  };

  const setStateFilter = (event: any) => {
    const stateValue = event.target.id;

    if (stateFilters.some(f => f.Value == stateValue)) {
      setStateFilters(stateFilters.filter(f => f.Value != stateValue));
    }
    else {
      setStateFilters([...stateFilters, configState.stateMetadata.OptionSet.Options.find(o => o.Value == stateValue)]);
    }
  };

  const setSimpleDisplay = () => {
    setDisplayState("simple");
  };

  const setSecondaryDisplay = () => {
    setDisplayState("advanced");
  };

  const setSearchText = (e: any) => {
    setSearch(e.target.value ?? "");
  };

  const search = () => {
    setAppliedSearch(searchText || undefined);
  };

  const onSearchKey = (e: any) => {
    if (e.key === "Enter") {
      search();
    }
  };

  const refreshBoard = () => {
    return refresh(appDispatch, appState, configState, actionDispatch, actionState);
  };

  const advancedData = React.useMemo(() => {
    return displayState === "advanced" && appState.boardData &&
    appState.boardData.filter(d => !stateFilters.length || stateFilters.some(f => f.Value === d.option.State))
    .map(d => !appliedSearchText ? d : { ...d, data: d.data.filter(data => Object.keys(data).some(k => `${data[k]}`.toLowerCase().includes(appliedSearchText.toLowerCase()))) })
    .reduce((all, curr) => all.concat(curr.data.filter(d => appState.secondaryData.some(t => t.data.some(tt => tt[`_${configState.config.secondaryEntity.parentLookup}_value`] === d[configState.metadata.PrimaryIdAttribute]))).map(d => <Tile
      notifications={!appState.notifications ? [] : appState.notifications[d[configState.metadata.PrimaryIdAttribute]]}
      borderColor={curr.option.Color ?? "#3b79b7"}
      cardForm={actionState.selectedForm}
      metadata={configState.metadata}
      key={`tile_${d[configState.metadata.PrimaryIdAttribute]}`}
      style={{ margin: "5px" }}
      data={d}
      refresh={refreshBoard}
      searchText={appliedSearchText}
      subscriptions={appState.subscriptions}
      selectedSecondaryForm={actionState.selectedSecondaryForm}
      secondaryNotifications={appState.notifications}
      secondaryData={appState.secondaryData.map(s => ({ ...s, data: s.data.filter(sd => sd[`_${configState.config.secondaryEntity.parentLookup}_value`] === d[configState.metadata.PrimaryIdAttribute])}))} />)), []);
  }, [displayState, appState.boardData, appState.secondaryData, stateFilters, appliedSearchText, appState.notifications, appState.subscriptions, actionState.selectedSecondaryForm]);

    const simpleData = React.useMemo(() => {
      return appState.boardData && appState.boardData
      .filter(d => !stateFilters.length || stateFilters.some(f => f.Value === d.option.State))
      .map(d => !appliedSearchText ? d : { ...d, data: d.data.filter(data => Object.keys(data).some(k => `${data[k]}`.toLowerCase().includes(appliedSearchText.toLowerCase()))) })
      .map(d => <Lane
        notifications={appState.notifications}
        key={`lane_${d.option?.Value ?? "fallback"}`}
        cardForm={actionState.selectedForm}
        metadata={configState.metadata}
        refresh={refreshBoard}
        searchText={appliedSearchText}
        subscriptions={appState.subscriptions}
        lane={{...d, data: d.data.filter(r => displayState === "simple" || appState.secondaryData && appState.secondaryData.every(t => t.data.every(tt => tt[`_${configState.config.secondaryEntity.parentLookup}_value`] !== r[configState.metadata.PrimaryIdAttribute])))}} />);
    }, [appState.boardData, stateFilters, appState.secondaryData, appliedSearchText, appState.notifications]);

  return (
    <div style={{height: "100%"}}>
      <UserInputModal title="Verify Deletion" yesCallBack={deleteRecord} finally={hideDeletionVerification} show={showDeletionVerification}>
        <div>Are you sure you want to delete  '{actionState.selectedRecord && actionState.selectedRecord.name}' (ID: {actionState.selectedRecord && actionState.selectedRecord.id})?</div>
      </UserInputModal>
      <Navbar bg="light" variant="light" fixed="top">
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="pull-left">
            <DropdownButton variant="outline-primary" id="viewSelector" title={<>{actionState.selectedView?.name} <Badge variant="primary">{appState?.boardData?.reduce((count, l) => count + l.data.length, 0)}</Badge></> ?? "Select view"}>
              { views?.map(v => <Dropdown.Item onClick={setView} as="button" id={v.savedqueryid} key={v.savedqueryid}>{v.name}</Dropdown.Item>) }
            </DropdownButton>
            <DropdownButton variant="outline-primary" id="formSelector" title={actionState.selectedForm?.name ?? "Select form"} style={{marginLeft: "5px"}}>
              { cardForms?.map(f => <Dropdown.Item onClick={setForm} as="button" id={f.formid} key={f.formid}>{f.name}</Dropdown.Item>) }
            </DropdownButton>
            <DropdownButton variant="outline-primary" id="displaySelector" title={displayState === "simple" ? "Simple" : "Advanced"} style={{marginLeft: "5px"}}>
              <Dropdown.Item onClick={setSimpleDisplay} as="button" id="display_simple">Simple</Dropdown.Item>
              <Dropdown.Item onClick={setSecondaryDisplay} as="button" id="display_secondarys">Advanced</Dropdown.Item>
            </DropdownButton>
            { displayState === "advanced" &&
              <>
                <DropdownButton variant="outline-primary" id="secondaryViewSelector" title={actionState.selectedSecondaryView?.name ?? "Select view"} style={{marginLeft: "5px"}}>
                  { secondaryViews?.map(v => <Dropdown.Item onClick={setSecondaryView} as="button" id={v.savedqueryid} key={v.savedqueryid}>{v.name}</Dropdown.Item>) }
                </DropdownButton>
                <DropdownButton variant="outline-primary" id="secondaryFormSelector" title={actionState.selectedSecondaryForm?.name ?? "Select form"} style={{marginLeft: "5px"}}>
                  { secondaryCardForms?.map(f => <Dropdown.Item onClick={setSecondaryForm} as="button" id={f.formid} key={f.formid}>{f.name}</Dropdown.Item>) }
                </DropdownButton>
              </>
            }
            { configState.config?.swimLaneSource === "statuscode" &&
              <DropdownButton variant="outline-primary" id="formSelector" title={stateFilters.length ? stateFilters.map(f => f.Label.UserLocalizedLabel.Label).join("|") : "All states"} style={{marginLeft: "5px"}}>
                { configState.stateMetadata?.OptionSet.Options.map(o => <Dropdown.Item onClick={setStateFilter} as="button" id={o.Value} key={o.Value}>{o.Label.UserLocalizedLabel.Label}</Dropdown.Item>) }
              </DropdownButton>
            }
            <InputGroup style={{marginLeft: "5px"}}>
              <FormControl
                value={searchText}
                onChange={setSearchText}
                onKeyPress={onSearchKey}
                placeholder="Filter records"
              />
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={search}><FontAwesomeIcon icon="search" /></Button>
              </InputGroup.Append>
            </InputGroup>
          </Nav>
          <Nav className="pull-right">
            <Button title="Work Indicator" disabled={!actionState.workIndicator} variant="outline-primary">
              <FontAwesomeIcon spin={!!actionState.workIndicator} icon="spinner" />
            </Button>
            { configState.config && configState.config.showCreateButton && <Button style={{marginLeft: "5px"}}  variant="outline-primary" onClick={newRecord}>Create New</Button> }
            <Button variant="outline-primary" style={{marginLeft: "5px"}} onClick={refreshBoard}>
              <FontAwesomeIcon icon="sync" />
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <DndContainer>
        <div id="advancedContainer" style={{ display: "flex", flexDirection: "column", overflow: "inherit" }}>
          { advancedData }
        </div>
        <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflow: "inherit" }}>
          { simpleData }
        </div>
      </DndContainer>
    </div>
  );
};
