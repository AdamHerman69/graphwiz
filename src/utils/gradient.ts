import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import type { Gradient } from './graphSettings.svelte';

extend([mixPlugin]);

export function getGradientColor(gradient: Gradient, position: number): Gradient {
	// Sort the gradient colors based on their positions
	let gradientCopy = [...gradient].sort((a, b) => a[1] - b[1]);

	// If the gradient doesn't end at 1, add the last color at 1
	if (gradientCopy[gradientCopy.length - 1][1] < 1) {
		gradientCopy.push([gradientCopy[gradientCopy.length - 1][0], 1]);
	}
	// If the gradient doesn't start at 0, add the first color at 0
	if (gradientCopy[0][1] > 0) {
		gradientCopy.unshift([gradientCopy[0][0], 0]);
	}

	let color1 = colord('#000000');
	let color2 = colord('#FFFFFF');
	let color1position = 0;
	let color2position = 1;

	for (let i = 0; i < gradientCopy.length; i++) {
		const [color, pos] = gradientCopy[i];
		if (pos <= position) {
			color1 = colord(color);
			color1position = pos;
		} else {
			color2 = colord(color);
			color2position = pos;
			break;
		}
	}

	if (color1position === color2position) {
		return [[color1.toRgb(), 1]];
	}

	const t = (position - color1position) / (color2position - color1position);
	const mixedColor = color1.mix(color2, t);

	return [[mixedColor.toRgb(), 1]];
}
