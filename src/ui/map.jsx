import {forwardRef, useEffect} from "react";
import styles from "./map.css";

function mouseZoomPan(game, event) {
	// attempt to normalize wheel event data; some bits borrowed from
	// https://gist.github.com/akella/11574989a9f3cc9e0ad47e401c12ccaf

	let dx = -event.deltaX;
	let dy = -event.deltaY;

	// the shift key turns vertical scrolling into horizontal.
	// also, some trackpads (unfortunately) use this to do side scrolling
	if (event.shiftKey) {
		dx = dy;
		dy = 0;
	}

	// zoom/pan logic
	if (event.ctrlKey) {
		// TODO: actually have settings for controlling this
		// as a last resort, since zoom speeds are unpredictable,
		// allow user to manually adjust zoom speed
		dx *= 1;
		dy *= 1;

		// zoom
		const zoomValue = 1 - dy / 1000;
		const offx = event.offsetX, offy = event.offsetY;
		const oldPos = game.viewportToWorld(offx, offy);
		game.setCamZoom(game.camera.zoom * zoomValue);

		// center zoom on mouse position
		const newPos = game.viewportToWorld(offx, offy);
		game.setCamPos(
			game.camera.x + oldPos.x - newPos.x,
			game.camera.y + oldPos.y - newPos.y,
		);
	} else {
		// as a last resort, since zoom speeds are unpredictable,
		// allow user to manually adjust pan speed
		dx *= 1;
		dy *= 1;

		// pan
		game.setCamPos(
			game.camera.x - dx * game.camera.zoom / 1000,
			game.camera.y + dy * game.camera.zoom / 1000,
		);
	}
}

export const MapUi = forwardRef(function MapUi({
	game, onKey, onClick, onDrag, onDrop, style,
}, canvas) {
	useEffect(() => {
		if (game == null) {
			return null;
		}

		canvas.current.addEventListener("wheel", (event) => {
			event.preventDefault();
			mouseZoomPan(game, event);
		}, {passive: false});

		const contextMenu = (innerEvent) => innerEvent.preventDefault();
		let initialPos = null;
		let cameraDragging = false;
		let button = null;
		canvas.current.addEventListener("mousedown", (event) => {
			event.preventDefault();
			initialPos = game.viewportToWorld(event.offsetX, event.offsetY);
			cameraDragging = event.button === 2;
			if (cameraDragging) {
				document.addEventListener("contextmenu", contextMenu);
			} else {
				button = event.button;
				onClick?.(initialPos, {button, shift: event.shiftKey, ctrl: event.ctrlKey});
			}
		});

		canvas.current.addEventListener("mousemove", (event) => {
			event.preventDefault();
			const newPos = game.viewportToWorld(event.offsetX, event.offsetY);
			if (cameraDragging) {
				game.setCamPos(
					game.camera.x + initialPos.x - newPos.x,
					game.camera.y + initialPos.y - newPos.y,
				);
			} else {
				onDrag?.(newPos, {button, shift: event.shiftKey, ctrl: event.ctrlKey});
			}
		});

		const mouseUp = (event) => {
			if (["BUTTON", "INPUT"].includes(event.target.tagName)) {
				return;
			}

			event.preventDefault();
			const newPos = game.viewportToWorld(event.offsetX, event.offsetY);
			if (cameraDragging) {
				// delay removal to prevent context menu from firing
				setTimeout(() => document.removeEventListener("contextmenu", contextMenu), 1);
			} else {
				button = null;
				onDrop?.(newPos, {button, shift: event.shiftKey, ctrl: event.ctrlKey});
			}

			cameraDragging = false;
		};

		const keyPress = (event) => {
			if (event.target === document.body) {
				onKey(event.key, {shift: event.shiftKey, ctrl: event.ctrlKey});
			}
		};

		document.addEventListener("mouseup", mouseUp);
		document.addEventListener("keypress", keyPress);
		return () => {
			document.removeEventListener("mouseup", mouseUp);
			document.removeEventListener("keypress", keyPress);
		};
	}, [game]);

	return (
		<canvas
			className={styles.canvas}
			style={style}
			ref={canvas}
		/>
	);
});
