import * as React from "react";
import { Modal, Button } from "react-bootstrap";

interface UserInputModalProps {
  title: string;
  show: boolean;
  yesCallBack?: (value: string) => void;
  noCallBack?: () => void;
  finally?: () => void;
}

export class UserInputModal extends React.PureComponent<UserInputModalProps, undefined> {
  constructor(props: UserInputModalProps) {
    super(props);

    this.triggerCallback = this.triggerCallback.bind(this);
    this.callIfDefined = this.callIfDefined.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  callIfDefined(callBack: (value?: string) => void) {
    if (callBack) {
      callBack();
    }
  }

  setValue (e: any) {
    const text = e.target.value;

    this.setState({
      value: text
    });
  }

  triggerCallback(choice: boolean) {
    if (choice) {
      this.callIfDefined(this.props.yesCallBack);
    }
    else {
      this.callIfDefined(this.props.noCallBack);
    }

    this.callIfDefined(this.props.finally);
  }

  render() {
    return (
        <Modal show={this.props.show}>
          <Modal.Header>
            <Modal.Title>{ this.props.title }</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {this.props.children}
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={ () => this.triggerCallback(true) } variant="primary">Ok</Button>
            <Button onClick={ () => this.triggerCallback(false) } variant="secondary">Cancel</Button>
          </Modal.Footer>
        </Modal>);
  }
}