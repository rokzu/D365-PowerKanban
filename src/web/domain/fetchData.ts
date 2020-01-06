import { BoardLane } from "./BoardLane";
import { BoardViewConfig } from "./BoardViewConfig";
import { Attribute, Metadata } from "./Metadata";
import WebApiClient from "xrm-webapi-client";
import { CardForm, CardSegment } from "./CardForm";
import { Dispatch, AppStateProps } from "./AppState";

const getFieldsFromSegment = (segment: CardSegment): Array<string> => segment.rows.reduce((all, curr) => [...all, ...curr.cells.map(c => c.field)], []);

export const fetchData = async (entityName: string, fetchXml: string, swimLaneSource: string, form: CardForm, metadata: Metadata, attribute: Attribute, options?: { additionalFields?: Array<string>, hideEmptyLanes?: boolean; additionalConditions?: Array<string> }): Promise<Array<BoardLane>> => {
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

  // Fetch minimal data, we only want the IDs
  const order = /<order .*?(?=\/)\/>/g.exec(fetchXml);
  const noColumnFetch = fetchXml.replace(/<attribute .*?(?=\/)\/>/g, "");
  const idFetch = noColumnFetch.replace(`<entity name=\"${entityName}\">`, `<entity name=\"${entityName}\"><attribute name=\"${metadata.PrimaryIdAttribute}\" />`);

  const { value: records }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: entityName, fetchXml: idFetch, returnAllPages: true });
  const ids: Array<string> = records.map(r => r[metadata.PrimaryIdAttribute]);

  const dataFetch = `<fetch no-lock="true">
    <entity name="${entityName}">
      ${formFields.map(f => `<attribute name="${f}" />`).join("")}
      ${order.map(o => o).join("")}
      <filter type="and">
        <condition attribute="${metadata.PrimaryIdAttribute}" operator="in">
            ${ids.map(id => `<value>${id}</value>`).join("")}
        </condition>
        ${options?.additionalConditions.join("")}
      </filter>
    </entity>
  </fetch>`;

  const lanes = attribute.AttributeType === "Boolean" ? [ attribute.OptionSet.FalseOption, attribute.OptionSet.TrueOption ] : attribute.OptionSet.Options.sort((a, b) => a.State - b.State);
  const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: entityName, fetchXml: dataFetch, returnAllPages: true, headers: [ { key: "Prefer", value: "odata.include-annotations=\"*\"" } ] });

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
};

export const refresh = async (appDispatch: Dispatch, appState: AppStateProps, fetchXml?: string, selectedForm?: CardForm, secondaryFetchXml?: string, secondarySelectedForm?: CardForm) => {
  appDispatch({ type: "setProgressText", payload: "Fetching data" });

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
    appState.secondaryMetadata,
    appState.secondarySeparatorMetadata,
    {
      additionalFields: [
        appState.config.secondaryEntity.parentLookup
      ],
      additionalConditions: [
        `<condition attribute="${appState.config.secondaryEntity.parentLookup}" operator="in">
          ${data.reduce((all, curr) => all.concat(curr.data.map(d => d[appState.metadata.PrimaryIdAttribute])), []).map(id => `<value>${id}</value>`).join("")}
        </condition>`
      ]
    }
  );
  appDispatch({ type: "setSecondaryData", payload: secondaryData });

  appDispatch({ type: "setProgressText", payload: undefined });
};