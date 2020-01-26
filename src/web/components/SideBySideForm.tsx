import React, { useRef, useEffect } from "react";
import { useAppContext } from "../domain/AppState";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh } from "../domain/fetchData";

interface FormProps {
}

export const SideBySideForm = (props: FormProps) => {
  const [ appState, appDispatch ] = useAppContext();

  const _iframe = useRef(undefined);

  const hideNav = () => {
    const style = document.createElement("style");
    style.type = "text/css";

    style.appendChild(document.createTextNode(`#id-5 { display: none; } [data-id="topBar"] { display: none; }`));

    _iframe.current.contentWindow.document.head.append(style);
  };

  const closeSideBySide = () => {
    appDispatch({ type: "setSelectedRecord", payload: undefined });
  };

  const closeAndRefresh = async () => {
    appDispatch({ type: "setSelectedRecord", payload: undefined });

    await refresh(appDispatch, appState);
  };

  const openInNewTab = () => {
    Xrm.Navigation.openForm({ entityName: appState.selectedRecord.entityType, entityId: appState.selectedRecord.id, openInNewWindow: true });
  };

  return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Button title="Close" onClick={closeSideBySide} style={{ position: "absolute", top: "45%", left: "-18px" }}><FontAwesomeIcon icon="window-close" /></Button>
        <Button title="Close and refresh" onClick={closeAndRefresh} style={{ position: "absolute", top: "50%", left: "-18px" }}><FontAwesomeIcon icon="sync" /></Button>
        <Button title="Open in new window" onClick={openInNewTab} style={{ position: "absolute", top: "55%", left: "-18px" }}><FontAwesomeIcon icon="window-maximize" /></Button>
        <iframe onLoad={hideNav} ref={_iframe} style={{width: "100%", height: "100%", border: 0}} src={`/main.aspx?appid=${appState.appId}&pagetype=entityrecord&etn=${appState.selectedRecord.entityType}&id=${appState.selectedRecord.id}`}></iframe>
      </div>
  );
};