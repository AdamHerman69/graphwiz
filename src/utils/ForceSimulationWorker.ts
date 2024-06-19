import type { D3Node } from './canvas.svelte';
import * as d3 from 'd3';

// Assuming d3 is available in the worker context. If not, you'll need to import or define the necessary functions.
// importScripts('https://d3js.org/d3.v6.min.js');

let simulation;

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
	const { type, nodes, links, width, height, nodeId, position } = event.data;
	switch (type) {
		case 'startSimulation':
			startSimulation(nodes, links, width, height);
			log('Simulation started');
			break;
		case 'dragStarted':
			// Optional: Implement logic for when dragging starts, such as fixing the position of the node being dragged
			break;
		case 'dragged':
			// Optional: Update the position of the dragged node in the simulation
			// This might involve finding the node by id and updating its position
			break;
		case 'dragEnded':
			// Optional: Implement logic for when dragging ends, such as unfreezing the node
			break;
		default:
			console.error('Unknown message type:', type);
	}
};
