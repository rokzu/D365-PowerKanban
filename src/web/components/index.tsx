import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faSpinner } from "@fortawesome/free-solid-svg-icons";

library.add(faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faSpinner);

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
