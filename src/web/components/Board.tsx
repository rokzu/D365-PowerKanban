import React, { useContext } from "react";
import { Navbar, Nav, Button, Card, Col, Row } from "react-bootstrap";
import WebApiClient from "xrm-webapi-client";
import { Option, Attribute } from "../domain/Option";
import { BoardViewConfig } from "../domain/BoardViewConfig";
import UserInputModal from "./UserInputModalProps";
import { AppState } from "../domain/AppState";

interface BoardState {
  selectedRecord?: Xrm.LookupValue;
  boardData?: { [key: string]: Array<any> };
  showDeletionVerification?: boolean;
  config?: BoardViewConfig;
  swimLaneField?: Attribute;
}

export class Board extends React.PureComponent<any, BoardState> {
    constructor(props: any) {
        super(props);

        this.state = { };
    }

    static contextType = AppState;

    fetchSwimLaneField = async (entity: string) => {
      const response = await WebApiClient.Retrieve({entityName: "EntityDefinition", queryParams: `(LogicalName='${entity}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$expand=OptionSet`});
      const value = response.value as Array<any>;

      if (!value || !value.length) {
        return undefined;
      }

      return value[0];
    };

    fetchConfig = async (configId: string) => {
      const config = await WebApiClient.Retrieve({overriddenSetName: "webresourceset", entityId: configId, queryParams: "?$select=content" });

      return JSON.parse(atob(config.content));
    };

    async componentDidMount() {
      const appState = this.context;

      const config = await this.fetchConfig(appState.configId);
      const swimLaneField = await this.fetchSwimLaneField(config.entityName);

      this.setState({
        config,
        swimLaneField
      });

      this.fetchData();
    }

    fetchData = async () => {
      const { value: data }: { value: Array<any> } = await WebApiClient.Retrieve({ entityName: this.state.config.entityName });

      const lanes = data.reduce((all, record) => {
        const laneId = record[this.state.config.swimLaneSource] ? record[this.state.config.swimLaneSource].toString() : "__unset";

        if (all[laneId]) {
          all[laneId].push(record);
        }
        else {
          all[laneId] = [ record ];
        }

        return all;
        }, {} as {[key: string]: Array<any>});

      this.setState({
        boardData: lanes
      });
    };

    hideForm = () => {
      this.setState({
        selectedRecord: undefined
      });
    }

    verifyDeletion = (cardId: string, laneId: string) => {
      this.setState({ showDeletionVerification: true });
    }

    hideDeletionVerification = () => {
      this.setState({ showDeletionVerification: false });
    }

    deleteRecord = () => {

    };

    render() {
        return (
          <div>
            <UserInputModal title="Verify Deletion" yesCallBack={this.deleteRecord} finally={this.hideDeletionVerification} show={this.state.showDeletionVerification}>
              <div>Are you sure you want to delete  '{this.state.selectedRecord && this.state.selectedRecord.name}' (ID: {this.state.selectedRecord && this.state.selectedRecord.id})?</div>
            </UserInputModal>
            <Navbar bg="dark" variant="dark">
              <Navbar.Brand href="#"><img src="https://xrmadventuretime.com/wp-content/uploads/2018/07/cropped-Sword.png" height="50" /></Navbar.Brand>
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto"></Nav>
                { this.state.config && this.state.config.showCreateButton && <Button>Create New</Button> }
                <Button onClick={this.fetchData}>Refresh</Button>
              </Navbar.Collapse>
            </Navbar>
            <Card>
              <Row>
                { this.state.boardData && Object.keys(this.state.boardData).map(laneId => <Col xs={1}><Card>{this.state.boardData[laneId].map(d => <Card>{d.createdon}</Card>)}</Card></Col>)}
              </Row>
            </Card>
          </div>
        );
    }
}

