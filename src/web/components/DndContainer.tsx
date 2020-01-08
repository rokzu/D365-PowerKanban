import React from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";

export interface DndContainerProps {
}

export const DndContainer: React.FC<DndContainerProps> = (props) => {
  return (
    <DndProvider backend={Backend}>
        {props.children}
    </DndProvider>
  );
};