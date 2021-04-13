export class Cell {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.border = {};
		this.content = null;
	}
}

// Axis Aligned Polygon
// `shape` is an array of alternating x, y coordinates which define the shape,
// in clockwise order. All shapes start at (0, 0), and each number in
// the `shape` array defines an offset, sharing x or y value of the previous point.
// So the array [4, -1, -4, 4], for example, results in the points
// [(0, 0), (4, 0), (4, -1), (0, -1), (0, 0)].
// Each edge of the shape is therefore aligned with either the x or y axis.
// shapes should return to 0, 0 and no segments should intersect.
export class AAP {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	get(x, y) {
		return this.grid[x - this.minX - this.x]?.[y - this.minY - this.y];
	}
	softOverlaps(other) {
		if (
			other.x + other.maxX < this.x + this.minX ||
			other.y + other.maxY < this.y + this.minY ||
			other.x + other.minX > this.x + this.maxX ||
			other.y + other.minY > this.y + this.maxY
		) {
			return false;
		}

		return true;
	}
	overlaps(other) {
		// fast check
		if (!this.softOverlaps(other)) {
			return false;
		}

		// full check
		const [small, large] = [this, other].sort((a, b) => a.cells.length - b.cells.length);

		for (const cell of small.cells) {
			if (large.get(small.x + cell.x, small.y + cell.y) != null) {
				return true;
			}
		}

		return false;
	}
	softContains(other) {
		if (
			other.x + other.maxX > this.x + this.maxX ||
			other.y + other.maxY > this.y + this.maxY ||
			other.x + other.minX < this.x + this.minX ||
			other.y + other.minY < this.y + this.minY
		) {
			return false;
		}

		return true;
	}
	contains(other) {
		// fast check
		if (!this.softContains(other)) {
			return false;
		}

		// full check
		for (const cell of other) {
			if (this.get(other.x + cell.x, other.y + cell.y) == null) {
				return false;
			}
		}

		return true;
	}
	static fromShape(x, y, shape) {
		const aap = new AAP(x, y);
		shapeToGrid(aap, shape);
		return aap;
	}
	static fromBounds(x, y, bounds) {
		const aap = new AAP(x, y);
		aap.minX = 0;
		aap.maxX = bounds.width - 1;
		aap.minY = 0;
		aap.maxY = bounds.height - 1;
		aap.coords = [
			{x: 0, y: bounds.height - 1},
			{x: bounds.width, y: bounds.height - 1},
			{x: bounds.width, y: -1},
			{x: 0, y: -1},
		];

		aap.grid = new Array(bounds.width);
		for (let x = 0; x < bounds.width; x++) {
			aap.grid[x] = new Array(bounds.height);
			for (let y = 0; y < bounds.height; y++) {
				aap.grid[x][y] = new Cell(x, y);
				if (x === 0) {
					aap.grid[x][y].border.left = true;
				} else if (x === bounds.width - 1) {
					aap.grid[x][y].border.right = true;
				}
				if (y === 0) {
					aap.grid[x][y].border.bottom = true;
				} else if (y === bounds.height - 1) {
					aap.grid[x][y].border.top = true;
				}
			}
		}

		return aap;
	}
}

function shapeToGrid(aap, shape) {
	const {path, coords, ...bounds} = shapeToPath(shape);
	aap.minX = bounds.minX;
	aap.maxX = bounds.maxX;
	aap.minY = bounds.minY;
	aap.maxY = bounds.maxY;
	aap.coords = coords;
	aap.grid = new Array(bounds.maxX - bounds.minX + 1).fill(0)
		.map(() => new Array(bounds.maxY - bounds.minY + 1));

	for (const segment of path) {
		for (let i = segment.start; i !== segment.end; i += segment.dir) {
			const [ox, oy] = segment.o(i);
			if (aap.grid[ox]?.[oy] != null) {
				throw new Error("Shape must not self-intersect");
			}

			const [x, y] = segment.p(i);
			const cell = getOrCreateCell(aap, x, y);
			cell.border[segment.border] = true;
		}
	}

	// flood-fill
	const [fx, fy] = path[0].p(path[0].start);
	aap.cells = [aap.grid[fx][fy]];
	aap.cells[0].added = true;
	for (const cell of aap.cells) {
		if (!cell.border.top) {
			const neighbor = getOrCreateCell(aap, cell.x - aap.minX, cell.y - aap.minY + 1);
			if (!neighbor.added) {
				aap.cells.push(neighbor);
				neighbor.added = true;
			}
		}
		if (!cell.border.bottom) {
			const neighbor = getOrCreateCell(aap, cell.x - aap.minX, cell.y - aap.minY - 1);
			if (!neighbor.added) {
				aap.cells.push(neighbor);
				neighbor.added = true;
			}
		}
		if (!cell.border.left) {
			const neighbor = getOrCreateCell(aap, cell.x - aap.minX - 1, cell.y - aap.minY);
			if (!neighbor.added) {
				aap.cells.push(neighbor);
				neighbor.added = true;
			}
		}
		if (!cell.border.right) {
			const neighbor = getOrCreateCell(aap, cell.x - aap.minX + 1, cell.y - aap.minY);
			if (!neighbor.added) {
				aap.cells.push(neighbor);
				neighbor.added = true;
			}
		}
	}
}

function shapeToPath(shape) {
	const coords = [];
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	const pos = [0, 0];
	const path = shape.map((d, i) => {
		if (d === 0) {
			throw new Error("Shape must not contain zero length segments");
		}

		const [sx, sy] = pos;
		coords.push({x: sx, y: sy});
		if (i % 2 === 0) {
			const dir = Math.sign(d);
			const xOff = dir === 1 ? 0 : -1;
			const yOff = dir === 1 ? 0 : 1;
			const ex = sx + d;
			minX = Math.min(minX, ex + (dir === 1 ? -1 : 0));
			maxX = Math.max(maxX, ex + (dir === 1 ? -1 : 0));
			pos[0] = ex;

			return {
				start: sx,
				end: ex,
				p: (i) => [i + xOff - minX, sy + yOff - minY],
				o: (i) => [i + xOff - minX, sy + yOff + dir - minY],
				border: dir === 1 ? "top" : "bottom",
				dir,
			};
		}

		const dir = Math.sign(d);
		const xOff = dir === 1 ? 0 : -1;
		const yOff = dir === 1 ? 1 : 0;
		const ey = sy + d;
		minY = Math.min(minY, ey + (dir === 1 ? 0 : 1));
		maxY = Math.max(maxY, ey + (dir === 1 ? 0 : 1));
		pos[1] = ey;

		return {
			start: sy,
			end: ey,
			p: (i) => [sx + xOff - minX, i + yOff - minY],
			o: (i) => [sx + xOff - dir - minX, i + yOff - minY],
			border: dir === 1 ? "left" : "right",
			dir,
		};
	});

	if (pos[0] !== 0 || pos[1] !== 0) {
		throw new Error("Shape must end at (0, 0)");
	}

	return {path, coords, minX, maxX, minY, maxY};
}

function getOrCreateCell(aap, x, y) {
	if (x < 0 || x > aap.grid.length || y < 0 || y > aap.grid[0].length) {
		throw new Error("Shape must not self-intersect");
	}

	aap.grid[x][y] = aap.grid[x][y] ?? new Cell(aap.minX + x, aap.minY + y);
	return aap.grid[x][y];
}
