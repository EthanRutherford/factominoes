import {rgba, builtIn} from "2d-gl";
import {randItem} from "../util";
const {Shape, VectorMaterial} = builtIn;

const asphalt = rgba(.1, .1, .12);
const yellow = rgba(1, 1, 0);
const white = rgba(1, 1, 1);
const road1x2Coords = [{x: 0, y: 0}, {x: 2, y: 0}, {x: 2, y: -1}, {x: 0, y: -1}];
const road1x2Shape = new Shape(road1x2Coords, Shape.triangleFan);
const road2x2Coords = [{x: -1, y: 1}, {x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
const road2x2Shape = new Shape(road2x2Coords, Shape.triangleFan);
const roadMaterial = new VectorMaterial([asphalt, asphalt, asphalt, asphalt]);

const lineOneShape = new Shape([{x: 1, y: -.25}, {x: 1, y: -.75}], Shape.lines);
const lineOneMaterial = new VectorMaterial([yellow, yellow]);
const lineTwoCoords = [{x: 0, y: -.25}, {x: 0, y: -.75}, {x: .25, y: 0}, {x: .75, y: 0}];
const lineTwoShape = new Shape(lineTwoCoords, Shape.lines);
const lineTwoMaterial = new VectorMaterial([yellow, yellow, yellow, yellow]);
const lineThreeCoords = [
	{x: -.75, y: 0}, {x: -.25, y: 0},
	{x: .25, y: 0}, {x: .75, y: 0},
	{x: -1, y: -1}, {x: 1, y: -1},
];
const lineThreeShape = new Shape(lineThreeCoords, Shape.lines);
const lineThreeMaterial = new VectorMaterial([yellow, yellow, yellow, yellow, white, white]);
const lineFourShape = new Shape(road2x2Coords, Shape.lineLoop);
const lineFourMaterial = new VectorMaterial([white, white, white, white]);

function getRoad(renderer, rShape, lShape, lMat) {
	const renderable = renderer.getInstance(rShape, roadMaterial);
	const lines = renderer.getInstance(lShape, lMat);
	lines.zIndex = 200;
	renderable.getChildren = () => [lines];
	return renderable;
}

export const getRoadOne = (renderer) => getRoad(renderer, road1x2Shape, lineOneShape, lineOneMaterial);
export const getRoadTwo = (renderer) => getRoad(renderer, road2x2Shape, lineTwoShape, lineTwoMaterial);
export const getRoadThree = (renderer) => getRoad(renderer, road2x2Shape, lineThreeShape, lineThreeMaterial);
export const getRoadFour = (renderer) => getRoad(renderer, road2x2Shape, lineFourShape, lineFourMaterial);

const red = rgba(.75, 0, 0);
const orange = rgba(.75, .45, 0);
const blue = rgba(0, 0, .75);
const teal = rgba(0, .4, .3);
const brown = rgba(.4, .1, .05);
const silver = rgba(.8, .8, .9);
const grey = rgba(.4, .4, .4);
const carCoords = [{x: -.25, y: .45}, {x: .25, y: .45}, {x: .25, y: -.45}, {x: -.25, y: -.45}];
const carShape = new Shape(carCoords, Shape.triangleFan);

const black = rgba(0, 0, 0, .5);
const topCoords = [{x: -.2, y: .25}, {x: .2, y: .25}, {x: .2, y: .1}, {x: -.2, y: .1}];
const topShape = new Shape(topCoords, Shape.triangleFan);
const topMaterial = new VectorMaterial([black, black, black, black]);

export function getCar(renderer) {
	const color = randItem([red, orange, blue, teal, brown, silver, grey]);
	const carMaterial = new VectorMaterial([color, color, color, color]);
	const renderable = renderer.getInstance(carShape, carMaterial);
	renderable.zIndex = 300;
	const top = renderer.getInstance(topShape, topMaterial);
	top.zIndex = 301;
	renderable.getChildren = () => [top];
	return renderable;
}
