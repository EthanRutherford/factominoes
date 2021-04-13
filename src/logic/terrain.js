import {rgba, builtIn} from "2d-gl";
import {Component} from "./component";
import {AAP} from "./shape";
const {Shape, VectorMaterial} = builtIn;

const black = rgba(0, 0, 0);
const darkGreen = rgba(.15, .4, .15);

const treeCoords = [{x: .5, y: -.1}, {x: .9, y: -.9}, {x: .1, y: -.9}];
const treeShape = new Shape(treeCoords, Shape.triangles);
const treeMaterial = new VectorMaterial([darkGreen, darkGreen, darkGreen]);
const treeOutlineShape = new Shape(treeCoords, Shape.lineLoop);
const treeOutlineMaterial = new VectorMaterial([black, black, black]);
export class Terrain extends Component {
	constructor(x, y, kind) {
		super(AAP.fromShape(x, y, [1, -1, -1, 1]));
		this.kind = kind;
	}
	createRenderable(renderer) {
		if (this.kind === 0) {
			const renderable = renderer.getInstance(treeShape, treeMaterial);
			const outline = renderer.getInstance(treeOutlineShape, treeOutlineMaterial);
			outline.zIndex = 200;
			renderable.getChildren = () => [outline];
			return renderable;
		}

		throw `unknown terrain kind ${this.kind}`;
	}
}
