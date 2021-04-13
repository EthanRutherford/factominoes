import {render} from "react-dom";
import {MapMaker} from "./ui/map-maker";
import "./styles/reset.css";

function App() {
	return (
		<MapMaker />
	);
}

render(<App />, document.getElementById("react-root"));
