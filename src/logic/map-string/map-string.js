import {Building} from "../map";
import {Terrain} from "../terrain";
import {RoadFour, RoadOne, RoadThree, RoadTwo} from "../traffic";
import {endDelimChar, fromBase64, toBase64} from "./util";
import {v1} from "./v1-parsers";

// for versioning; if mapstrings change in the future, keep old parsers so old strings
// can continue to be loaded. New strings will always be latest mapString version.
const parsers = {
	1: v1,
};

function toId(component) {
	let base = 0;
	if (component instanceof Building) {
		return toBase64(base);
	}

	base += 1;
	if (component instanceof RoadOne) {
		return toBase64(base + (component.vertical ? 1 : 0));
	}

	base += 2;
	if (component instanceof RoadTwo) {
		return toBase64(base + component.dir);
	}

	base += 4;
	if (component instanceof RoadThree) {
		return toBase64(base + component.dir);
	}

	base += 4;
	if (component instanceof RoadFour) {
		return toBase64(base);
	}

	base += 1;
	if (component instanceof Terrain) {
		return toBase64(base + component.kind);
	}

	return null;
}

function roadOneMapper({road, length}) {
	const string = toBase64(road.shape.x, 2) + toBase64(road.shape.y, 2);
	return string + toBase64(length, 2);
}

function xyMapper(component) {
	return toBase64(component.shape.x, 2) + toBase64(component.shape.y, 2);
}

const mappers = {
	[toBase64(0)](building) {
		let string = building.name + endDelimChar;
		string += toBase64(building.shape.x, 2) + toBase64(building.shape.y, 2);
		for (let i = 0; i < building.shape.coords.length - 1; i++) {
			const next = building.shape.coords[i + 1];
			if (i % 2 === 0) {
				string += toBase64(building.shape.x + next.x, 2);
			} else {
				string += toBase64(building.shape.y + next.y, 2);
			}
		}

		return string + endDelimChar;
	},
	[toBase64(1)]: roadOneMapper,
	[toBase64(2)]: roadOneMapper,
	[toBase64(3)]: xyMapper,
	[toBase64(4)]: xyMapper,
	[toBase64(5)]: xyMapper,
	[toBase64(6)]: xyMapper,
	[toBase64(7)]: xyMapper,
	[toBase64(8)]: xyMapper,
	[toBase64(9)]: xyMapper,
	[toBase64(10)]: xyMapper,
	[toBase64(11)]: xyMapper,
	[toBase64(12)]: xyMapper,
	[toBase64(13)]: xyMapper,
};

export function toMapString(map) {
	// mapString version
	let string = toBase64(1);
	// add map bounds (width and height)
	string += toBase64(map.shape.maxX + 1, 2) + toBase64(map.shape.maxY + 1, 2);

	// combine roadOnes into road strips to reduce total mapstring length
	const roadOnes = new Set();
	const childrenById = {};
	const addChildById = (id, child) => {
		if (id == null) {
			return;
		}

		if (childrenById[id] == null) {
			childrenById[id] = new Set();
		}

		childrenById[id].add(child);
	};

	for (const child of map.children) {
		if (child instanceof RoadOne) {
			roadOnes.add(child);
		} else {
			const id = toId(child);
			addChildById(id, child);
		}
	}

	// combine roadOnes into road strips to reduce total mapstring length
	while (roadOnes.size > 0) {
		const road = roadOnes.values().next().value;
		const off = road.vertical ? {x: 0, y: 1} : {x: 1, y: 0};
		roadOnes.delete(road);

		// walk back to first road tile
		let first = road;
		let length = 1;
		while (true) {
			const back = map.shape.get(first.shape.x - off.x, first.shape.y - off.y)?.content;
			if (!(back instanceof RoadOne) || back.vertical !== road.vertical) {
				break;
			}

			roadOnes.delete(back);
			first = back;
			length++;
		}

		// walk forward to last road tile
		let last = road;
		while (true) {
			last = map.shape.get(last.shape.x + off.x, last.shape.y + off.y)?.content;
			if (!(last instanceof RoadOne) || last.vertical !== road.vertical) {
				break;
			}

			roadOnes.delete(last);
			length++;
		}

		const id = toId(first);
		addChildById(id, {road: first, length});
	}

	for (const [id, children] of Object.entries(childrenById)) {
		string += id;
		for (const child of children) {
			string += mappers[id](child);
		}

		string += endDelimChar;
	}

	return string;
}

export function fromMapString(str) {
	// if we ever reach 64 string versions, we'll have problems, but that's highly unlikely.
	// if we actually reach 32, I'll add a second char to add a couple thousand more versions.
	// e.g. `if (version >= 32) version = version * 64 + fromBase64(str[1])`
	const version = fromBase64(str[0]);
	return parsers[version].map(str, 1);
}
