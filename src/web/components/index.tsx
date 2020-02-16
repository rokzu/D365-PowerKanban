import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faCircle, faSearch, faTh } from "@fortawesome/free-solid-svg-icons";

library.add(faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faCircle, faSearch, faTh);

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
