import * as React from "react";
import { useAppState } from "../domain/AppState";

interface FormProps {
}

export const SideBySideForm = (props: FormProps) => {
  const appState = useAppState();

  return (
      <iframe style={{width: "100%", height: "100%"}} src={`/main.aspx?appid=${appState.appId}&pagetype=entityrecord&etn=${appState.selectedRecord.entityType}&id=${appState.selectedRecord.id}`}></iframe>
  );
};