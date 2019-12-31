import { BoardLane } from "./BoardLane";
import { BoardViewConfig } from "./BoardViewConfig";
import { Attribute } from "./Metadata";
import WebApiClient from "xrm-webapi-client";

export const fetchData = async (fetchXml: string, config: BoardViewConfig, attribute: Attribute) => {
    // We make sure that the swim lane source is always included without having to update all views
    const failsafeFetch = fetchXml.includes(`<attribute name=\"${config.swimLaneSource}\" />`)
      ? fetchXml
      : fetchXml.replace(`<entity name=\"${config.entityName}\">`, `<entity name=\"${config.entityName}\"><attribute name=\"${config.swimLaneSource}\" />`);

    const lanes = attribute.AttributeType === "Boolean" ? [ attribute.OptionSet.FalseOption, attribute.OptionSet.TrueOption ] : attribute.OptionSet.Options.sort((a, b) => a.State - b.State);
    const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: config.entityName, fetchXml: failsafeFetch, returnAllPages: true, headers: [ { key: "Prefer", value: "odata.include-annotations=\"*\"" } ] });

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