import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {Game} from "../logic/game";
import {Building, GameMap} from "../logic/map";
import {fromMapString, toMapString} from "../logic/map-string/map-string";
import {Terrain} from "../logic/terrain";
import {RoadOne, RoadFour, RoadThree, RoadTwo} from "../logic/traffic";
import {MapUi} from "./map";
import styles from "./map-maker.css";

const mapSaveKey = "editor-map-string-save";
function useGame() {
	const [game, setGame] = useState();
	const canvas = useRef();
	useEffect(() => {
		let map;
		try {
			map = fromMapString(localStorage.getItem(mapSaveKey));
		} catch (error) {
			map = new GameMap({width: 100, height: 100}, []);
		}

		const newGame = new Game(canvas.current, map);
		setGame(newGame);
		newGame.start();
		return () => newGame.end();
	}, []);

	return [game, canvas, (string) => localStorage.setItem(mapSaveKey, string)];
}

function useWarning() {
	const [warning, setWarning] = useState();
	const killTimeout = useRef();
	const addWarning = useCallback((text) => {
		clearTimeout(killTimeout.current);
		setWarning(text);
		killTimeout.current = setTimeout(() => setWarning(), 5000);
	}, []);

	return [warning, addWarning];
}

function useTool(game, setWarning) {
	const [, toggle] = useState();
	const value = useRef({});

	const tool = useCallback((...args) => {
		if (args.length > 0) {
			value.current = args[0];
			toggle((t) => !t);
		}

		return value.current;
	}, []);

	if (game != null && value.current == null) {
		value.current = dragTool(game, tool, setWarning);
	}

	return tool;
}

function grabBuildingEdge(ctrl, cell, cx, cy) {
	if (!(cell?.content instanceof Building)) {
		return null;
	}

	const component = cell.content;
	const coords = component.shape.coords.map(({x, y}) => ({
		x: component.shape.x + x, y: component.shape.y + y,
	}));

	for (let i = 0, j = 1; i < coords.length; i++, j = (j + 1) % coords.length) {
		const cur = coords[i];
		const next = coords[j];
		if (cur.x === cx && cur.y === cy) {
			return {component, coords, i};
		}

		if (cur.x === next.x && cur.x === cx) {
			const [lo, hi] = [cur.y, next.y].sort((a, b) => a - b);
			if (cy > lo && cy < hi) {
				coords.splice(i + 1, 0, {x: cx, y: cy}, {x: cx, y: cy});
				return {component, coords, i: i + (ctrl ? 2 : 1)};
			}
		} else if (cur.y === next.y && cur.y === cy) {
			const [lo, hi] = [cur.x, next.x].sort((a, b) => a - b);
			if (cx > lo && cx < hi) {
				coords.splice(i + 1, 0, {x: cx, y: cy}, {x: cx, y: cy});
				return {component, coords, i: i + (ctrl ? 2 : 1)};
			}
		}
	}

	return null;
}

function tryGrabEdge(game, pos, cellX, cellY, ctrl) {
	const cornerX = Math.round(pos.x);
	const cornerY = Math.round(pos.y);
	const tolerance = game.camera.zoom / 100;
	if (
		Math.abs(pos.x - cornerX) > tolerance ||
		Math.abs(pos.y - cornerY) > tolerance
	) {
		return null;
	}

	// check if/which building has an edge in this corner
	// (if more than one, use cell closest to click position)
	const otherX = cellX + (pos.x > cornerX ? -1 : 1);
	const otherY = cellY + (pos.y > cornerY ? -1 : 1);
	return grabBuildingEdge(ctrl, game.map.shape.get(cellX, cellY), cornerX, cornerY) ??
		grabBuildingEdge(ctrl, game.map.shape.get(cellX, otherY), cornerX, cornerY) ??
		grabBuildingEdge(ctrl, game.map.shape.get(otherX, cellY), cornerX, cornerY) ??
		grabBuildingEdge(ctrl, game.map.shape.get(otherX, otherY), cornerX, cornerY);
}

function equal(c1, c2) {
	return c1.x === c2.x && c1.y === c2.y;
}

function coordsToShape(coords) {
	// first, remove any duplicate coords (zero length segments)
	let i = 0;
	while (i < coords.length - 1) {
		if (equal(coords[i], coords[i + 1])) {
			coords.splice(i, 2);
		} else {
			i++;
		}
	}
	if (equal(coords[0], coords[coords.length - 1])) {
		const end = coords.splice(-2, 2);
		coords.splice(0, 1, end[0]);
	}

	if (coords.length < 4) {
		return null;
	}

	// then, generate the shape loop
	const {x, y} = coords[0];
	const shape = [];
	for (let i = 0, j = 1; i < coords.length; i++, j = (j + 1) % coords.length) {
		if (i % 2 === 0) {
			shape.push(coords[j].x - coords[i].x);
		} else {
			shape.push(coords[j].y - coords[i].y);
		}
	}

	return {x, y, shape};
}

function dragTool(game, curTool, setWarning) {
	return {
		mode: "drag",
		cursor: null,
		onClick(pos, {ctrl}) {
			const cellX = Math.floor(pos.x);
			const cellY = Math.ceil(pos.y);
			const cell = game.map.shape.get(cellX, cellY);

			// check to see if there's a building corner we can grab
			const grabResult = tryGrabEdge(game, pos, cellX, cellY, ctrl);
			if (grabResult != null) {
				curTool(edgeDragTool(game, grabResult, setWarning));
			} else if (cell?.content != null) {
				curTool(componentDragTool(game, cell.content, pos, setWarning));
				game.map.removeChild(cell.content);
			}
		},
		onDrag(pos) {
			const initialCursor = this.cursor;
			const cellX = Math.floor(pos.x);
			const cellY = Math.ceil(pos.y);
			if (tryGrabEdge(game, pos, cellX, cellY, false)) {
				this.cursor = "move";
			} else if (game.map.shape.get(cellX, cellY)?.content != null) {
				this.cursor = "grab";
			} else {
				this.cursor = null;
			}

			if (this.cursor !== initialCursor) {
				curTool(this);
			}
		},
		onDrop() {
			return this;
		},
	};
}

function edgeDragTool(game, grabResult, setWarning) {
	const originalPos = {x: grabResult.component.shape.x, y: grabResult.component.shape.y};
	const originalDef = grabResult.component.shapeDef;
	game.map.removeChild(grabResult.component);

	const cur = grabResult.i;
	const prev = cur - 1 + (cur > 0 ? 0 : grabResult.coords.length);
	const next = (cur + 1) % grabResult.coords.length;

	const pos = {x: grabResult.coords[cur].x, y: grabResult.coords[cur].y};
	return {
		mode: "edgeDrag",
		cursor: "move",
		onDrag(dragPos) {
			const dx = Math.round(dragPos.x);
			const dy = Math.round(dragPos.y);
			if (dx === pos.x && dy === pos.y) {
				return;
			}

			const coords = grabResult.coords.map(({x, y}) => ({x, y}));
			if (cur % 2 === 0) {
				coords[prev].x = dx;
				coords[next].y = dy;
			} else {
				coords[next].x = dx;
				coords[prev].y = dy;
			}

			coords[cur].x = pos.x = dx;
			coords[cur].y = pos.y = dy;

			// TODO: detection of *how* a shape self-intersects may be usable to
			// improve the behavior of dragging into intersections
			const shapeResult = coordsToShape(coords);
			if (shapeResult == null) {
				return;
			}

			grabResult.component.reshape(shapeResult.x, shapeResult.y, shapeResult.shape);
		},
		onDrop() {
			const warning = game.map.tryAddChild(grabResult.component);
			if (warning == null) {
				return;
			}

			setWarning(warning);
			grabResult.component.reshape(originalPos.x, originalPos.y, originalDef);
			game.map.tryAddChild(grabResult.component);
		},
	};
}

function componentDragTool(game, component, pos, setWarning) {
	const ix = component.shape.x;
	const iy = component.shape.y;
	const offX = pos.x - ix;
	const offY = pos.y - iy;

	return {
		mode: "componentDrag",
		cursor: "grabbing",
		onDrag(dragPos) {
			component.shape.x = Math.round(dragPos.x - offX);
			component.shape.y = Math.round(dragPos.y - offY);
		},
		onDrop() {
			const warning = game.map.tryAddChild(component);
			if (warning == null) {
				return;
			}

			setWarning(warning);
			component.shape.x = ix;
			component.shape.y = iy;
			game.map.tryAddChild(component);
		},
		onAbort() {
			game.map.children.delete(component);
		},
	};
}

function tileTool(mode, cursor, kinds, game, perform) {
	let curKind = 0;
	const curCursor = {pos: {x: -999999, y: 0}};

	const toCellPos = (pos) => ({x: Math.floor(pos.x), y: Math.ceil(pos.y)});
	function changeCursor() {
		const cellPos = toCellPos(curCursor.pos);
		game.map.children.delete(curCursor.tile);
		const data = kinds[curKind];
		if (data.create != null) {
			curCursor.tile = data.create(cellPos.x, cellPos.y);
			game.map.children.add(curCursor.tile);
		}

		curCursor.lockX = data.lockX ?? false;
		curCursor.lockY = data.lockY ?? false;
	}

	function moveCursor(pos, performing) {
		const cellPos = toCellPos(pos);
		if (performing) {
			if (!curCursor.lockX) {
				curCursor.pos.x = cellPos.x;
			}
			if (!curCursor.lockY) {
				curCursor.pos.y = cellPos.y;
			}
		} else {
			curCursor.pos = cellPos;
		}

		if (curCursor.tile != null) {
			curCursor.tile.shape.x = curCursor.pos.x;
			curCursor.tile.shape.y = curCursor.pos.y;
		}
	}

	let prevPos = null;
	changeCursor();
	return {
		mode, cursor,
		onKey(key) {
			if (key === "r") {
				curKind = (curKind + 1) % kinds.length;
				changeCursor();
			} else if (key === "R") {
				curKind = curKind > 0 ? curKind - 1 : kinds.length - 1;
				changeCursor();
			}
		},
		onClick(pos, {button}) {
			if (button === 0) {
				prevPos = pos;
				moveCursor(pos, false);
				perform(curCursor.pos, curKind);
			}
		},
		onDrag(pos, {button}) {
			if (button === 0) {
				const diffX = pos.x - prevPos.x;
				const diffY = pos.y - prevPos.y;

				const count = Math.ceil(Math.sqrt(diffX ** 2 + diffY ** 2) * 2);
				for (let i = 0; i < count; i++) {
					moveCursor({
						x: prevPos.x + (diffX * i / count),
						y: prevPos.y + (diffY * i / count),
					}, true);
					perform(curCursor.pos, curKind);
				}

				prevPos = pos;
			} else {
				moveCursor(pos, false);
			}
		},
		onDrop() {
			prevPos = null;
			return this;
		},
		onAbort() {
			game.map.children.delete(curCursor.tile);
		},
	};
}

function buildingTool(game) {
	const buildingKinds = [
		{create: (x, y) => new Building("building", x, y, [2, -2, -2, 2])},
	];

	function place(pos, kind) {
		const building = buildingKinds[kind].create(pos.x, pos.y);
		const warning = game.map.tryAddChild(building);
		if (!warning) {
			game.map.children.add(building);
		}
	}

	return tileTool("building", "none", buildingKinds, game, place);
}

function roadTool(game) {
	const roadKinds = [
		{create: (x, y) => new RoadOne(x, y, true), lockX: true},
		{create: (x, y) => new RoadOne(x, y, false), lockY: true},
		{create: (x, y) => new RoadTwo(x, y, 0)},
		{create: (x, y) => new RoadTwo(x, y, 1)},
		{create: (x, y) => new RoadTwo(x, y, 2)},
		{create: (x, y) => new RoadTwo(x, y, 3)},
		{create: (x, y) => new RoadThree(x, y, 0)},
		{create: (x, y) => new RoadThree(x, y, 1)},
		{create: (x, y) => new RoadThree(x, y, 2)},
		{create: (x, y) => new RoadThree(x, y, 3)},
		{create: (x, y) => new RoadFour(x, y)},
	];

	function place(pos, kind) {
		const road = roadKinds[kind].create(pos.x, pos.y);
		const warning = game.map.tryAddChild(road);
		if (!warning) {
			game.map.children.add(road);
		}
	}

	return tileTool("road", "none", roadKinds, game, place);
}

function terrainTool(game) {
	const terrainKinds = [
		{create: (x, y) => new Terrain(x, y, 0)},
	];

	function place(pos, kind) {
		const terrain = terrainKinds[kind].create(pos.x, pos.y);
		const warning = game.map.tryAddChild(terrain);
		if (!warning) {
			game.map.children.add(terrain);
		}
	}

	return tileTool("terrain", "none", terrainKinds, game, place);
}

function eraserTool(game) {
	function erase(pos) {
		const cell = game.map.shape.get(pos.x, pos.y);
		if (cell?.content != null) {
			game.map.children.delete(cell.content);
			game.map.removeChild(cell.content);
		}
	}

	return tileTool("delete", "cell", [{}], game, erase);
}

function SizeInput({getValue, onChange}) {
	const [tmpText, setTmpText] = useState();

	const min = 10;
	const max = 4000;
	return (
		<input
			type="number"
			className={styles.input}
			value={tmpText ?? getValue()}
			min={min} max={max} step={1}
			onChange={(event) => {
				setTmpText(event.target.value);
				const number = parseInt(event.target.value, 10) || 0;
				const value = Math.max(min, Math.min(max, number));
				onChange(value);
			}}
			onBlur={() => setTmpText(null)}
			onKeyDown={(event) => event.key === "Enter" ? event.target.blur() : null}
		/>
	);
}

function TextAreaButGood({value, onChange, ...props}) {
	const ref = useRef();
	const handle = useCallback((event) => onChange(event.target.value), [onChange]);
	useLayoutEffect(() => {
		ref.current.style.height = "0px";
		ref.current.style.height = `${ref.current.scrollHeight}px`;
	}, [value]);

	return <textarea {...props} value={value} onChange={handle} ref={ref} />;
}

export function MapMaker() {
	const [mapString, setMapString] = useState();
	const [game, canvas, saveMap] = useGame();
	const [warning, setWarning] = useWarning();
	const curTool = useTool(game, setWarning);

	return (
		<div className={styles.mapMaker}>
			<div className={styles.toolbar}>
				<h1 className={styles.toolbarTitle}>Map Editor</h1>
				<label className={styles.size}>
					width:
					<SizeInput
						getValue={() => (game?.map.shape.maxX ?? 0) + 1}
						onChange={(value) => {
							const warning = game.map.resize({
								width: value,
								height: game.map.shape.maxY + 1,
							});

							game.setCamPos(game.camera.x, game.camera.y);
							if (warning != null) {
								setWarning(warning);
							}
						}}
					/>
				</label>
				<label className={styles.size}>
					height:
					<SizeInput
						getValue={() => (game?.map.shape.maxY ?? 0) + 1}
						onChange={(value) => {
							const warning = game.map.resize({
								width: game.map.shape.maxX + 1,
								height: value,
							});

							game.setCamPos(game.camera.x, game.camera.y);
							if (warning != null) {
								setWarning(warning);
							}
						}}
					/>
				</label>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						curTool(dragTool(game, curTool, setWarning));
					}}
				>
					Grab Tool
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						if (curTool().mode === "building") {
							curTool(dragTool(game, curTool, setWarning));
						} else {
							curTool(buildingTool(game));
						}
					}}
				>
					Building Tool
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						if (curTool().mode === "road") {
							curTool(dragTool(game, curTool, setWarning));
						} else {
							curTool(roadTool(game));
						}
					}}
				>
					Road Tool
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						if (curTool().mode === "terrain") {
							curTool(dragTool(game, curTool, setWarning));
						} else {
							curTool(terrainTool(game));
						}
					}}
				>
					Terrain Tool
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						if (curTool().mode === "delete") {
							curTool(dragTool(game, curTool, setWarning));
						} else {
							curTool(eraserTool(game));
						}
					}}
				>
					Eraser
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						curTool(dragTool(game, curTool, setWarning));
						const mapString = toMapString(game.map);
						setMapString(mapString);
						saveMap(mapString);
					}}
				>
					Export
				</button>
				<button
					className={styles.button}
					onClick={() => {
						curTool().onAbort?.();
						curTool(dragTool(game, curTool, setWarning));

						try {
							const map = fromMapString(mapString);
							game.map = map;
							game.setCamPos(game.camera.x, game.camera.y);
						} catch (error) {
							setWarning("Invalid mapstring");
							console.error(error);
						}
					}}
				>
					Import
				</button>
				<TextAreaButGood
					className={styles.mapString}
					value={mapString}
					onChange={setMapString}
				/>
			</div>
			<MapUi
				game={game}
				style={{cursor: curTool()?.cursor}}
				onKey={(key) => curTool().onKey?.(key)}
				onClick={(pos, meta) => curTool().onClick?.(pos, meta)}
				onDrag={(pos, eventData) => curTool().onDrag?.(pos, eventData)}
				onDrop={(pos, eventData) => {
					const nextTool = curTool().onDrop?.(pos, eventData) ??
						dragTool(game, curTool, setWarning);
					curTool(nextTool);
					if (nextTool.mode === "drag") {
						nextTool.onDrag(pos, eventData);
					}
				}}
				ref={canvas}
			/>
			{warning != null && (
				<div className={styles.warning}>{warning}</div>
			)}
		</div>
	);
}
