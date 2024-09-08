import type { D3Node } from './canvas.svelte';
import * as d3 from 'd3';

let simulation: d3.Simulation<D3Node, d3.SimulationLinkDatum<D3Node>>;
let d3nodes: D3Node[];
let d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
let simRunning = false;
let currentWidth: number;
let currentHeight: number;

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
	currentWidth = width;
	currentHeight = height;
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
				nodes: d3nodes,
				links: d3links
			});
		});
}

// Function to update node positions based on new center
function updateNodePositions(width: number, height: number) {
	const dx = (width - currentWidth) / 2;
	const dy = (height - currentHeight) / 2;
	d3nodes.forEach((node) => {
		if (node.x !== undefined && node.y !== undefined) {
			node.x += dx;
			node.y += dy;
		}
	});
	currentWidth = width;
	currentHeight = height;
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
	}: {
		type: string;
		nodes: D3Node[];
		links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
		width: number;
		height: number;
		nodeId: string;
		position: { fx: number; fy: number };
		zeroAlphaTarget: boolean;
		resetFixedPosition: boolean;
	} = event.data;
	switch (type) {
		case 'startSimulation':
			d3nodes = nodes;
			d3links = links;
			startSimulation(d3nodes, d3links, width, height);

			simRunning = true;
			break;

		case 'newGraph':
			log(currentWidth + ' ' + currentHeight);
			log(width + ' ' + height);

			simulation.stop();
			d3nodes = nodes;
			d3links = links;
			startSimulation(d3nodes, d3links, width, height);
			simRunning = true;
			break;
		case 'dragStarted':
			if (simRunning) {
				simulation.alphaTarget(0.3).restart();
			}
			break;
		case 'dragged':
			let draggedNode = d3nodes.find((node) => node.id === nodeId);
			if (draggedNode) {
				draggedNode.fx = position.fx;
				draggedNode.fy = position.fy;
			}
			// if we're paused the positions won't update on next tick
			if (!simRunning) {
				if (draggedNode) {
					draggedNode.x = position.fx;
					draggedNode.y = position.fy;
				}
				postMessage({
					type: 'tick',
					nodes: d3nodes,
					links: d3links
				});
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
		case 'pause':
			simulation.stop();
			simRunning = false;
			break;
		case 'changePositions':
			d3nodes = nodes;
			break;
		case 'resume':
			currentWidth = width;
			currentHeight = height;
			if (!simRunning) {
				simulation.nodes().forEach((simNode) => {
					simNode.x = nodes.find((node) => node.id === simNode.id)?.x;
					simNode.y = nodes.find((node) => node.id === simNode.id)?.y;
				});
				simulation.restart().alpha(0.5);
				simRunning = true;
			}
			break;
		case 'resize':
			updateNodePositions(width, height);
			if (simRunning) {
				simulation.force('center', d3.forceCenter(width / 2, height / 2));
				simulation.alpha(0.3).restart();
			}
			postMessage({
				type: 'tick',
				nodes: d3nodes,
				links: d3links
			});
			break;
		default:
			console.error('Unknown message type:', type);
	}
};
