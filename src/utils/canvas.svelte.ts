import * as d3 from 'd3';
import type Graph from 'graphology';
import { nodeSettingsDefaults, type NodeStyles, type EdgeStyles } from './graphSettings.svelte';
import {
	type Renderer,
	type NodePositionDatum,
	type EdgeDatum,
	PaperRenderer
} from '../paperJS/PaperRenderer';
import { greadability } from '$lib/greadability';

const CLICK_RADIUS = 10;

type D3Node = d3.SimulationNodeDatum & {
	id: string;
};

export type ReadabilityMetrics = {
	crossing: number;
	crossingAngle: number;
	angularResolutionMin: number;
	angularResolutionDev: number;
};

export class CanvasHandler {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;

	d3nodes: D3Node[];
	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
	simulation: d3.Simulation<D3Node, d3.SimulationLinkDatum<D3Node>> | undefined;
	transform: d3.ZoomTransform;

	paperRenderer: Renderer;

	sticky: boolean = $state(false);
	staticPosition: boolean = false;

	readability: ReadabilityMetrics | undefined = $state(undefined);

	constructor(canvas?: HTMLCanvasElement, width?: number, height?: number, graph?: Graph) {
		this.getD3Node = this.getD3Node.bind(this);
		this.dragStarted = this.dragStarted.bind(this);
		this.dragged = this.dragged.bind(this);
		this.dragEnded = this.dragEnded.bind(this);

		if (canvas && width && height && graph) {
			this.initialize(canvas, width, height, graph);
		}
	}

	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void {
		this.canvas = canvas;
		this.width = width;
		this.height = height;
		this.transform = d3.zoomIdentity;
		this.simulation = undefined;

		this.d3nodes = graph.mapNodes((node: string) => ({
			id: node,
			v: node,
			value: {
				width: nodeSettingsDefaults.size?.value,
				height: nodeSettingsDefaults.size?.value
			}
		}));
		this.d3links = graph.mapEdges(
			(edgeKey: string, edgeAttributes: object, source: string, target: string) => ({
				id: edgeKey,
				source: source,
				target: target,
				v: source,
				w: target
			})
		);
	}

	computeReadability() {
		this.readability = greadability(this.d3nodes, this.d3links);
	}

	startForceSimulation(nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void {
		this.paperRenderer = new PaperRenderer(
			this.canvas,
			this.d3nodes as NodePositionDatum[],
			this.d3links as EdgeDatum[],
			nodeStyles,
			edgeStyles
		);

		// start d3-force
		this.simulation = d3
			.forceSimulation(this.d3nodes)
			.force(
				'link',
				d3.forceLink(this.d3links).id((d3node) => (d3node as D3Node).id)
			)
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(this.width / 2, this.height / 2))
			.on('tick', () => {
				this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]); // todo if simRunning?
				// if (tickCount++ > 100) {
				// 	tickCount = 0;
				// }
				// updateSelectedNode();
			})
			.on('end', () => {
				// readability = greadability(d3nodes, d3links);
			});

		// styles should persist

		// drag and zoom
		d3.select(this.canvas)
			.call(
				d3
					.drag<HTMLCanvasElement, unknown>()
					.container(this.canvas as d3.DragContainerElement)
					.subject(this.getD3Node)
					.on('start', this.dragStarted)
					.on('drag', this.dragged)
					.on('end', this.dragEnded)
			)
			.call(
				d3
					.zoom<HTMLCanvasElement, unknown>()
					.scaleExtent([1 / 10, 8])
					.on('zoom', (zoomEvent) => {
						this.transform = this.paperRenderer.zoomed(zoomEvent);
					})
			);
	}

	updateNodeStyles(nodeStyles: NodeStyles): void {
		this.paperRenderer.updateNodeStyles(nodeStyles);
	}

	updateEdgeStyles(edgeStyles: EdgeStyles): void {
		this.paperRenderer.updateEdgeStyles(edgeStyles);
	}

	getD3Node(mouseEvent: MouseEvent) {
		const node = this.simulation?.find(
			this.transform.invertX(mouseEvent.x),
			this.transform.invertY(mouseEvent.y),
			CLICK_RADIUS
		);

		return node;
	}

	dragStarted(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		if (!dragEvent.active) this.simulation?.alphaTarget(0.3).restart();
		let draggedNode = dragEvent.subject;

		// draggedNode.fx = transform.invertX(dragEvent.x!);
		// draggedNode.fy = transform.invertY(dragEvent.y!);
	}

	dragged(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;

		let rect = this.canvas.getBoundingClientRect();
		let x = dragEvent.sourceEvent.clientX - rect.left;
		let y = dragEvent.sourceEvent.clientY - rect.top;

		draggedNode.fx = this.transform.invertX(x);
		draggedNode.fy = this.transform.invertY(y);
	}

	dragEnded(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;
		if (!dragEvent.active) {
			this.simulation?.alphaTarget(0);
		}

		if (!this.sticky && !this.staticPosition) {
			draggedNode.fx = null;
			draggedNode.fy = null;
		}
	}

	exportSVG(): string {
		return this.paperRenderer.exportSVG();
	}
}
