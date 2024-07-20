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

/**
 * Formats a number with a fixed number of decimal places, or as an integer if it's a whole number.
 * @param value The number to format
 * @param decimalPlaces The maximum number of decimal places to display
 * @returns A string representation of the formatted number
 */
export function formatDecimal(value: number, decimalPlaces: number): string {
	// Check if the number is an integer
	if (Number.isInteger(value)) {
		return value.toString();
	}

	// Round the number to the specified decimal places
	const roundedValue = Number(value.toFixed(decimalPlaces));

	// If the rounded value is an integer, return it without decimal places
	if (Number.isInteger(roundedValue)) {
		return roundedValue.toString();
	}

	// Otherwise, return the number with the specified decimal places
	return roundedValue.toFixed(decimalPlaces);
}
