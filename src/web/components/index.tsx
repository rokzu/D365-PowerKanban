import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import whyDidYouRender from "@welldone-software/why-did-you-render";
import { faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faCircle, faSearch } from "@fortawesome/free-solid-svg-icons";

whyDidYouRender(React);

library.add(faSync, faWindowClose, faWindowMaximize, faAngleDoubleRight, faBell, faBellSlash, faPlusSquare, faEyeSlash, faEye, faCircle, faSearch);

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
