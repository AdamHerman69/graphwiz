import type { D3Node } from './canvas.svelte';
import * as d3 from 'd3';

// Assuming d3 is available in the worker context. If not, you'll need to import or define the necessary functions.
// importScripts('https://d3js.org/d3.v6.min.js');

let simulation: d3.Simulation<D3Node, d3.SimulationLinkDatum<D3Node>>;
let d3nodes: D3Node[];
let d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];

function log(message: string) {
	postMessage({
		type: 'log',
		message: message
	});
}

// Helper function to start or restart the simulation with new data
function startSimulation(
	d3nodes: D3Node[],
	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[],
	width: number,
	height: number
) {
	log(width + ' ' + height);
	simulation = d3
		.forceSimulation(d3nodes)
		.force(
			'link',
			d3.forceLink(d3links).id((d3node) => (d3node as D3Node).id)
		)
		.force('charge', d3.forceManyBody())
		.force('center', d3.forceCenter(width / 2, height / 2))
		.on('tick', () => {
			// On each tick, post the updated nodes back to the main thread
			postMessage({
				type: 'tick',
				nodes: d3nodes
			});
		});
}

// Message handler for receiving data and commands from the main thread
onmessage = function (event) {
	const {
		type,
		nodes,
		links,
		width,
		height,
		nodeId,
		position,
		zeroAlphaTarget,
		resetFixedPosition
	} = event.data;
	switch (type) {
		case 'startSimulation':
			d3nodes = nodes;
			d3links = links;
			startSimulation(d3nodes, d3links, width, height);
			log('Simulation started');
			break;
		case 'dragStarted':
			simulation.alphaTarget(0.3).restart();
			break;
		case 'dragged':
			let draggedNode = d3nodes.find((node) => node.id === nodeId);
			if (draggedNode) {
				draggedNode.fx = position.fx;
				draggedNode.fy = position.fy;
			}
			break;
		case 'dragEnded':
			if (zeroAlphaTarget) simulation.alphaTarget(0);

			if (resetFixedPosition) {
				let draggedNode = d3nodes.find((node) => node.id === nodeId);
				if (draggedNode) {
					draggedNode.fx = null;
					draggedNode.fy = null;
				}
			}
			break;
		default:
			console.error('Unknown message type:', type);
	}
};
