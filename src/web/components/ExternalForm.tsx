import React, { useRef, useEffect, useState } from "react";
import { useAppContext } from "../domain/AppState";
import { Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh } from "../domain/fetchData";
import { UserInputModal } from "./UserInputModalProps";
import { useActionContext } from "../domain/ActionState";

interface ExternalFormProps {
}

export const ExternalForm = (props: ExternalFormProps) => {
    const [ actionState, actionDispatch ] = useActionContext();
    const [ formData, setFormData ] = useState({} as any);

    const noCallBack = () => {
        actionState.flyOutForm.resolve({
            cancelled: true
        });
    };

    const yesCallBack = () => {
        actionState.flyOutForm.resolve({
            cancelled: false,
            values: formData
        });
    };

    const hideDialog = () => {
        actionDispatch({ type: "setFlyOutForm", payload: undefined });
    };

    const onFieldChange = (e: any) => {
        const value = e.target.value;
        const id = e.target.id;

        setFormData({...formData, [id]: value });
    };

    return (
        <UserInputModal okButtonDisabled={!Object.keys(actionState.flyOutForm.fields).every(fieldId => !actionState.flyOutForm.fields[fieldId].required || !!formData[fieldId])} noCallBack={noCallBack} yesCallBack={yesCallBack} finally={hideDialog} title={actionState.flyOutForm?.title} show={!!actionState.flyOutForm}>
            {Object.keys(actionState.flyOutForm.fields).map(fieldId =>
                <Form.Group key={fieldId} controlId={fieldId}>
                    <Form.Label>{actionState.flyOutForm.fields[fieldId].label}{actionState.flyOutForm.fields[fieldId].required && <span style={{color: "red"}}>*</span>}</Form.Label>
                    <Form.Control value={formData[fieldId]} onChange={onFieldChange} as={actionState.flyOutForm.fields[fieldId].as} rows={actionState.flyOutForm.fields[fieldId].rows} type={actionState.flyOutForm.fields[fieldId].type} placeholder={actionState.flyOutForm.fields[fieldId].placeholder ?? `Enter ${[actionState.flyOutForm.fields[fieldId].label]}`} />
                    { actionState.flyOutForm.fields[fieldId].subtext &&
                        <Form.Text className="text-muted">
                            { actionState.flyOutForm.fields[fieldId].subtext }
                        </Form.Text>
                    }
                </Form.Group>
            )}
        </UserInputModal>
    );
};