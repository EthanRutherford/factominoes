import {rgba, builtIn} from "2d-gl";
import {Component} from "./component";
import {AAP} from "./shape";
const {Shape, VectorMaterial} = builtIn;

const black = rgba(0, 0, 0);
const darkGreen = rgba(.15, .4, .15);
const brown = rgba(.5, .2, .1);

const stumpCoords = [
	{x: .6, y: -.8},
	{x: .6, y: -.9},
	{x: .4, y: -.9},
	{x: .4, y: -.8},
];
const stumpShape = new Shape(stumpCoords, Shape.triangleFan);
const stumpMaterial = new VectorMaterial(stumpCoords.map(() => brown));

const treeCoords = [{x: .5, y: -.1}, {x: .8, y: -.8}, {x: .2, y: -.8}];
const treeOutlineCoords = [...treeCoords.slice(0, -1), ...stumpCoords, treeCoords[treeCoords.length - 1]];
const treeShape = new Shape(treeCoords, Shape.triangles);
const treeMaterial = new VectorMaterial([darkGreen, darkGreen, darkGreen]);
const treeOutlineShape = new Shape(treeOutlineCoords, Shape.lineLoop);
const treeOutlineMaterial = new VectorMaterial(treeOutlineCoords.map(() => black));

const bushCoords = [
	{x: .2, y: -.2},
	{x: .8, y: -.2},
	{x: .8, y: -.8},
	{x: .2, y: -.8},
];
const bushOutlineCoords = [...bushCoords.slice(0, -1), ...stumpCoords, bushCoords[bushCoords.length - 1]];
const bushShape = new Shape(bushCoords, Shape.triangleFan);
const bushMaterial = new VectorMaterial(bushCoords.map(() => darkGreen));
const bushOutlineShape = new Shape(bushOutlineCoords, Shape.lineLoop);
const bushOutlineMaterial = new VectorMaterial(bushOutlineCoords.map(() => black));

export class Terrain extends Component {
	constructor(x, y, kind) {
		super(AAP.fromShape(x, y, [1, -1, -1, 1]));
		this.kind = kind;
	}
	createRenderable(renderer) {
		if (this.kind === 0) {
			const renderable = renderer.getInstance(treeShape, treeMaterial);
			const outline = renderer.getInstance(treeOutlineShape, treeOutlineMaterial);
			const stump = renderer.getInstance(stumpShape, stumpMaterial);
			outline.zIndex = 200;
			renderable.getChildren = () => [stump, outline];
			return renderable;
		}

		if (this.kind === 1) {
			const renderable = renderer.getInstance(bushShape, bushMaterial);
			const outline = renderer.getInstance(bushOutlineShape, bushOutlineMaterial);
			const stump = renderer.getInstance(stumpShape, stumpMaterial);
			outline.zIndex = 200;
			renderable.getChildren = () => [stump, outline];
			return renderable;
		}

		throw `unknown terrain kind ${this.kind}`;
	}
}
