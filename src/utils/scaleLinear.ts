export function scaleLinear(
	domain: [number, number],
	range: [number, number],
	value: number
): number {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const factor = (r1 - r0) / (d1 - d0);
	return r0 + (value - d0) * factor;
}
