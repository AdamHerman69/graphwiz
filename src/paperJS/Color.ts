import { colord, type RgbaColor } from 'colord';
import type { Gradient } from '../utils/graphSettings.svelte';

export function toStringGradient(gradient: Gradient): [string, number][] {
	return gradient.map(([color, position]) => [colord(color).toRgbString(), position]);
}

export function getQualitativeColorScheme(colorCount: number): RgbaColor[] {
	return colorSchemes[colorCount];
}

const colorSchemes: RgbaColor[][] = [
	[], // 0
	[], // 1
	[], // 2
	[
		// 3
		{ r: 27, g: 158, b: 119, a: 1 },
		{ r: 217, g: 95, b: 2, a: 1 },
		{ r: 117, g: 112, b: 179, a: 1 }
	],
	[
		// 4
		{ r: 27, g: 158, b: 119, a: 1 },
		{ r: 217, g: 95, b: 2, a: 1 },
		{ r: 117, g: 112, b: 179, a: 1 },
		{ r: 231, g: 41, b: 138, a: 1 }
	],
	[
		// 5
		{ r: 27, g: 158, b: 119, a: 1 },
		{ r: 217, g: 95, b: 2, a: 1 },
		{ r: 117, g: 112, b: 179, a: 1 },
		{ r: 231, g: 41, b: 138, a: 1 },
		{ r: 102, g: 166, b: 30, a: 1 }
	],
	[
		// 6
		{ r: 27, g: 158, b: 119, a: 1 },
		{ r: 217, g: 95, b: 2, a: 1 },
		{ r: 117, g: 112, b: 179, a: 1 },
		{ r: 231, g: 41, b: 138, a: 1 },
		{ r: 102, g: 166, b: 30, a: 1 },
		{ r: 230, g: 171, b: 2, a: 1 }
	],
	[
		// 7
		{ r: 228, g: 26, b: 28, a: 1 },
		{ r: 55, g: 126, b: 184, a: 1 },
		{ r: 77, g: 175, b: 74, a: 1 },
		{ r: 152, g: 78, b: 163, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 255, g: 255, b: 51, a: 1 },
		{ r: 166, g: 86, b: 40, a: 1 }
	],
	[
		// 8
		{ r: 228, g: 26, b: 28, a: 1 },
		{ r: 55, g: 126, b: 184, a: 1 },
		{ r: 77, g: 175, b: 74, a: 1 },
		{ r: 152, g: 78, b: 163, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 255, g: 255, b: 51, a: 1 },
		{ r: 166, g: 86, b: 40, a: 1 },
		{ r: 247, g: 129, b: 191, a: 1 }
	],
	[
		// 9
		{ r: 228, g: 26, b: 28, a: 1 },
		{ r: 55, g: 126, b: 184, a: 1 },
		{ r: 77, g: 175, b: 74, a: 1 },
		{ r: 152, g: 78, b: 163, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 255, g: 255, b: 51, a: 1 },
		{ r: 166, g: 86, b: 40, a: 1 },
		{ r: 247, g: 129, b: 191, a: 1 },
		{ r: 153, g: 153, b: 153, a: 1 }
	],
	[
		// 10
		{ r: 166, g: 206, b: 227, a: 1 },
		{ r: 31, g: 120, b: 180, a: 1 },
		{ r: 178, g: 223, b: 138, a: 1 },
		{ r: 51, g: 160, b: 44, a: 1 },
		{ r: 251, g: 154, b: 153, a: 1 },
		{ r: 227, g: 26, b: 28, a: 1 },
		{ r: 253, g: 191, b: 111, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 202, g: 178, b: 214, a: 1 },
		{ r: 106, g: 61, b: 154, a: 1 }
	],
	[
		// 11
		{ r: 166, g: 206, b: 227, a: 1 },
		{ r: 31, g: 120, b: 180, a: 1 },
		{ r: 178, g: 223, b: 138, a: 1 },
		{ r: 51, g: 160, b: 44, a: 1 },
		{ r: 251, g: 154, b: 153, a: 1 },
		{ r: 227, g: 26, b: 28, a: 1 },
		{ r: 253, g: 191, b: 111, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 202, g: 178, b: 214, a: 1 },
		{ r: 106, g: 61, b: 154, a: 1 },
		{ r: 255, g: 255, b: 153, a: 1 }
	],
	[
		// 12
		{ r: 166, g: 206, b: 227, a: 1 },
		{ r: 31, g: 120, b: 180, a: 1 },
		{ r: 178, g: 223, b: 138, a: 1 },
		{ r: 51, g: 160, b: 44, a: 1 },
		{ r: 251, g: 154, b: 153, a: 1 },
		{ r: 227, g: 26, b: 28, a: 1 },
		{ r: 253, g: 191, b: 111, a: 1 },
		{ r: 255, g: 127, b: 0, a: 1 },
		{ r: 202, g: 178, b: 214, a: 1 },
		{ r: 106, g: 61, b: 154, a: 1 },
		{ r: 255, g: 255, b: 153, a: 1 },
		{ r: 177, g: 89, b: 40, a: 1 }
	]
];
