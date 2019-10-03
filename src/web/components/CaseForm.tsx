import * as React from "react";
import UserInputModal from "./UserInputModalProps";
import { Incident } from "../domain/Incident";
import { Modal, Button } from "react-bootstrap";

interface CaseFormProps {
  showForm: boolean;
  appId: string;
  incident: Incident;
  hideForm: () => void;
}

export default class CaseForm extends React.PureComponent<CaseFormProps, undefined> {
  constructor(props: CaseFormProps) {
    super(props);
  }

  render() {
    return (
      <Modal size="lg" show={this.props.showForm}>
      <Modal.Body>
        <iframe style={{width: "100%", height: "100%"}} src={`/main.aspx?appid=${this.props.appId}&pagetype=entityrecord&etn=incident&id=${this.props.incident && this.props.incident.incidentid}`}></iframe>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.props.hideForm} variant="primary">Close</Button>
      </Modal.Footer>
    </Modal>);
  }
}