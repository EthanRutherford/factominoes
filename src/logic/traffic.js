import {Component} from "./component";
import {getCar, getRoadFour, getRoadOne, getRoadThree, getRoadTwo} from "./renderables/traffic";
import {AAP} from "./shape";
import {randItem} from "./util";

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
		return getRoadOne(renderer);
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
		return getRoadTwo(renderer);
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
		return getRoadThree(renderer);
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
		return getRoadFour(renderer);
	}
	onRender() {
		this.renderable.x = this.shape.x + 1;
		this.renderable.y = this.shape.y - 1;
	}
}

function isIntersection(cell) {
	return cell.content instanceof RoadThree || cell.content instanceof RoadFour;
}

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
		return getCar(renderer);
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

		function addCarClaims(claims, car, intersection) {
			const cells = carToPathCells.get(car);
			for (let i = 0; i < claims.length; i++) {
				if (cells[i]?.content === intersection) {
					claims[i].add(cells[i]);
				}
				if (cells[i + 1]?.content === intersection) {
					claims[i].add(cells[i + 1]);
				}
			}
		}

		// handle cars at intersections
		for (const [intersection, cars] of carsAtIntersection.entries()) {
			// cars already in intersection keep existing claims
			const claimedCells = [new Set(), new Set(), new Set(), new Set()];
			for (const car of carsInIntersection.get(intersection) ?? []) {
				addCarClaims(claimedCells, car, intersection);
			}

			// cars with higher waitTimes get higher priority
			const sorted = cars.sort((a, b) => b.waitTime - a.waitTime);
			for (const car of sorted) {
				const cells = carToPathCells.get(car);

				// if any cell in our path is already claimed, abort
				if (cells.some((cell, i) =>
					(claimedCells[i]?.has(cell) ?? false) ||
					(claimedCells[i]?.has(cells[i + 1]) ?? false),
				)) {
					continue;
				}

				// we get to move and claim cells
				addCarClaims(claimedCells, car, intersection);
				car.moving = true;
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
