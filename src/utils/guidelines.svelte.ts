import type Graph from 'graphology';
import type { NodeSettings, EdgeSettings } from './graphSettings.svelte';

export type Literature = {};

export type Guideline = {
	name: string;
	description: string;
	eval: (graph: Graph) => number;
	score: number;
	nodeSettings?: NodeSettings[];
	edgeSettings?: EdgeSettings[];
	literature: Literature[];
};
