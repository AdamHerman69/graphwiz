import * as d3 from 'd3';
import type Graph from 'graphology';
import {
	nodeSettingsDefaults,
	type NodeStyles,
	type EdgeStyles,
	getNodeStyle
} from './graphSettings.svelte';
import {
	type Renderer,
	type NodePositionDatum,
	type EdgeDatum,
	PaperRenderer
} from '../paperJS/PaperRenderer';
import { greadability } from '$lib/greadability';
import Worker from './ForceSimulationWorker.ts?worker';

const CLICK_RADIUS = 10;

export type D3Node = d3.SimulationNodeDatum & {
	id: string;
};

export type ReadabilityMetrics = {
	crossing: number;
	crossingAngle: number;
	angularResolutionMin: number;
	angularResolutionDev: number;
};

export interface ICanvasHandler {
	startForceSimulation(nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void;
	updateNodeStyles(nodeStyles: NodeStyles): void;
	updateEdgeStyles(edgeStyles: EdgeStyles): void;
	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void;

	detectHover(event: MouseEvent): void;
	canvasClicked(event: MouseEvent): void;
	exportSVG(): string;

	selectedNode: D3Node | null;
	selectedNodePosition: { x: number; y: number } | null;
	sticky: boolean;
}

export class WebWorkerCanvasHandler implements ICanvasHandler {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;

	d3nodes: D3Node[] = $state([]);
	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
	transform: d3.ZoomTransform = $state(d3.zoomIdentity);
	simulationWorker: Worker;

	nodeStyles: NodeStyles;
	edgeStyles: EdgeStyles;

	paperRenderer: Renderer;

	sticky: boolean = $state(false);
	staticPosition: boolean = false;

	hoveredNodeKey: string | undefined = $state(undefined);
	selectedNode: D3Node | null = $state(null);
	selectedNodePosition: { x: number; y: number } | null = $derived.by(() => {
		if (this.selectedNode) {
			return {
				x: this.selectedNode.fx
					? this.transform.applyX(this.selectedNode.fx)
					: this.transform.applyX(this.selectedNode.x!),
				y: this.selectedNode.fy
					? this.transform.applyY(this.selectedNode.fy)
					: this.transform.applyY(this.selectedNode.y!)
			};
		}
		return null;
	});

	readability: ReadabilityMetrics | undefined = $state(undefined);

	lastTickTimestamp: number | undefined;

	constructor(canvas?: HTMLCanvasElement, width?: number, height?: number, graph?: Graph) {
		this.getD3Node = this.getD3Node.bind(this);
		this.dragStarted = this.dragStarted.bind(this);
		this.dragged = this.dragged.bind(this);
		this.dragEnded = this.dragEnded.bind(this);
		this.detectHover = this.detectHover.bind(this);
		this.canvasClicked = this.canvasClicked.bind(this);
		this.exportSVG = this.exportSVG.bind(this);

		if (canvas && width && height && graph) {
			this.initialize(canvas, width, height, graph);
		}
	}

	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void {
		this.canvas = canvas;
		this.width = width;
		this.height = height;

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

		this.simulationWorker = new Worker();
		this.simulationWorker.postMessage({
			type: 'startSimulation',
			nodes: $state.snapshot(this.d3nodes),
			links: this.d3links,
			width: this.width,
			height: this.height
		});

		this.simulationWorker.onmessage = (event) => {
			const { type, nodes } = event.data;
			if (type === 'tick') {
				this.paperRenderer.updatePositions(nodes as NodePositionDatum[]);
				this.d3nodes = nodes as D3Node[];
			} else if (type === 'log') {
				console.log('worker log:', event.data.message);
			}
		};

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
		this.nodeStyles = nodeStyles;
	}

	updateEdgeStyles(edgeStyles: EdgeStyles): void {
		this.paperRenderer.updateEdgeStyles(edgeStyles);
		this.edgeStyles = edgeStyles;
	}

	getD3Node(mouseEvent: MouseEvent) {
		const mouseX = this.transform.invertX(mouseEvent.x);
		const mouseY = this.transform.invertY(mouseEvent.y);

		let closestNode = null;
		let minDistanceSquared = CLICK_RADIUS * CLICK_RADIUS; // Use squared CLICK_RADIUS for comparison

		for (const node of this.d3nodes) {
			const dx = mouseX - node.x;
			const dy = mouseY - node.y;
			const distanceSquared = dx * dx + dy * dy; // No need for Math.sqrt

			if (distanceSquared < minDistanceSquared) {
				closestNode = node;
				minDistanceSquared = distanceSquared;
			}
		}

		return closestNode;
	}

	dragStarted(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		// sets the alpha target to a small value to restart the simulation
		if (!dragEvent.active)
			this.simulationWorker.postMessage({
				type: 'dragStarted'
			});
	}

	dragged(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;

		let rect = this.canvas.getBoundingClientRect();
		let x = dragEvent.sourceEvent.clientX - rect.left;
		let y = dragEvent.sourceEvent.clientY - rect.top;

		draggedNode.fx = this.transform.invertX(x);
		draggedNode.fy = this.transform.invertY(y);

		this.simulationWorker.postMessage({
			type: 'dragged',
			nodeId: draggedNode.id,
			position: { fx: draggedNode.fx, fy: draggedNode.fy }
		});
	}

	dragEnded(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;
		if (!dragEvent.active) {
			this.simulation?.alphaTarget(0);
		}

		// clear the fixed position
		if (!this.sticky && !this.staticPosition) {
			draggedNode.fx = null;
			draggedNode.fy = null;
		}

		this.simulationWorker.postMessage({
			type: 'dragEnded',
			nodeId: draggedNode.id,
			zeroAlphaTarget: !dragEvent.active,
			resetFixedPosition: !this.sticky && !this.staticPosition
		});
	}

	detectHover(event: MouseEvent) {
		let hoveredNode = this.getD3Node(event);
		this.handleHover(hoveredNode?.id);
	}

	handleHover(nodeKey: string | undefined) {
		if (this.hoveredNodeKey && this.hoveredNodeKey != nodeKey) {
			// cancel old shadow
			this.nodeStyles.get(this.hoveredNodeKey)!.shadow = false;
			this.paperRenderer.updateNodeStyle(
				this.hoveredNodeKey,
				this.nodeStyles.get(this.hoveredNodeKey)!
			);
		}

		if (nodeKey && this.hoveredNodeKey != nodeKey) {
			// apply shadow
			let nodeStyle = this.nodeStyles.get(nodeKey);
			nodeStyle!.shadow = true;
			this.paperRenderer.updateNodeStyle(nodeKey, nodeStyle!);
		}

		this.hoveredNodeKey = nodeKey;
	}

	canvasClicked(event: MouseEvent) {
		let clickedNode = this.getD3Node(event);
		if (clickedNode && this.selectedNode?.id != clickedNode.id) {
			this.selectedNode = clickedNode;
		} else {
			this.selectedNode = null;
		}
	}

	exportSVG(): string {
		return this.paperRenderer.exportSVG();
	}
}

export class CanvasHandler implements ICanvasHandler {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;

	d3nodes: D3Node[] = $state([]);
	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
	simulation: d3.Simulation<D3Node, d3.SimulationLinkDatum<D3Node>> | undefined;
	transform: d3.ZoomTransform = $state(d3.zoomIdentity);

	nodeStyles: NodeStyles;
	edgeStyles: EdgeStyles;

	paperRenderer: Renderer;

	sticky: boolean = $state(false);
	staticPosition: boolean = false;

	hoveredNodeKey: string | undefined = $state(undefined);
	selectedNode: D3Node | null = $state(null);
	selectedNodePosition: { x: number; y: number } | null = $derived.by(() => {
		if (this.selectedNode) {
			return {
				x: this.selectedNode.fx
					? this.transform.applyX(this.selectedNode.fx)
					: this.transform.applyX(this.selectedNode.x!),
				y: this.selectedNode.fy
					? this.transform.applyY(this.selectedNode.fy)
					: this.transform.applyY(this.selectedNode.y!)
			};
		}
		return null;
	});

	readability: ReadabilityMetrics | undefined = $state(undefined);

	lastTickTimestamp: number | undefined;

	constructor(canvas?: HTMLCanvasElement, width?: number, height?: number, graph?: Graph) {
		this.getD3Node = this.getD3Node.bind(this);
		this.dragStarted = this.dragStarted.bind(this);
		this.dragged = this.dragged.bind(this);
		this.dragEnded = this.dragEnded.bind(this);
		this.detectHover = this.detectHover.bind(this);
		this.canvasClicked = this.canvasClicked.bind(this);
		this.exportSVG = this.exportSVG.bind(this);

		if (canvas && width && height && graph) {
			this.initialize(canvas, width, height, graph);
		}
	}

	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void {
		this.canvas = canvas;
		this.width = width;
		this.height = height;
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
				// measure tick time
				const now = performance.now();

				if (this.lastTickTimestamp !== undefined) {
					const timeSinceLastTick = now - this.lastTickTimestamp;
					console.log(`Time since last tick: ${timeSinceLastTick} milliseconds`);
				}

				this.lastTickTimestamp = now;

				// const start = performance.now();
				this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]); // todo if simRunning?
				// const end = performance.now();
				// console.log('updatePositions took', end - start, 'ms');
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
		this.nodeStyles = nodeStyles;
	}

	updateEdgeStyles(edgeStyles: EdgeStyles): void {
		this.paperRenderer.updateEdgeStyles(edgeStyles);
		this.edgeStyles = edgeStyles;
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

	detectHover(event: MouseEvent) {
		let hoveredNode = this.getD3Node(event);
		this.handleHover(hoveredNode?.id);
	}

	handleHover(nodeKey: string | undefined) {
		if (this.hoveredNodeKey && this.hoveredNodeKey != nodeKey) {
			// cancel old shadow
			this.nodeStyles.get(this.hoveredNodeKey)!.shadow = false;
			this.paperRenderer.updateNodeStyle(
				this.hoveredNodeKey,
				this.nodeStyles.get(this.hoveredNodeKey)!
			);
		}

		if (nodeKey && this.hoveredNodeKey != nodeKey) {
			// apply shadow
			let nodeStyle = this.nodeStyles.get(nodeKey);
			nodeStyle!.shadow = true;
			this.paperRenderer.updateNodeStyle(nodeKey, nodeStyle!);
		}

		this.hoveredNodeKey = nodeKey;
	}

	canvasClicked(event: MouseEvent) {
		let clickedNode = this.getD3Node(event);
		if (clickedNode && this.selectedNode?.id != clickedNode.id) {
			this.selectedNode = clickedNode;
		} else {
			this.selectedNode = null;
		}
	}

	exportSVG(): string {
		return this.paperRenderer.exportSVG();
	}
}
