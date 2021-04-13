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
	getNextDir(car) {
		const {x, y} = car.shape;
		const dir = this.cell(x, y).findIndex((e) => e != null);
		car.lastRoad = this;
		car.decisions = 0;
		return dir;
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
	getNextDir(car) {
		const {x, y} = car.shape;
		const dir = this.cell(x, y).findIndex((e) => e?.out);
		car.lastRoad = this;
		car.decisions = 0;
		return dir;
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
	getNextDir(car) {
		const {x, y} = car.shape;
		const cell = this.cell(x, y);
		const inDirs = [];
		const outDirs = [];
		for (let i = 0; i < 4; i++) {
			if (cell[i]?.in ?? false) {
				inDirs.push(i);
			}
			if (cell[i]?.out ?? false) {
				outDirs.push(i);
			}
		}

		if (car.lastRoad === this) {
			if (car.decisions === 2 || inDirs.length + outDirs.length === 4) {
				return car.dir;
			}

			car.decisions++;
		} else {
			car.lastRoad = this;
			car.decisions = 1;
		}

		return randItem(outDirs);
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
	getNextDir(car) {
		const {x, y} = car.shape;
		const cell = this.cell(x, y);
		const dirs = [];
		for (let i = 0; i < 4; i++) {
			if (cell[i]?.out ?? false) {
				dirs.push(i);
			}
		}

		if (car.lastRoad === this) {
			if (car.decisions === 2) {
				return car.dir;
			}

			car.decisions++;
		} else {
			car.lastRoad = this;
			car.decisions = 1;
		}

		return randItem(dirs);
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
		this.dir = dir;
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
		const offset = dirVec[this.dir](amount);
		this.renderable.x = this.shape.x + .5 + offset.x;
		this.renderable.y = this.shape.y - .5 + offset.y;
		this.renderable.r = -this.dir * Math.PI / 2;
	}
}

export class TrafficController extends Component {
	constructor(map) {
		super(null);
		this.map = map;
		this.cars = new Set();
		this.entrances = new Set();
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

		return null;
	}
	removeRoad(road) {
		this.entrances.delete(road);
	}
	onStep(frameId) {
		// move cars
		const cellToCar = new Map();
		if (frameId % 5 === 0) {
			for (const car of this.cars) {
				if (car.moving) {
					const offset = dirVec[car.dir](1);
					car.shape.x += offset.x;
					car.shape.y += offset.y;
				}

				const cell = this.map.shape.get(car.shape.x, car.shape.y);
				if (!(cell?.content instanceof Road)) {
					this.children.delete(car);
					this.cars.delete(car);
					continue;
				}

				if (car.moving) {
					car.dir = cell.content.getNextDir(car);
				}

				cellToCar.set(cell, car);
			}

			// collect all car's next locations
			const contestedCells = new Map();
			for (const car of this.cars) {
				const offset = dirVec[car.dir](1);
				const nx = car.shape.x + offset.x;
				const ny = car.shape.y + offset.y;

				// if nextCell is already occupied, stop the car
				const nextCell = this.map.shape.get(nx, ny);
				if (nextCell == null) {
					continue;
				}

				if (cellToCar.get(nextCell) != null) {
					car.moving = false;
					continue;
				}

				if (!contestedCells.has(nextCell)) {
					contestedCells.set(nextCell, []);
				}

				contestedCells.get(nextCell).push(car);
			}

			// resolve contested cells
			for (const cars of contestedCells.values()) {
				// stop cars
				for (const car of cars) {
					car.moving = false;
				}

				// car with largest waitTime gets to move
				const oldestCar = cars.reduce((best, cur) => {
					if (cur.waitTime > best.waitTime) {
						return cur;
					}

					return best;
				}, cars[0]);

				oldestCar.moving = true;
			}

			// update wait time
			for (const car of this.cars) {
				if (car.moving) {
					car.waitTime = 0;
				} else {
					car.waitTime++;
				}
			}
		}

		// add new car
		if (frameId % 10 === 0 && this.entrances.size > 0) {
			const entrance = randItem([...this.entrances]);
			let dir, x, y;
			if (entrance.vertical) {
				if (entrance.shape.y === 0) {
					dir = dirs.up;
					x = entrance.shape.x + 1;
					y = entrance.shape.y - 1;
				} else {
					dir = dirs.down;
					x = entrance.shape.x;
					y = entrance.shape.y + 1;
				}
			} else if (entrance.shape.x === 0) {
				dir = dirs.right;
				x = entrance.shape.x - 1;
				y = entrance.shape.y - 1;
			} else {
				dir = dirs.left;
				x = entrance.shape.x + 1;
				y = entrance.shape.y;
			}

			const off = dirVec[dir](1);
			if (cellToCar.get(this.map.shape.get(x + off.x, y + off.y)) == null) {
				const car = new Car(x, y, dir);
				this.children.add(car);
				this.cars.add(car);
			}
		}
	}
}
