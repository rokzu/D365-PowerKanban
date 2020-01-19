import React, { useRef, useEffect } from "react";
import { useAppContext } from "../domain/AppState";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchData, refresh } from "../domain/fetchData";

interface NotificationListProps {
}

export const NotificationList = (props: NotificationListProps) => {
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
        <Button onClick={closeSideBySide} style={{ position: "absolute", top: "45%", left: "-18px" }}><FontAwesomeIcon icon="window-close" /></Button>
      </div>
  );
};