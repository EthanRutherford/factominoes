// all objects in the game world should be an instance of Component
// a game then contains a list (tree) of components, and said components
// implement all of their custom behaviors via game lifecycle hooks.

export class Component {
	constructor(shape, children = []) {
		this.shape = shape;
		this.children = new Set(children);
		this.renderable = null;
		this.hasCachedRenderable = false;
	}
	visible(bounds) {
		// return true when there's no shape, so children can be checked
		return this.shape?.softOverlaps(bounds) ?? true;
	}
	// override this to handle logic on each step
	onStep(/* frameId */) {
	}
	// override this to customize any frame-to-frame animation
	onRender(/* ratio */) {
		if (this.renderable != null) {
			this.renderable.x = this.shape.x;
			this.renderable.y = this.shape.y;
		}
	}
	// override this to create renderable
	createRenderable(/* renderer */) {
		return null;
	}
}
