import {rgba, builtIn} from "2d-gl";
import {Component} from "./component";
import {AAP} from "./shape";
import {randItem} from "./util";
const {Shape, VectorMaterial} = builtIn;

const dirs = {
	up: 0,
	right: 1,
	down: 2,
	left: 3,
};
const dirVec = {
	[dirs.up]: (amount) => ({x: 0, y: amount}),
	[dirs.right]: (amount) => ({x: amount, y: 0}),
	[dirs.down]: (amount) => ({x: 0, y: -amount}),
	[dirs.left]: (amount) => ({x: -amount, y: 0}),
};

const asphalt = rgba(.1, .1, .12);
const yellow = rgba(1, 1, 0);
const white = rgba(1, 1, 1);
const roadCoords = [{x: 0, y: 0}, {x: 2, y: 0}, {x: 2, y: -1}, {x: 0, y: -1}];
const roadShape = new Shape(roadCoords, Shape.triangleFan);
const road2x2Coords = [{x: -1, y: 1}, {x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
const road2x2Shape = new Shape(road2x2Coords, Shape.triangleFan);
const roadMaterial = new VectorMaterial([asphalt, asphalt, asphalt, asphalt]);

const lineShape = new Shape([{x: 1, y: -.25}, {x: 1, y: -.75}], Shape.lines);
const lineMaterial = new VectorMaterial([yellow, yellow]);
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

export class Road extends Component {
	constructor(shape, cells, angle) {
		super(shape);

		// rotate cell array and add cell data
		for (let i = 0; i < angle; i++) {
			cells.unshift(cells.pop());
			for (const cell of cells) {
				cell.unshift(cell.pop());
			}
		}

		const topLeft = this.shape.get(this.shape.x, this.shape.y);
		const topRight = this.shape.get(this.shape.x + 1, this.shape.y);
		const bottomLeft = this.shape.get(this.shape.x, this.shape.y - 1);
		const bottomRight = this.shape.get(this.shape.x + 1, this.shape.y - 1);
		if (topLeft != null) {
			topLeft.content = cells[0];
		}
		if (topRight != null) {
			topRight.content = cells[1];
		}
		if (bottomRight != null) {
			bottomRight.content = cells[2];
		}
		if (bottomLeft != null) {
			bottomLeft.content = cells[3];
		}
	}
	cell(x, y) {
		return this.shape.get(x, y)?.content;
	}
	getRandomPath(x, y) {
		const paths = this.getPaths(x, y);
		return randItem(paths);
	}
	getPaths(x, y, paths = [], path = []) {
		const cell = this.cell(x, y);
		if (cell == null) {
			paths.push(path);
			return paths;
		}

		if (path.length === 3) {
			return paths;
		}

		for (let i = 0; i < cell.length; i++) {
			if (cell[i]?.out ?? false) {
				const off = dirVec[i](1);
				this.getPaths(x + off.x, y + off.y, paths, [...path, i]);
			}
		}

		return paths;
	}
}

export class RoadOne extends Road {
	constructor(x, y, vertical) {
		const shape = AAP.fromShape(x, y, vertical ? [2, -1, -2, 1] : [1, -2, -1, 2]);

		// top-left, top-right, bottom-right, bottom-left
		// up, right, down, left
		const cells = [
			[null, null, {in: true, out: true}, null],
			[{in: true, out: true}, null, null, null],
			[null, null, null, null],
			[null, null, null, null],
		];

		super(shape, cells, vertical ? 0 : 3);
		this.vertical = vertical;
	}
	createRenderable(renderer) {
		const renderable = renderer.getInstance(roadShape, roadMaterial);
		const lines = renderer.getInstance(lineShape, lineMaterial);
		lines.zIndex = 200;
		renderable.getChildren = () => [lines];
		return renderable;
	}
	onRender() {
		this.renderable.x = this.shape.x;
		this.renderable.y = this.shape.y + (this.vertical ? 0 : -2);
		this.renderable.r = -this.vertical ? 0 : Math.PI / 2;
	}
}

export class RoadTwo extends Road {
	constructor(x, y, dir) {
		const shape = AAP.fromShape(x, y, [2, -2, -2, 2]);

		// top-left, top-right, bottom-right, bottom-left
		// up, right, down, left
		const cells = [
			[null, null, {out: true}, {in: true}],
			[null, null, null, {in: true, out: true}],
			[{in: true}, {out: true}, null, null],
			[null, null, {in: true, out: true}, null],
		];

		super(shape, cells, dir);
		this.dir = dir;
	}
	createRenderable(renderer) {
		const renderable = renderer.getInstance(road2x2Shape, roadMaterial);
		const lines = renderer.getInstance(lineTwoShape, lineTwoMaterial);
		lines.zIndex = 200;
		renderable.getChildren = () => [lines];
		return renderable;
	}
	onRender() {
		this.renderable.x = this.shape.x + 1;
		this.renderable.y = this.shape.y - 1;
		this.renderable.r = -this.dir * Math.PI / 2;
	}
}

export class RoadThree extends Road {
	constructor(x, y, dir) {
		const shape = AAP.fromShape(x, y, [2, -2, -2, 2]);

		// top-left, top-right, bottom-right, bottom-left
		// up, right, down, left
		const cells = [
			[null, null, {out: true}, {in: true, out: true}],
			[{in: true}, null, null, {in: true, out: true}],
			[{in: true, out: true}, {in: true, out: true}, null, null],
			[null, {in: true, out: true}, {in: true, out: true}, null],
		];

		super(shape, cells, dir);
		this.dir = dir;
	}
	createRenderable(renderer) {
		const renderable = renderer.getInstance(road2x2Shape, roadMaterial);
		const lines = renderer.getInstance(lineThreeShape, lineThreeMaterial);
		lines.zIndex = 200;
		renderable.getChildren = () => [lines];
		return renderable;
	}
	onRender() {
		this.renderable.x = this.shape.x + 1;
		this.renderable.y = this.shape.y - 1;
		this.renderable.r = -this.dir * Math.PI / 2;
	}
}

export class RoadFour extends Road {
	constructor(x, y) {
		const shape = AAP.fromShape(x, y, [2, -2, -2, 2]);

		// top-left, top-right, bottom-right, bottom-left
		// up, right, down, left
		const cells = [
			[null, null, {in: true, out: true}, {in: true, out: true}],
			[{in: true, out: true}, null, null, {in: true, out: true}],
			[{in: true, out: true}, {in: true, out: true}, null, null],
			[null, {in: true, out: true}, {in: true, out: true}, null],
		];

		super(shape, cells, 0);
	}
	createRenderable(renderer) {
		const renderable = renderer.getInstance(road2x2Shape, roadMaterial);
		const lines = renderer.getInstance(lineFourShape, lineFourMaterial);
		lines.zIndex = 200;
		renderable.getChildren = () => [lines];
		return renderable;
	}
	onRender() {
		this.renderable.x = this.shape.x + 1;
		this.renderable.y = this.shape.y - 1;
	}
}

function isIntersection(cell) {
	return cell.content instanceof RoadThree || cell.content instanceof RoadFour;
}

const blue = rgba(0, 0, .75);
const carCoords = [{x: -.25, y: .45}, {x: .25, y: .45}, {x: .25, y: -.45}, {x: -.25, y: -.45}];
const carShape = new Shape(carCoords, Shape.triangleFan);
const carMaterial = new VectorMaterial([blue, blue, blue, blue]);
export class Car extends Component {
	constructor(x, y, dir) {
		super(AAP.fromShape(x, y, [1, -1, -1, 1]));
		this.waitTime = 0;
		this.moving = true;
		this.progress = 0;
		this.path = [dir];
	}
	get dir() {
		return this.path[0];
	}
	createRenderable(renderer) {
		const renderable = renderer.getInstance(carShape, carMaterial);
		renderable.zIndex = 300;
		return renderable;
	}
	onStep(frameId) {
		this.progress = frameId % 5;
	}
	onRender(ratio) {
		const amount = this.moving ? (this.progress + ratio) / 5 : 0;
		const off = dirVec[this.dir](amount);
		this.renderable.x = this.shape.x + .5 + off.x;
		this.renderable.y = this.shape.y - .5 + off.y;
		this.renderable.r = -this.dir * Math.PI / 2;
	}
}

export class TrafficController extends Component {
	constructor(map) {
		super(null);
		this.map = map;
		this.cars = new Set();
		this.entrances = new Set();
		this.roadCount = 0;
	}
	tryAddRoad(road) {
		// construct list of border edges
		const {x, y} = road.shape;
		const edgeCoords = [];
		for (let i = road.shape.minX; i <= road.shape.maxX; i++) {
			edgeCoords.push({x: x + i, y: y + road.shape.maxY, dir: dirs.up});
			edgeCoords.push({x: x + i, y: y + road.shape.minY, dir: dirs.down});
		}
		for (let i = road.shape.minY; i <= road.shape.maxY; i++) {
			edgeCoords.push({x: x + road.shape.minX, y: y + i, dir: dirs.left});
			edgeCoords.push({x: x + road.shape.maxX, y: y + i, dir: dirs.right});
		}

		// check for invalid lane transitions between neighbors
		for (const coord of edgeCoords) {
			const off = dirVec[coord.dir](1);
			const nx = coord.x + off.x;
			const ny = coord.y + off.y;
			const neighbor = this.map.shape.get(nx, ny)?.content;
			if (!(neighbor instanceof Road)) {
				continue;
			}

			const backDir = (coord.dir + 2) % 4;
			const ourCell = road.cell(coord.x, coord.y);
			const theirCell = neighbor.cell(nx, ny);
			const canEnterOurs = ourCell[backDir]?.in ?? false;
			const canExitOurs = ourCell[coord.dir]?.out ?? false;
			const canEnterTheirs = theirCell[coord.dir]?.in ?? false;
			const canExitTheirs = theirCell[backDir]?.out ?? false;
			if (canEnterOurs !== canExitTheirs || canEnterTheirs !== canExitOurs) {
				return "Invalid connection between road segments";
			}
		}

		// roads along map border may be entrances
		if (road instanceof RoadOne) {
			if (road.vertical && (
				road.shape.y === this.map.shape.minY ||
				road.shape.y === this.map.shape.maxY
			)) {
				this.entrances.add(road);
			} else if (!road.vertical && (
				road.shape.x === this.map.shape.minX ||
				road.shape.x === this.map.shape.maxX
			)) {
				this.entrances.add(road);
			} else {
				this.entrances.delete(road);
			}
		}

		this.roadCount++;
		return null;
	}
	removeRoad(road) {
		this.entrances.delete(road);
		this.roadCount--;
	}
	moveCars() {
		const cellToCar = new Map();

		// advance each car and determine path
		for (const car of this.cars) {
			if (car.moving) {
				const dir = car.path.shift();
				const off = dirVec[dir](1);
				car.shape.x += off.x;
				car.shape.y += off.y;
			}

			const cell = this.map.shape.get(car.shape.x, car.shape.y);
			if (!(cell?.content instanceof Road)) {
				this.children.delete(car);
				this.cars.delete(car);
				continue;
			}

			cellToCar.set(cell, car);

			if (car.path.length === 0) {
				car.path.push(...cell.content.getRandomPath(car.shape.x, car.shape.y));
			}

			if (car.path.length === 1) {
				const off = dirVec[car.dir](1);
				const nx = car.shape.x + off.x;
				const ny = car.shape.y + off.y;
				const next = this.map.shape.get(nx, ny)?.content;
				if (next instanceof Road) {
					car.path.push(...next.getRandomPath(nx, ny));
				}
			}
		}

		// preprocess data to be used for traffic control
		const carToPathCells = new Map();
		for (const car of this.cars) {
			// get list of cells in car path
			const pos = {x: car.shape.x, y: car.shape.y};
			const pathCells = [this.map.shape.get(pos.x, pos.y)];
			for (const dir of car.path) {
				const off = dirVec[dir](1);
				pos.x += off.x;
				pos.y += off.y;
				const pathCell = this.map.shape.get(pos.x, pos.y);
				pathCells.push(pathCell);
			}

			carToPathCells.set(car, pathCells);
		}

		// handle stopping/starting cars
		const carsAtIntersection = new Map();
		const carsInIntersection = new Map();
		for (const car of this.cars) {
			const [curCell, ...nextCells] = carToPathCells.get(car);
			if (isIntersection(curCell)) {
				if (!carsInIntersection.has(curCell.content)) {
					carsInIntersection.set(curCell.content, []);
				}

				carsInIntersection.get(curCell.content).push(car);
			}

			// if nextCell is already occupied, stop the car
			if (nextCells[0] == null) {
				continue;
			}

			if (cellToCar.get(nextCells[0]) != null) {
				car.moving = false;
				continue;
			}

			// collect cars at intersections
			if (curCell.content !== nextCells[0].content && isIntersection(nextCells[0])) {
				if (!carsAtIntersection.has(nextCells[0].content)) {
					carsAtIntersection.set(nextCells[0].content, []);
				}

				carsAtIntersection.get(nextCells[0].content).push(car);
				car.moving = false;
				continue;
			}

			// no obstacles, car can move freely
			car.moving = true;
		}

		// handle cars at intersections
		for (const [intersection, cars] of carsAtIntersection.entries()) {
			/*
				TODO: cars currently only enter an intersection if there are no other cars
				which have a path that will overlap their path through the intersection.
				this is mostly good enough in that it prevents deadlocks while allowing more
				than one car in an intersection at once, in some scenarios, but for instance
				a car which is "following" another car will have to wait for the first one
				to go through the whole intersection before it will follow suit.
				This could be improved by checking each car at *each point in time*, and
				allowing cars to move along as long as there are no other cars in their
				path *at the point in time which they get there*.
			*/

			// cars already in intersection keep existing claims
			const claimedCells = new Set();
			for (const car of carsInIntersection.get(intersection) ?? []) {
				const cells = carToPathCells.get(car).filter((c) => c.content === intersection);
				for (const cell of cells) {
					claimedCells.add(cell);
				}
			}

			// cars with higher waitTimes get higher priority
			const sorted = cars.sort((a, b) => b.waitTime - a.waitTime);
			for (const car of sorted) {
				const cells = carToPathCells.get(car).filter((c) => c.content === intersection);

				// if any cell in our path is claimed, abort
				if (cells.some((c) => claimedCells.has(c))) {
					continue;
				}

				// we get to move and claim cells
				car.moving = true;
				for (const cell of cells) {
					claimedCells.add(cell);
				}
			}
		}

		// update wait times
		for (const car of this.cars) {
			if (car.moving) {
				car.waitTime = 0;
			} else {
				car.waitTime++;
			}
		}

		return cellToCar;
	}
	addCars(occupiedCells) {
		// don't overcrowd the roads
		if (this.cars.size >= this.roadCount) {
			return;
		}

		// get unoccupied entrance cells
		const entryPoints = [...this.entrances].map((e) => {
			if (e.vertical) {
				if (e.shape.y === 0) {
					return {dir: dirs.up, x: e.shape.x + 1, y: e.shape.y - 1};
				}

				return {dir: dirs.down, x: e.shape.x, y: e.shape.y + 1};
			} else if (e.shape.x === 0) {
				return {dir: dirs.right, x: e.shape.x - 1, y: e.shape.y - 1};
			}
			return {dir: dirs.left, x: e.shape.x + 1, y: e.shape.y};
		}).filter((e) => {
			const off = dirVec[e.dir](1);
			return !occupiedCells.has(this.map.shape.get(e.x + off.x, e.y + off.y));
		});

		if (entryPoints.length === 0) {
			return;
		}

		// pick a random entrypoint
		const {x, y, dir} = randItem(entryPoints);
		const car = new Car(x, y, dir);
		this.children.add(car);
		this.cars.add(car);
	}
	onStep(frameId) {
		if (frameId % 5 !== 0) {
			return;
		}

		const occupiedCells = this.moveCars();

		if (frameId % 10 !== 0 || this.entrances.size === 0) {
			return;
		}

		this.addCars(occupiedCells);
	}
}
