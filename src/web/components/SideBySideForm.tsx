import * as React from "react";
import { useAppContext } from "../domain/AppState";
import { Button } from "react-bootstrap";

interface FormProps {
}

export const SideBySideForm = (props: FormProps) => {
  const [ appState, appDispatch ] = useAppContext();

  const closeSideBySide = () => {
    appDispatch({ type: "setSelectedRecord", payload: undefined });
  };

  // Todo:
  // Hide Navbar, sidebar with css in Iframe
  // Elements to hide
  // id="id-5"
  // data-id="topBar"

  return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Button onClick={closeSideBySide} style={{ position: "absolute", top: "50%", left: "-18px"}}>></Button>
        <iframe style={{width: "100%", height: "100%", border: 0}} src={`/main.aspx?appid=${appState.appId}&pagetype=entityrecord&etn=${appState.selectedRecord.entityType}&id=${appState.selectedRecord.id}`}></iframe>
      </div>
  );
};