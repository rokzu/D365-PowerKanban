import React from "react";
import { AppStateProvider } from "../domain/AppState";
import { SplitView } from "./SplitView";
import { ActionStateProvider } from "../domain/ActionState";
import { ConfigStateProvider } from "../domain/ConfigState";

export const App = () => {
  return (
    <AppStateProvider>
      <ActionStateProvider>
        <ConfigStateProvider>
          <SplitView />
        </ConfigStateProvider>
      </ActionStateProvider>
    </AppStateProvider>
  );
};