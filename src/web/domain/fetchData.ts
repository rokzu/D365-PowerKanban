import { BoardLane } from "./BoardLane";
import { BoardViewConfig } from "./BoardViewConfig";
import { Attribute, Metadata } from "./Metadata";
import WebApiClient from "xrm-webapi-client";
import { CardForm, CardSegment } from "./CardForm";
import { Dispatch, AppStateProps } from "./AppState";
import { OperationalError } from "bluebird";
import { Notification } from "../domain/Notification";

const getFieldsFromSegment = (segment: CardSegment): Array<string> => segment.rows.reduce((all, curr) => [...all, ...curr.cells.map(c => c.field)], []);

export const fetchData = async (entityName: string, fetchXml: string, swimLaneSource: string, form: CardForm, metadata: Metadata, attribute: Attribute, options?: { additionalFields?: Array<string>, hideEmptyLanes?: boolean; additionalConditions?: Array<{ attribute: string; operator: string; values?: Array<string>; }> }): Promise<Array<BoardLane>> => {
  try {
    const formFields = Array.from(new Set([...getFieldsFromSegment(form.parsed.header), ...getFieldsFromSegment(form.parsed.body), ...getFieldsFromSegment(form.parsed.footer)]));

    // We make sure that the swim lane source is always included without having to update all views
    if (formFields.every(f => f !== swimLaneSource)) {
      formFields.push(swimLaneSource);
    }

    if (options?.additionalFields) {
      options.additionalFields.forEach(f => {
        if (formFields.every(f => f !== swimLaneSource)) {
          formFields.push(swimLaneSource);
        }
      });
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(fetchXml, "application/xml");
    const root = xml.getElementsByTagName("fetch")[0];
    const entity = root.getElementsByTagName("entity")[0];

    // Set no-lock on fetch
    root.setAttribute("no-lock", "true");

    // Remove all currently set attributes
    Array.from(entity.getElementsByTagName("attribute")).forEach(a => entity.removeChild(a));
    Array.from(entity.getElementsByTagName("link-entity")).forEach(l => {
      const attributes = Array.from(l.getElementsByTagName("attribute"));
      attributes.forEach(a => l.removeChild(a));
    });

    // Add all attributes required for rendering
    [metadata.PrimaryIdAttribute].concat(formFields).concat(options?.additionalFields ?? [])
    .map(a => {
      const e = xml.createElement("attribute");
      e.setAttribute("name", a);

      return e;
    })
    .forEach(e => {
      entity.append(e);
    });

    if (options?.additionalConditions?.length) {
      const filter = xml.createElement("filter");

      (options.additionalConditions)
      .forEach(c => {
        const condition = xml.createElement("condition");
        condition.setAttribute("attribute", c.attribute);
        condition.setAttribute("operator", c.operator);

        if (c.operator.toLowerCase() === "in") {
          c.values.forEach(v => {
            const value = xml.createElement("value");
            value.textContent = v;

            condition.append(value);
          });
        }
        else if (c.values?.length) {
          condition.setAttribute("value", c.values[0]);
        }

        filter.append(condition);
        entity.append(filter);
      });
    }

    const serializer = new XMLSerializer();
    const fetch = serializer.serializeToString(xml);

    const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: entityName, fetchXml: fetch, returnAllPages: true, headers: [ { key: "Prefer", value: "odata.include-annotations=\"*\"" } ] });

    const lanes = attribute.AttributeType === "Boolean" ? [ attribute.OptionSet.FalseOption, attribute.OptionSet.TrueOption ] : attribute.OptionSet.Options.sort((a, b) => a.State - b.State);

    return data.reduce((all: Array<BoardLane>, record) => {
      const laneSource = record[swimLaneSource];

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
      }, options?.hideEmptyLanes ? [] : lanes.map(l => ({ option: l, data: [] })) as Array<BoardLane>);
  }
  catch (e) {
    Xrm.Utility.alertDialog(e?.message ?? e, () => {});
  }
};

export const fetchSubscriptions = async () => {
  const { value: data } = await WebApiClient.Retrieve({
    entityName: "oss_subscription",
    queryParams: `?$filter=_ownerid_value eq ${Xrm.Page.context.getUserId().replace("{", "").replace("}", "")}&$orderby=createdon desc`,
    returnAllPages: true
  });

  return data;
};

export const fetchNotifications = async () => {
  const { value: data } = await WebApiClient.Retrieve({
    entityName: "oss_notification",
    queryParams: `?$filter=_ownerid_value eq ${Xrm.Page.context.getUserId().replace("{", "").replace("}", "")}&$orderby=createdon desc`,
    returnAllPages: true,
    headers: [ { key: "Prefer", value: "odata.include-annotations=\"*\"" } ]
  });

  return data.map((d: Notification) => ({...d, parsed: d.oss_data ? JSON.parse(d.oss_data) : undefined }));
};

export const refresh = async (appDispatch: Dispatch, appState: AppStateProps, fetchXml?: string, selectedForm?: CardForm, secondaryFetchXml?: string, secondarySelectedForm?: CardForm) => {
  appDispatch({ type: "setProgressText", payload: "Fetching data" });

  try {
    const data = await fetchData(appState.config.entityName,
      fetchXml ?? appState.selectedView.fetchxml,
      appState.config.swimLaneSource,
      selectedForm ?? appState.selectedForm,
      appState.metadata,
      appState.separatorMetadata
    );
    appDispatch({ type: "setBoardData", payload: data });

    const secondaryData = await fetchData(appState.config.secondaryEntity.logicalName,
      secondaryFetchXml ?? appState.selectedSecondaryView.fetchxml,
      appState.config.secondaryEntity.swimLaneSource,
      secondarySelectedForm ?? appState.selectedSecondaryForm,
      appState.secondaryMetadata[appState.config.secondaryEntity.logicalName],
      appState.secondarySeparatorMetadata,
      {
        additionalFields: [
          appState.config.secondaryEntity.parentLookup
        ],
        additionalConditions: [
          {
            attribute: appState.config.secondaryEntity.parentLookup,
            operator: "in",
            values: data.length > 1 ? data.reduce((all, d) => [...all, ...d.data.map(laneData => laneData[appState.metadata.PrimaryIdAttribute] as string)], [] as Array<string>) : ["00000000-0000-0000-0000-000000000000"]
          }
        ]
      }
    );

    appDispatch({ type: "setSecondaryData", payload: secondaryData });

    appDispatch({ type: "setProgressText", payload: "Fetching notifications" });
    const notifications = await fetchNotifications();
    appDispatch({ type: "setNotifications", payload: notifications });
  }
  catch (e) {
    Xrm.Utility.alertDialog(e?.message ?? e, () => {});
  }

  appDispatch({ type: "setProgressText", payload: undefined });
};