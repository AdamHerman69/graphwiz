import { greadability } from './greadability';
import type { ReadabilityMetrics } from '../../utils/canvas.svelte';
import type { D3Node } from '../../utils/canvas.svelte';

let readabilityMetrics: ReadabilityMetrics;

function log(message: string) {
	postMessage({
		type: 'log',
		message: message
	});
}

onmessage = (event) => {
	const {
		nodes,
		links
	}: { nodes: D3Node[]; links: (d3.SimulationLinkDatum<D3Node> & { id: string })[] } = event.data;
	readabilityMetrics = greadability(nodes, links);

	postMessage({ type: 'readability', readability: readabilityMetrics });
};
