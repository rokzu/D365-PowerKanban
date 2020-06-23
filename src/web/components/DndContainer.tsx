import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export interface DndContainerProps {
}

export const DndContainer: React.FC<DndContainerProps> = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
        {props.children}
    </DndProvider>
  );
};