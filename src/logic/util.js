export function lerp(a, b, ratio) {
	return (a * (1 - ratio)) + (b * ratio);
}

export function randItem(array) {
	return array[Math.floor(Math.random() * array.length)];
}
