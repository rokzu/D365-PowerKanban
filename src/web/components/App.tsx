import React from "react";
import { AppStateProvider } from "../domain/AppState";
import { SplitView } from "./SplitView";

export const App = () => {
  return (
    <AppStateProvider>
      <SplitView />
    </AppStateProvider>
  );
};