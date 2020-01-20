import React, { useRef, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh } from "../domain/fetchData";
import { UserInputModal } from "./UserInputModalProps";

interface ExternalFormProps {
}

export const ExternalForm = (props: ExternalFormProps) => {
    const [ appState, appDispatch ] = useAppContext();
    const [ formData, setFormData ] = useState({} as any);

    const noCallBack = () => {
        appState.flyOutForm.resolve({
            cancelled: true
        });
    };

    const yesCallBack = () => {
        appState.flyOutForm.resolve({
            cancelled: false,
            values: formData
        });
    };

    const hideDialog = () => {
        appDispatch({ type: "setFlyOutForm", payload: undefined });
    };

    const onFieldChange = (e: any) => {
        const value = e.target.value;
        const id = e.target.id;

        setFormData({...formData, [id]: value });
    };

    return (
        <UserInputModal okButtonDisabled={!Object.keys(appState.flyOutForm.fields).every(fieldId => !appState.flyOutForm.fields[fieldId].required || !!formData[fieldId])} noCallBack={noCallBack} yesCallBack={yesCallBack} finally={hideDialog} title={appState.flyOutForm?.title} show={!!appState.flyOutForm}>
            {Object.keys(appState.flyOutForm.fields).map(fieldId =>
                <Form.Group key={fieldId} controlId={fieldId}>
                    <Form.Label>{appState.flyOutForm.fields[fieldId].label}{appState.flyOutForm.fields[fieldId].required && <span style={{color: "red"}}>*</span>}</Form.Label>
                    <Form.Control value={formData[fieldId]} onChange={onFieldChange} type={appState.flyOutForm.fields[fieldId].type} placeholder={appState.flyOutForm.fields[fieldId].placeholder ?? `Enter ${[appState.flyOutForm.fields[fieldId].label]}`} />
                    { appState.flyOutForm.fields[fieldId].subtext &&
                        <Form.Text className="text-muted">
                            { appState.flyOutForm.fields[fieldId].subtext }
                        </Form.Text>
                    }
                </Form.Group>
            )}
        </UserInputModal>
    );
};