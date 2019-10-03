import * as React from "react";
import { Navbar, Nav, Button, Card, Col, Row } from "react-bootstrap";
import Board from "react-trello";
import CaseForm from "./CaseForm";
import { Incident } from "../domain/Incident";
import UserInputModal from "./UserInputModalProps";
import { CustomCard } from "./CustomCard";
import WebApiClient from "xrm-webapi-client";
import { Option } from "../domain/Option";
import { ParseSearch } from "../domain/ParseSearch";

interface AppState {
  showTaskForm?: boolean;

  boardData?: ReactTrello.BoardData<Incident>;
  incident?: Incident;
  showDeletionVerification?: boolean;
  appId?: string;
}

export default class App extends React.PureComponent<any, AppState> {
    constructor(props: any) {
        super(props);

        this.state = {
          boardData: { lanes:  [] }
        };
    }

    mapNumber = (x: any) => x && x.value ? x.value : undefined;

    mapDate = (x: any) => x && x.value ? new Date(x.value) : undefined;

    mapTask = (t: Incident) => {
      return {
        ...t,
        order: this.mapNumber(t.order),
        priority: this.mapNumber(t.priority)
      };
    }

    fetchStatusCodes = () => {
      return (WebApiClient.Retrieve({entityName: "EntityDefinition", queryParams: "(LogicalName='incident')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet"}) as Promise<any>)
      .then((response: any) => {
        const value = response.value as Array<any>;

        if (!value || !value.length) {
          return undefined;
        }

        return (value[0].OptionSet.Options as Array<Option>).sort((a, b) => a.State === b.State ? a.Value - b.Value : a.State - b.State);
      });
    }

    fetchData = () => {
      WebApiClient.Retrieve({ entityName: "incident" })
      .then((result: any) => {
        const incidents = result.value as Array<Incident>;
        const map = (i: Incident) => ({ id: i.incidentid, title: i.title, description: i.description, metadata: i });

        const lanes = incidents.reduce((all, i) => {
          const incident = this.mapTask(i);

          if (incident.statuscode) {
            const lane = all.find(l => l.id === incident.statuscode.toString());

            if (lane) {
              lane.cards.push(map(incident));
            }
          }

          return all;
        }, this.state.boardData.lanes.map(l => ({...l, cards: []})));

        this.setState({ boardData: { lanes: lanes } });
      });
    }

    componentDidMount() {
      const appId = ParseSearch()["appid"];

      this.setState({ appId: appId });

      this.fetchStatusCodes()
      .then(statusCodes => {
        if (!statusCodes) {
          return;
        }

        this.setState({
          boardData: {
            lanes: statusCodes.map(o => ({ id: o.Value.toString(), title: o.Label.UserLocalizedLabel.Label, cards: [] }))
          }
        }, this.fetchData);
      });
    }

    showTaskForm = () => {
      Xrm.Navigation.openForm({ entityName: "incident", useQuickCreateForm: true }).then(this.fetchData, this.fetchData);
    }

    hideForm = () => {
      this.setState({showTaskForm: false, incident: undefined});
    }

    submitTask = (refreshAfterwards = true) => {
      const task = { ...this.state.incident };
    }

    updateTask = (task: Incident, callback?: () => void) => {
      this.setState({incident: task}, callback);
    }

    findCard = (cardId: string, laneId: string) => this.state.boardData.lanes.find(l => l.id === laneId).cards.find(t => t.id.toString() === cardId).metadata;

    onCardClick = (cardId: string, metadata: any, laneId: string) => {
      this.setState({
        incident: this.findCard(cardId, laneId),
        showTaskForm: true
      });
    }

    updateBoard = (data: ReactTrello.BoardData<any>) => {
      this.setState({ boardData: data });
    }

    verifyDeletion = (cardId: string, laneId: string) => {
      this.setState({ showDeletionVerification: true, incident: this.findCard(cardId, laneId) });
    }

    deleteTask = () => {
      this.state.incident.id;
    }

    hideDeletionVerification = () => {
      this.setState({ showDeletionVerification: false });
    }

    onDragEnd = (cardId: string, sourceLaneId: string, targetLaneId: string, position: number, card: ReactTrello.Card<Incident>) => {
      const targetCard = card.metadata;

      if (sourceLaneId === targetLaneId) {
        return;
      }

      const sourceLane = this.state.boardData.lanes.find(l => l.id === sourceLaneId);
      const targetLane = this.state.boardData.lanes.find(l => l.id === targetLaneId);

      const newSourceLane = { ...sourceLane, cards: sourceLane.cards.filter(c => c.id !== cardId) };
      const newTargetLane = { ...targetLane, cards: [...targetLane.cards, card] };

      const update = { lanes: this.state.boardData.lanes.map(l => l.id === sourceLaneId ? newSourceLane : (l.id === targetLaneId ? newTargetLane : l)) };

      targetCard.phase = targetLane.id;
      targetCard.order = position;

      this.setState({
        boardData: update,
        incident: targetCard
      }, () => this.submitTask(false));
    }

    render() {
        return (
          <div>
            <CaseForm appId={this.state.appId} incident={this.state.incident} showForm={this.state.showTaskForm} hideForm={this.hideForm} />
            <UserInputModal title="Verify Task Deletion" yesCallBack={this.deleteTask} finally={this.hideDeletionVerification} show={this.state.showDeletionVerification}>
              <div>Are you sure you want to delete task '{this.state.incident && this.state.incident.name}' (ID: {this.state.incident && this.state.incident.id})?</div>
            </UserInputModal>
            <Navbar bg="dark" variant="dark">
              <Navbar.Brand href="/">
                <div style={{display: "inline-block", lineHeight: "100%", fontSize: "48px", fontWeight: 500, marginLeft: "5px"}}>D365 Incident Manager</div>
              </Navbar.Brand>
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto"></Nav>
                <Button onClick={this.showTaskForm}>Create New Task</Button>
                <Button onClick={this.fetchData}>Refresh</Button>
              </Navbar.Collapse>
            </Navbar>
            <Board
              data={this.state.boardData}
              cardDragClass="draggingCard"
              laneDragClass="draggingLane"
              onCardClick={this.onCardClick}
              onCardDelete={this.verifyDeletion}
              handleDragEnd={this.onDragEnd}
              updateBoard={this.updateBoard}
              laneDraggable={false}
              draggable
              customCardLayout
            >
              <CustomCard deleteCallback={this.verifyDeletion} />
            </Board>
          </div>
        );
    }
}

