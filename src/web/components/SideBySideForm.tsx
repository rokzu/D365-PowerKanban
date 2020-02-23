import React, { useRef, useEffect } from "react";
import { useAppContext } from "../domain/AppState";
import { Button } from "react-bootstrap";

import { fetchData, refresh } from "../domain/fetchData";
import { useActionDispatch, useActionContext } from "../domain/ActionState";
import { useConfigDispatch, useConfigState } from "../domain/ConfigState";

interface FormProps {
}

export const SideBySideForm = (props: FormProps) => {
  const [appState, appDispatch] = useAppContext();
  const [actionState, actionDispatch] = useActionContext();
  const configState = useConfigState();

  const _iframe = useRef(undefined);

  const hideNav = () => {
    const style = document.createElement("style");
    style.type = "text/css";

    style.appendChild(document.createTextNode(`#id-5 { display: none; } [data-id="topBar"] { display: none; }`));

    _iframe.current.contentWindow.document.head.append(style);
  };

  const closeSideBySide = () => {
    actionDispatch({ type: "setSelectedRecord", payload: undefined });
  };

  const closeAndRefresh = async () => {
    actionDispatch({ type: "setSelectedRecord", payload: undefined });

    await refresh(appDispatch, appState, configState, actionDispatch, actionState);
  };

  const openInNewTab = () => {
    Xrm.Navigation.openForm({ entityName: actionState.selectedRecord.entityType, entityId: actionState.selectedRecord.id, openInNewWindow: true });
  };

  return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Button title="Close" onClick={closeSideBySide} style={{ position: "absolute", top: "45%", left: "-18px" }}><i className="fa fa-window-close" aria-hidden="true"></i></Button>
        <Button title="Close and refresh" onClick={closeAndRefresh} style={{ position: "absolute", top: "50%", left: "-18px" }}><i className="fa fa-sync" aria-hidden="true"></i></Button>
        <Button title="Open in new window" onClick={openInNewTab} style={{ position: "absolute", top: "55%", left: "-18px" }}><i className="fa fa-window-maximize" aria-hidden="true"></i></Button>
        <iframe onLoad={hideNav} ref={_iframe} style={{width: "100%", height: "100%", border: 0}} src={`/main.aspx?appid=${configState.appId}&pagetype=entityrecord&etn=${actionState.selectedRecord.entityType}&id=${actionState.selectedRecord.id}`}></iframe>
      </div>
  );
};