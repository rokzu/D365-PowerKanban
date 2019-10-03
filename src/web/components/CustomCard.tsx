import * as React from "react";
import { Incident } from "../domain/Incident";
import { Button } from "react-bootstrap";

export const CustomCard = (props: any) => {
    const incident = props.metadata as Incident;

    const clickHandler = (e: any) => {
      e.stopPropagation();
      props.deleteCallback(props.id, props.laneId);
    };

    const linkHandler = (e: any) => {
      e.stopPropagation();

      Xrm.Navigation.openForm({ entityName: "incident", entityId: incident.incidentid, openInNewWindow: true});
    };

    return (
      <div style={{padding: "5px", overflow: "auto"}}>
        <header
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: 6,
            marginBottom: 10,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}>
          <div style={{fontSize: 14, fontWeight: "bold"}}>{incident.title}</div>
        </header>
        <div style={{fontSize: 12}}>
          { incident.description && <div style={{padding: "5px 0px"}}>
            <i>{incident.description.split("\n").map((line, index) => <span key={index}>{line}<br/></span>)}</i>
          </div> }
          <Button style={{marginTop: 10, paddingLeft: 0}} variant="link" onClick={linkHandler}>Open</Button>
        </div>
        <Button className="float-right" onClick={clickHandler} variant={"secondary"}>Delete</Button>
      </div>
    );
  };
