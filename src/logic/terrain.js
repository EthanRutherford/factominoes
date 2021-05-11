import {Component} from "./component";
import {getBush, getTree} from "./renderables/terrain";
import {AAP} from "./shape";

export class Terrain extends Component {
	constructor(x, y, kind) {
		super(AAP.fromShape(x, y, [1, -1, -1, 1]));
		this.kind = kind;
	}
	createRenderable(renderer) {
		if (this.kind === 0) {
			return getTree(renderer);
		}

		if (this.kind === 1) {
			return getBush(renderer);
		}

		throw `unknown terrain kind ${this.kind}`;
	}
}
