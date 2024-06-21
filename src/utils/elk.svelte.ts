import ElkWorker from 'elkjs/lib/elk-worker.min.js?worker';
import ELK, { type LayoutOptions, type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { type LayoutType } from './graphSettings.svelte';
import Graph from 'graphology';

export type NodePositions = { id: string; x: number; y: number }[];

export interface ILayoutProvieder {
	layout(options: object, width: number, height: number): Promise<NodePositions>;
}

export class ElkLayoutProvider implements ILayoutProvieder {
	elk;
	elkGraph: ElkNode;

	constructor(graph: Graph) {
		this.elk = new ELK({
			workerFactory: () => new ElkWorker()
		});

		this.elkGraph = {
			id: 'root',
			children: graph.mapNodes((node, attr) => {
				return { id: node, width: 30, height: 30 };
			}),
			edges: graph.mapEdges((edge, attr, source, target) => {
				return { id: edge, sources: [source], targets: [target] };
			})
		};
	}

	async layout(options: LayoutOptions, width: number, height: number): Promise<NodePositions> {
		this.elkGraph.layoutOptions = options;
		const elkData = await this.elk.layout(this.elkGraph).catch((e) => console.log(e));

		const centererdElkData = centerElkGraph(elkData, width, height);
		return centererdElkData.children as NodePositions;
	}
}

function centerElkGraph(elkData: ElkNode, width: number, height: number) {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	elkData.children?.forEach((elkNode: ElkNode) => {
		minX = Math.min(minX, elkNode.x!);
		maxX = Math.max(maxX, elkNode.x!);
		minY = Math.min(minY, elkNode.y!);
		maxY = Math.max(maxY, elkNode.y!);
	});

	let graphCenterX = (minX + maxX) / 2;
	let graphCenterY = (minY + maxY) / 2;

	let canvasCenterX = width / 2;
	let canvasCenterY = height / 2;

	let shiftX = canvasCenterX - graphCenterX;
	let shiftY = canvasCenterY - graphCenterY;

	elkData.children?.forEach((elkNode: ElkNode) => {
		elkNode.x = elkNode.x! + shiftX;
		elkNode.y = elkNode.y! + shiftY;
	});

	return elkData;
}
