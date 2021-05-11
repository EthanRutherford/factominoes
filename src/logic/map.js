import {rgba, builtIn} from "2d-gl";
import {Component} from "./component";
import {getBuilding} from "./renderables/building";
import {AAP} from "./shape";
import {Road, TrafficController} from "./traffic";
const {Shape, VectorMaterial} = builtIn;

export class Building extends Component {
	constructor(name, x, y, shape) {
		super(AAP.fromShape(x, y, shape));
		this.name = name;
		this.shapeDef = shape;
	}
	reshape(x, y, shape) {
		try {
			// recreate shape and invalidate cached renderable
			const newShape = AAP.fromShape(x, y, shape);
			this.shape = newShape;
			this.shapeDef = shape;
			this.hasCachedRenderable = false;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn(error);
		}
	}
	createRenderable(renderer) {
		return getBuilding(renderer, this.shape.coords);
	}
}

const black = rgba(0, 0, 0);
const mapMaterial = new VectorMaterial([black, black, black, black]);
export class GameMap extends Component {
	constructor(bounds, children) {
		super(AAP.fromBounds(0, 0, bounds), children);
		this.trafficController = new TrafficController(this);
		this.children.add(this.trafficController);

		for (const child of children) {
			const warning = this.tryAddChild(child);
			if (warning != null) {
				throw new Error(warning);
			}
		}
	}
	tryAddChild(child) {
		if (!this.shape.softContains(child.shape)) {
			return `${child.name ?? child.constructor.name} is outside map bounds`;
		}

		for (const cell of child.shape.cells) {
			const mapCell = this.shape.get(child.shape.x + cell.x, child.shape.y + cell.y);
			if (mapCell.content != null) {
				return `${
					child.name ?? child.constructor.name
				} overlaps ${
					mapCell.content.name ?? mapCell.content.constructor.name
				}`;
			}
		}

		if (child instanceof Road) {
			const warning = this.trafficController.tryAddRoad(child);
			if (warning != null) {
				return warning;
			}
		}

		for (const cell of child.shape.cells) {
			const mapCell = this.shape.get(child.shape.x + cell.x, child.shape.y + cell.y);
			mapCell.content = child;
		}

		return null;
	}
	removeChild(child) {
		for (const cell of child.shape.cells) {
			const mapCell = this.shape.get(child.shape.x + cell.x, child.shape.y + cell.y);
			mapCell.content = null;
		}

		if (child instanceof Road) {
			this.trafficController.removeRoad(child);
		}
	}
	resize(bounds) {
		const oldShape = this.shape;
		this.shape = AAP.fromBounds(0, 0, bounds);
		for (const child of this.children) {
			if (child instanceof TrafficController) {
				continue;
			}

			const warning = this.tryAddChild(child);
			if (warning != null) {
				this.shape = oldShape;
				return "Map contents do not fit in new size";
			}
		}

		this.hasCachedRenderable = false;
		return null;
	}
	createRenderable(renderer) {
		const shape = new Shape(this.shape.coords, Shape.lineLoop);
		const renderable = renderer.getInstance(shape, mapMaterial);
		renderable.zIndex = 200;
		return renderable;
	}
}
