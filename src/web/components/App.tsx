import * as React from "react";
import { AppStateProvider } from "../domain/AppState";
import { SplitView } from "./SplitView";
import { ActionStateProvider } from "../domain/ActionState";
import { ConfigStateProvider } from "../domain/ConfigState";
import { MeasurerStateProvider } from "../domain/MeasurerState";

export interface AppProps
{
  configId: string;
  appId: string;
}

export const App: React.FC<AppProps> = (props) => {
  return (
    <AppStateProvider>
      <ActionStateProvider>
        <ConfigStateProvider appId={props.appId} configId={props.configId}>
          <MeasurerStateProvider>
            <SplitView />
          </MeasurerStateProvider>
        </ConfigStateProvider>
      </ActionStateProvider>
    </AppStateProvider>
  );
};