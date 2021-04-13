import {Renderer, Scene, rgba, builtIn, shaders} from "2d-gl";
const {OrthoCamera, Shape, VectorMaterial} = builtIn;
const {MotionBlur} = shaders;

// zIndex general ranges
// default/0: ground-floor objects
// 100 transparent grid
// 200 outlines
// 300 moving entities

export class Game {
	constructor(canvas, map) {
		this.map = map;

		// create renderer, scene, camera
		this.renderer = new Renderer(canvas);
		this.scene = new Scene({bgColor: rgba(.1, .5, .1)});
		this.camera = new OrthoCamera(
			(this.map.shape.minX + this.map.shape.maxX) / 2,
			(this.map.shape.minY + this.map.shape.maxY) / 2,
			20,
		);
		this.scene.getVisibleFunc = this.getVisibleFunc.bind(this);

		// add shaders
		this.blurShader = this.renderer.createShader(MotionBlur);
		this.scene.addPostProcShader(this.blurShader);

		// set up grid overlay
		const gridColor = rgba(1, 1, 1, .2);
		const lines = [];
		const colors = [];
		for (let i = -120; i < 120; i++) {
			// horizontal line
			lines.push({x: -120, y: i}, {x: 120, y: i});
			// vertical line
			lines.push({x: i, y: -120}, {x: i, y: 120});
			// colors
			colors.push(gridColor, gridColor, gridColor, gridColor);
		}

		const gridShape = new Shape(lines, Shape.lines);
		const gridMat = new VectorMaterial(colors);
		this.grid = this.renderer.getInstance(gridShape, gridMat);
		this.grid.zIndex = 100;

		// animframe
		this.animFrame = null;
	}
	viewportToWorld(x, y) {
		return this.renderer.viewportToWorld(x, y, this.camera);
	}
	setCamPos(x, y) {
		this.camera.x = Math.max(this.map.shape.minX, Math.min(this.map.shape.maxX, x));
		this.camera.y = Math.max(this.map.shape.minY, Math.min(this.map.shape.maxY, y));
	}
	setCamZoom(zoom) {
		const minZoom = 10;
		const maxZoom = 100;
		this.camera.zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
	}
	getVisibleFunc({x0, y0, x1, y1}) {
		const visible = new Set();
		visible.add(this.grid);

		const bounds = {
			x: 0, y: 0,
			minX: Math.floor(x0) - 1, maxX: Math.ceil(x1) + 1,
			minY: Math.floor(y0) - 1, maxY: Math.ceil(y1) + 1,
		};

		for (const component of Game.iterateVisible(bounds, this.map)) {
			if (component.renderable != null) {
				visible.add(component.renderable);
			}
		}

		return [...visible];
	}
	step(frameId) {
		for (const component of Game.iterateComponents(this.map)) {
			component.onStep(frameId);
		}
	}
	render(ratio) {
		for (const component of Game.iterateComponents(this.map)) {
			// hydrate renderable cache
			if (!component.hasCachedRenderable) {
				component.renderable = component.createRenderable(this.renderer);
				component.hasCachedRenderable = true;
			}

			component.onRender(ratio);
		}

		// move grid to always be in frame
		this.blurShader.deblur(this.grid);
		this.grid.x = Math.floor(this.camera.x);
		this.grid.y = Math.floor(this.camera.y);

		// render scene
		this.renderer.render(this.camera, this.scene);
	}
	start() {
		let frameId = 0;
		let prevStamp = performance.now();
		let acc = 0;

		const loop = () => {
			this.animFrame = requestAnimationFrame(loop);
			const stamp = performance.now();
			acc += (stamp - prevStamp) / 1000;
			prevStamp = stamp;

			if (acc > .1) {
				acc %= .1;
				this.step(frameId++);
			}

			this.render(acc / .1);
		};

		loop();
	}
	stop() {
		cancelAnimationFrame(this.animFrame);
	}
	static *iterateComponents(component) {
		yield component;
		for (const child of component.children) {
			yield* this.iterateComponents(child);
		}
	}
	static *iterateVisible(bounds, component) {
		if (!component.visible(bounds)) {
			return;
		}

		yield component;
		for (const child of component.children) {
			yield* this.iterateVisible(bounds, child);
		}
	}
}
