import * as React from "react";
import { Navbar, Nav, Button, Card, Col, Row, DropdownButton, Dropdown, FormControl, Badge, InputGroup, Spinner } from "react-bootstrap";
import * as WebApiClient from "xrm-webapi-client";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import { UserInputModal } from "./UserInputModalProps";
import { useAppContext } from "../domain/AppState";
import { formatGuid } from "../domain/GuidFormatter";
import { Lane } from "./Lane";
import { Metadata, Attribute, Option } from "../domain/Metadata";
import { SavedQuery } from "../domain/SavedQuery";
import { CardForm, parseCardForm } from "../domain/CardForm";
import { fetchData, refresh, fetchSubscriptions, fetchNotifications } from "../domain/fetchData";
import { Tile } from "./Tile";
import { DndContainer } from "./DndContainer";
import { loadExternalScript } from "../domain/LoadExternalScript";
import { useConfigContext } from "../domain/ConfigState";
import { useActionContext } from "../domain/ActionState";
import { List, CellMeasurerCache, CellMeasurer } from "react-virtualized";
import AutoSizer from "react-virtualized-auto-sizer";
import { useMeasurerState, useMeasurerContext } from "../domain/MeasurerState";

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
  const field = metadata.Attributes.find(a => a.LogicalName.toLowerCase() === swimLaneSource.toLowerCase())!;
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
  const [ measurerState, measurerDispatch ] = useMeasurerContext();

  const advancedList = React.useRef<List>(null);

  const [ views, setViews ] = React.useState<Array<SavedQuery>>([]);
  const [ secondaryViews, setSecondaryViews ] = React.useState<Array<SavedQuery>>([]);
  const [ cardForms, setCardForms ] = React.useState<Array<CardForm>>([]);
  const [ secondaryCardForms, setSecondaryCardForms ] = React.useState<Array<CardForm>>([]);
  const [ showDeletionVerification, setShowDeletionVerification ] = React.useState(false);
  const [ stateFilters, setStateFilters ] = React.useState<Array<Option>>([]);
  const [ displayState, setDisplayState ] = React.useState<DisplayState>("simple" as any);
  const [ searchText, setSearch] = React.useState("");
  const [ appliedSearchText, setAppliedSearch ] = React.useState(undefined);

  const getConfigId = async () => {
    if (configState.configId) {
      return configState.configId;
    }

    const userId = formatGuid(Xrm.Page.context.getUserId());
    const user = await WebApiClient.Retrieve({ entityName: "systemuser", entityId: userId, queryParams: "?$select=oss_defaultboardid"});

    return user.oss_defaultboardid;
  };

  const initializeConfig = async () => {
    try {
      appDispatch({ type: "setSecondaryData", payload: [] });
      appDispatch({ type: "setBoardData", payload: [] });
      measurerDispatch.resetMeasurementCache();

      const configId = await getConfigId();

      if (!configId) {
        actionDispatch({ type: "setConfigSelectorDisplayState", payload: true });
        return;
      }

      actionDispatch({ type: "setProgressText", payload: "Fetching configuration" });
      const config = await fetchConfig(configId);

      if (config.customScriptUrl) {
        actionDispatch({ type: "setProgressText", payload: "Loading custom scripts" });
        await loadExternalScript(config.customScriptUrl);
      }

      actionDispatch({ type: "setProgressText", payload: "Fetching meta data" });

      const metadata = await fetchMetadata(config.primaryEntity.logicalName);
      const attributeMetadata = await fetchSeparatorMetadata(config.primaryEntity.logicalName, config.primaryEntity.swimLaneSource, metadata);
      const stateMetadata = await fetchSeparatorMetadata(config.primaryEntity.logicalName, "statecode", metadata);

      const lanes = attributeMetadata.AttributeType === "Boolean"
        ? [ attributeMetadata.OptionSet.FalseOption.Value, attributeMetadata.OptionSet.TrueOption.Value ]
        : attributeMetadata.OptionSet.Options.map(o => o.Value);

      measurerDispatch.initializeCaches([ "advanced", ...lanes.map(o => `primary-${o.toString()}`) ]);

      const notificationMetadata = await fetchMetadata("oss_notification");
      configDispatch({ type: "setSecondaryMetadata", payload: { entity: "oss_notification", data: notificationMetadata } });

      let secondaryMetadata: Metadata;
      let secondaryAttributeMetadata: Attribute;

      if (config.secondaryEntity) {
        secondaryMetadata = await fetchMetadata(config.secondaryEntity.logicalName);
        secondaryAttributeMetadata = await fetchSeparatorMetadata(config.secondaryEntity.logicalName, config.secondaryEntity.swimLaneSource, secondaryMetadata);

        configDispatch({ type: "setSecondaryMetadata", payload: { entity: config.secondaryEntity.logicalName, data: secondaryMetadata } });
        configDispatch({ type: "setSecondarySeparatorMetadata", payload: secondaryAttributeMetadata });

        const secondaryLanes = secondaryAttributeMetadata.AttributeType === "Boolean"
        ? [ secondaryAttributeMetadata.OptionSet.FalseOption.Value, secondaryAttributeMetadata.OptionSet.TrueOption.Value ]
        : secondaryAttributeMetadata.OptionSet.Options.map(o => o.Value);

        measurerDispatch.initializeCaches([ "advanced", ...lanes.map(o => `primary-${o.toString()}`), ...secondaryLanes.map(o => `secondary-${o.toString()}`) ]);
      }

      configDispatch({ type: "setConfig", payload: config });
      configDispatch({ type: "setMetadata", payload: metadata });
      configDispatch({ type: "setSeparatorMetadata", payload: attributeMetadata });
      configDispatch({ type: "setStateMetadata", payload: stateMetadata });
      actionDispatch({ type: "setProgressText", payload: "Fetching views" });

      const { value: views} = await WebApiClient.Retrieve({entityName: "savedquery", queryParams: `?$select=layoutxml,fetchxml,savedqueryid,name&$filter=returnedtypecode eq '${config.primaryEntity.logicalName}' and querytype eq 0`});
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

      const { value: forms} = await WebApiClient.Retrieve({entityName: "systemform", queryParams: `?$select=formxml,name&$filter=objecttypecode eq '${config.primaryEntity.logicalName}' and type eq 11`});
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

      if (!defaultForm) {
        actionDispatch({ type: "setProgressText", payload: undefined });
        return Xrm.Utility.alertDialog(`Did not find any card forms for ${config.primaryEntity.logicalName}, please create one.`, () => {});
      }

      actionDispatch({ type: "setSelectedForm", payload: defaultForm });

      actionDispatch({ type: "setProgressText", payload: "Fetching subscriptions" });
      const subscriptions = await fetchSubscriptions(config);
      appDispatch({ type: "setSubscriptions", payload: subscriptions });

      actionDispatch({ type: "setProgressText", payload: "Fetching notifications" });
      const notifications = await fetchNotifications(config);
      appDispatch({ type: "setNotifications", payload: notifications });

      actionDispatch({ type: "setProgressText", payload: "Fetching data" });

      const data = await fetchData(config.primaryEntity.logicalName, defaultView.fetchxml, config.primaryEntity.swimLaneSource, defaultForm, metadata, attributeMetadata);

      if (config.secondaryEntity) {
        const secondaryData = await fetchData(config.secondaryEntity.logicalName,
          defaultSecondaryView.fetchxml,
          config.secondaryEntity.swimLaneSource,
          defaultSecondaryForm,
          secondaryMetadata,
          secondaryAttributeMetadata,
          {
            additionalFields: [ config.secondaryEntity.parentLookup ],
            additionalCondition: {
              attribute: config.secondaryEntity.parentLookup,
              operator: "in",
              values: data.some(d => d.data.length > 1) ? data.reduce((all, d) => [...all, ...d.data.map(laneData => laneData[metadata.PrimaryIdAttribute] as string)], [] as Array<string>) : ["00000000-0000-0000-0000-000000000000"]
            }
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
  };

  React.useEffect(() => void advancedList && advancedList.current && advancedList.current.recomputeRowHeights(), [ measurerState.measurementCaches["advanced"] ]);

  React.useEffect(() => {
    initializeConfig();
  }, [ configState.configId ]);

  const verifyDeletion = () => setShowDeletionVerification(true);
  const hideDeletionVerification = () => setShowDeletionVerification(false);

  const deleteRecord = () => {

  };

  const newRecord = async () => {
    const result = await Xrm.Navigation.openForm({ entityName: configState.config.primaryEntity.logicalName, useQuickCreateForm: true }, undefined);

    if (result && result.savedEntityReference) {
      refreshBoard();
    }
  };

  const setView = (event: any) => {
    const viewId = event.target.id;
    const view = views.find(v => v.savedqueryid === viewId);

    actionDispatch({ type: "setSelectedView", payload: view });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, view.fetchxml);
    measurerDispatch.resetMeasurementCache();
  };

  const setForm = (event: any) => {
    const formId = event.target.id;
    const form = cardForms.find(f => f.formid === formId);

    actionDispatch({ type: "setSelectedForm", payload: form });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, form);
    measurerDispatch.resetMeasurementCache();
  };

  const setSecondaryView = (event: any) => {
    const viewId = event.target.id;
    const view = secondaryViews.find(v => v.savedqueryid === viewId);

    actionDispatch({ type: "setSelectedSecondaryView", payload: view });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, undefined, view.fetchxml, undefined);
    measurerDispatch.resetMeasurementCache();
  };

  const setSecondaryForm = (event: any) => {
    const formId = event.target.id;
    const form = secondaryCardForms.find(f => f.formid === formId);

    actionDispatch({ type: "setSelectedSecondaryForm", payload: form });
    refresh(appDispatch, appState, configState, actionDispatch, actionState, undefined, undefined, undefined, form);
    measurerDispatch.resetMeasurementCache();
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
    measurerDispatch.resetMeasurementCache();
    setAppliedSearch(searchText || undefined);
  };

  const onSearchKey = (e: any) => {
    if (e.key === "Enter") {
      search();
    }
  };

  const refreshBoard = async () => {
    await refresh(appDispatch, appState, configState, actionDispatch, actionState);
    measurerDispatch.resetMeasurementCache();
  };

  const openConfigSelector = () => {
    actionDispatch({ type: "setConfigSelectorDisplayState", payload: true });
  };

  // Passing of a new object on each render (which we are doing) will cause all advanced data tiles to rerender, since objects are only compared shallowly
  // Not doing this will make the rerender logic very complex, so we don't do that for now
  const advancedTileStyle = { margin: "5px" };

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
      style={advancedTileStyle}
      data={d}
      refresh={refreshBoard}
      searchText={appliedSearchText}
      subscriptions={!appState.subscriptions ? [] : appState.subscriptions[d[configState.metadata.PrimaryIdAttribute]]}
      selectedSecondaryForm={actionState.selectedSecondaryForm}
      secondaryNotifications={appState.notifications}
      secondarySubscriptions={appState.subscriptions}
      config={configState.config.primaryEntity}
      separatorMetadata={configState.separatorMetadata}
      preventDrag={true}
      secondaryData={appState.secondaryData.map(s => ({ ...s, data: s.data.filter(sd => sd[`_${configState.config.secondaryEntity.parentLookup}_value`] === d[configState.metadata.PrimaryIdAttribute])}))} />)), []);
  }, [displayState, appState.boardData, appState.secondaryData, stateFilters, appliedSearchText, appState.notifications, appState.subscriptions, actionState.selectedSecondaryForm, configState.configId]);

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
      subscriptions={appState.subscriptions}
      searchText={appliedSearchText}
      config={configState.config.primaryEntity}
      separatorMetadata={configState.separatorMetadata}
      lane={{...d, data: d.data.filter(r => displayState === "simple" || appState.secondaryData && appState.secondaryData.every(t => t.data.every(tt => tt[`_${configState.config.secondaryEntity.parentLookup}_value`] !== r[configState.metadata.PrimaryIdAttribute])))}} />);
  }, [appState.boardData, appState.subscriptions, stateFilters, appState.secondaryData, appliedSearchText, appState.notifications, configState.configId]);

  const rowRenderer = ({key, index, parent, isScrolling, isVisible, style}: {
    key: string;
    index: number;
    parent: any;
    isScrolling: boolean;
    isVisible: boolean;
    style: React.CSSProperties
  }) => (
    <CellMeasurer
        cache={measurerState.measurementCaches["advanced"]}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
    >
      <div style={style}>
        { advancedData[index] }
      </div>
    </CellMeasurer>
  );

  return (
    <div style={{height: "100%", display: "flex", flexDirection: "column" }}>
      <UserInputModal title="Verify Deletion" yesCallBack={deleteRecord} finally={hideDeletionVerification} show={showDeletionVerification}>
        <div>Are you sure you want to delete  '{actionState.selectedRecord && actionState.selectedRecord.name}' (ID: {actionState.selectedRecord && actionState.selectedRecord.id})?</div>
      </UserInputModal>
      <Navbar bg="light" variant="light">
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="pull-left">
            <Button title="Config Selector" onClick={openConfigSelector} variant="outline-primary"><span><i className="fa fa-th" aria-hidden="true"></i></span></Button>
            <DropdownButton style={{marginLeft: "5px"}} variant="outline-primary" id="viewSelector" title={<>{actionState.selectedView?.name} <Badge variant="primary">{appState?.boardData?.reduce((count, l) => count + l.data.length, 0)}</Badge></> ?? "Select view"}>
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
            { configState.config?.primaryEntity.swimLaneSource === "statuscode" &&
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
                <Button variant="outline-secondary" onClick={search}><span><i className="fa fa-search" aria-hidden="true"></i></span></Button>
              </InputGroup.Append>
            </InputGroup>
          </Nav>
          <Nav className="pull-right">
            <Button title="Work Indicator" disabled={!actionState.workIndicator} variant="outline-primary">
              { !!actionState.workIndicator &&
                <>
                  <Spinner animation="grow" size="sm" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                  <span className="sr-only">Loading...</span>
                </>
              }
              { !actionState.workIndicator &&
                <>
                  <span><i className="fas fa-circle" aria-hidden="true"></i></span>
                  <span className="sr-only">Idle</span>
                </>
              }
            </Button>
            { configState.config && configState.config.showCreateButton && <Button style={{marginLeft: "5px"}}  variant="outline-primary" onClick={newRecord}>Create New</Button> }
            <Button variant="outline-primary" style={{marginLeft: "5px"}} onClick={refreshBoard}>
              <span><i className="fa fa-sync" aria-hidden="true"></i></span>
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <DndContainer>
        { displayState === "advanced" &&
          <div id="advancedContainer" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "inherit", marginBottom: "5px" }}>
            <AutoSizer>
              {
                ({ height, width }) =>
                <List
                  ref={advancedList}
                  height={height}
                  rowCount={advancedData.length}
                  width={width}
                  rowRenderer={rowRenderer}
                  rowHeight={measurerState.measurementCaches["advanced"].rowHeight}
                  deferredMeasurementCache={measurerState.measurementCaches["advanced"]}
                  subscriptions={appState.subscriptions}
                  notifications={appState.notifications}
                >
                </List>
              }
            </AutoSizer>
          </div>
        }
        { displayState === "simple" &&
          <div id="flexContainer" style={{ display: "flex", flexDirection: "row", overflowX: "auto", overflowY: "hidden", flex: "1", marginBottom: "5px" }}>
            { simpleData }
          </div>
        }
      </DndContainer>
    </div>
  );
};
