import React, { useRef, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh } from "../domain/fetchData";
import { UserInputModal } from "./UserInputModalProps";
import { useActionContext } from "../domain/ActionState";
import { useConfigDispatch } from "../domain/ConfigState";
import WebApiClient from "xrm-webapi-client";
import { formatGuid } from "../domain/GuidFormatter";

interface ConfigSelectorProps {
}

export const ConfigSelector = (props: ConfigSelectorProps) => {
    const [ actionState, actionDispatch ] = useActionContext();
    const configDispatch = useConfigDispatch();
    const [ configId, setConfigId ] = useState(undefined);
    const [ configs, setConfigs ] = useState([]);
    const [ makeDefault, setMakeDefault ] = useState(false);

    const yesCallBack = async() => {
        const id = configId;

        if (makeDefault) {
            const userId = formatGuid(Xrm.Page.context.getUserId());
            await WebApiClient.Update({ entityName: "systemuser", entityId: userId, entity: { oss_defaultboardid: id } });
        }

        configDispatch({ type: "setConfigId", payload: id });
    };

    const hideDialog = () => {
        actionDispatch({ type: "setConfigSelectorDisplayState", payload: false });
    };

    React.useEffect(() => {
        const fetchConfigs = async() => {
            const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({overriddenSetName: "webresourceset", queryParams: "?$select=name,displayname,webresourceid&$filter=contains(name, 'd365powerkanban.config.json')&$orderby=displayname" });
            setConfigs(data);
        };

        fetchConfigs();
    }, []);

    const onSelection = (e: any) => {
        setConfigId(e.target.value);
        setMakeDefault(false);
    };

    const onMakeDefault = (e: any) => {
        setMakeDefault(e.target.value);
    };

    return (
        <UserInputModal okButtonDisabled={!configId} noCallBack={() => {}} yesCallBack={yesCallBack} finally={hideDialog} title={"Choose Board"} show={actionState.configSelectorDisplayState}>
            <Form.Group controlId="configSelector">
                <Form.Label>Select a board to load</Form.Label>
                <Form.Control as="select" onChange={onSelection}>
                    <option value=""></option>
                    { configs.map(c => <option value={c.webresourceid}>{c.displayname}</option>) }
                </Form.Control>
            </Form.Group>
            <Form.Group controlId="setDefaultCheckbox">
                <Form.Check checked={makeDefault} onChange={onMakeDefault} type="checkbox" label="Make this my default board" />
            </Form.Group>
        </UserInputModal>
    );
};