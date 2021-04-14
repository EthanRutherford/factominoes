import {Building, GameMap} from "../map";
import {Terrain} from "../terrain";
import {RoadFour, RoadOne, RoadThree, RoadTwo} from "../traffic";
import {endDelimChar, fromBase64, toBase64} from "./util";

function parseRoad(type, str, index) {
	// all four kinds of roads
	const x = fromBase64(str.substr(index, 2));
	const y = fromBase64(str.substr(index + 2, 2));
	if (type < 2) {
		const vertical = !!type;
		const off = vertical ? {x: 0, y: 1} : {x: 1, y: 0};
		const length = fromBase64(str.substr(index + 4, 2));
		const roads = [];
		for (let i = 0; i < length; i++) {
			roads.push(new RoadOne(x + off.x * i, y + off.y * i, vertical));
		}

		return [index + 6, roads];
	}

	if (type < 6) {
		return [index + 4, new RoadTwo(x, y, type - 2)];
	}

	if (type < 10) {
		return [index + 4, new RoadThree(x, y, type - 6)];
	}

	return [index + 4, new RoadFour(x, y)];
}

function parseTerrain(type, str, index) {
	// terrain
	const x = fromBase64(str.substr(index, 2));
	const y = fromBase64(str.substr(index + 2, 2));
	return [index + 4, new Terrain(x, y, type)];
}

export const v1 = {
	map(str, index) {
		const width = fromBase64(str.substr(index, 2));
		const height = fromBase64(str.substr(index + 2, 2));
		index += 4;

		if (width == null || width < 10 || height == null || height < 10) {
			throw new Error("map width too small");
		}

		const children = [];
		while (index < str.length) {
			const childType = str[index++];
			while (str[index] !== endDelimChar) {
				const [i, child] = this[childType](str, index);
				children.push(child);
				index = i;
			}

			index += 1;
		}

		return new GameMap({width, height}, children.flat());
	},
	[toBase64(0)](str, index) {
		// building
		const endInd = str.indexOf(endDelimChar, index);
		const name = str.substring(index + 1, endInd);
		index = endInd + 1;
		const x = fromBase64(str.substr(index, 2));
		const y = fromBase64(str.substr(index + 2, 2));
		index += 4;

		const shape = [];
		const pos = [0, 0];
		while (str[index] !== endDelimChar) {
			const value = fromBase64(str.substr(index, 2));
			if (shape.length % 2 === 0) {
				const localX = value - x;
				shape.push(localX - pos[0]);
				pos[0] = localX;
			} else {
				const localY = value - y;
				shape.push(localY - pos[1]);
				pos[1] = localY;
			}

			index += 2;
		}

		shape.push(-pos[1]);

		return [index + 1, new Building(name, x, y, shape)];
	},
	[toBase64(1)]: (str, index) => parseRoad(0, str, index),
	[toBase64(2)]: (str, index) => parseRoad(1, str, index),
	[toBase64(3)]: (str, index) => parseRoad(2, str, index),
	[toBase64(4)]: (str, index) => parseRoad(3, str, index),
	[toBase64(5)]: (str, index) => parseRoad(4, str, index),
	[toBase64(6)]: (str, index) => parseRoad(5, str, index),
	[toBase64(7)]: (str, index) => parseRoad(6, str, index),
	[toBase64(8)]: (str, index) => parseRoad(7, str, index),
	[toBase64(9)]: (str, index) => parseRoad(8, str, index),
	[toBase64(10)]: (str, index) => parseRoad(9, str, index),
	[toBase64(11)]: (str, index) => parseRoad(10, str, index),
	[toBase64(12)]: (str, index) => parseTerrain(0, str, index),
	[toBase64(13)]: (str, index) => parseTerrain(1, str, index),
};
