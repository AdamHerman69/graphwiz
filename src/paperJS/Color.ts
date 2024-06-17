import { colord } from 'colord';
import type { Gradient } from '../utils/graphSettings.svelte';

export function toStringGradient(gradient: Gradient): [string, number][] {
	return gradient.map(([color, position]) => [colord(color).toRgbString(), position]);
}
