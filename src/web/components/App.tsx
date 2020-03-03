import React from "react";
import { AppStateProvider } from "../domain/AppState";
import { SplitView } from "./SplitView";
import { ActionStateProvider } from "../domain/ActionState";
import { ConfigStateProvider } from "../domain/ConfigState";
import { MeasurerStateProvider } from "../domain/MeasurerState";

export const App = () => {
  return (
    <AppStateProvider>
      <ActionStateProvider>
        <ConfigStateProvider>
          <MeasurerStateProvider>
            <SplitView />
          </MeasurerStateProvider>
        </ConfigStateProvider>
      </ActionStateProvider>
    </AppStateProvider>
  );
};