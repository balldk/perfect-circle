export function approx(a: number, b: number, eps = 0.00001): boolean {
	return Math.abs(a - b) < eps
}

export function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
