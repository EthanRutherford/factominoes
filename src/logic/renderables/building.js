import earcut from "earcut";
import {rgba, builtIn} from "2d-gl";
const {Shape, VectorMaterial} = builtIn;

const black = rgba(0, 0, 0);
const lightGrey = rgba(.6, .6, .6);
export function getBuilding(renderer, coords) {
	const tris = earcut(coords.flatMap(({x, y}) => [x, y]));
	const triCoords = tris.map((i) => coords[i]);
	const shape = new Shape(triCoords, Shape.triangles);
	const outlineShape = new Shape(coords, Shape.lineLoop);
	const material = new VectorMaterial(triCoords.map(() => lightGrey));
	const outlineMaterial = new VectorMaterial(coords.map(() => black));
	const renderable = renderer.getInstance(shape, material);
	const outline = renderer.getInstance(outlineShape, outlineMaterial);
	outline.zIndex = 200;
	renderable.getChildren = () => [outline];
	return renderable;
}
