import * as d3 from 'd3';
import type Graph from 'graphology';
import {
	nodeSettingsDefaults,
	type NodeStyles,
	type EdgeStyles,
	getNodeStyle,
	type LayoutType,
	type LayoutSettings
} from './graphSettings.svelte';
import {
	type Renderer,
	type NodePositionDatum,
	type EdgeDatum,
	PaperRenderer
} from '../paperJS/PaperRenderer';
import Worker from './forceSimulation.worker.ts?worker';
import ReadabilityWorker from '$lib/greadability/greadability.worker.ts?worker';
import BundleEdgesWorker from './bundleEdges.worker.ts?worker';
import { greadability } from '$lib/greadability/greadability';
import { type ILayoutProvieder, ElkLayoutProvider, type NodePositions } from './elk.svelte';
import { spring } from 'svelte/motion';
import gsap from 'gsap';
import { get } from 'svelte/store';
import { getEventCoords } from './helperFunctions';
import { edgeBendPoints } from './graphSettings.svelte';
import { forceEdgeBundling } from '$lib/d3-force-bundle';
import { edge } from 'graphology-metrics';
import type { EdgeLayoutType, EdgeType } from './graphSettings.svelte';
import { performance } from './graph.svelte';

export type D3Node = d3.SimulationNodeDatum & {
	id: string;
};

export type ReadabilityMetrics = {
	crossing: number;
	crossingAngle: number;
	angularResolutionMin: number;
	angularResolutionDev: number;
};

const CLICK_RADIUS = 10;

export interface ICanvasHandler {
	start(layout: LayoutSettings, nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void;
	updateNodeStyles(nodeStyles: NodeStyles): void;
	updateEdgeStyles(edgeStyles: EdgeStyles, layout: LayoutSettings): void;
	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void;
	graphChange(layout: LayoutSettings, nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void;

	detectHover(event: MouseEvent): void;
	canvasClicked(event: MouseEvent): void;
	exportSVG(): string;
	changeLayout(layout: LayoutSettings): Promise<void>;
	resize(width: number, height: number): void;
	resetTransform(): void;

	readablity?: ReadabilityMetrics | undefined;
	selectedNode: D3Node | null;
	selectedNodePosition: { x: number; y: number } | null;
	sticky: boolean;
	zoomed: boolean;
	started: boolean;
}

export class WebWorkerCanvasHandler implements ICanvasHandler {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;

	d3nodes: D3Node[] = $state([]);
	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
	transform: d3.ZoomTransform = $state(d3.zoomIdentity);
	simulationWorker: Worker;
	elkLayoutProvider: ILayoutProvieder;
	bundleEdgesWorker: BundleEdgesWorker;

	currentLayout: LayoutType;
	edgeLayout: EdgeLayoutType = $state('straight');
	nodeStyles: NodeStyles;
	edgeStyles: EdgeStyles;

	paperRenderer: Renderer;

	sticky: boolean = $state(false);
	staticPosition: boolean = $state(false);

	started: boolean = $state(false);

	//todo delete
	tickCounter = 0;

	hoveredNodeKey: string | undefined = $state(undefined);
	selectedNode: D3Node | null = $state(null);
	selectedNodePosition: { x: number; y: number } | null = $derived.by(() => {
		if (this.selectedNode) {
			console.log('updating position');
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
	readabilityWorker: ReadabilityWorker;
	computeNextReadability: boolean = false;

	zoomed: boolean = $derived(this.transform != d3.zoomIdentity);

	lastTickTimestamp: number | undefined;

	// todo change to edgeLayout
	draggable: boolean = $derived.by(() => {
		return this.edgeLayout !== 'bundled' && this.edgeLayout !== 'orthogonal';
	});

	// bundled: boolean = $derived.by(() => {
	// 	for (const edgeStyle of this.edgeStyles) {
	// 		if (edgeStyle[1].type === 'bundled') {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// });

	constructor(canvas?: HTMLCanvasElement, width?: number, height?: number, graph?: Graph) {
		this.getD3Node = this.getD3Node.bind(this);
		this.getD3NodeRegardlessCanvas = this.getD3NodeRegardlessCanvas.bind(this);
		this.dragStarted = this.dragStarted.bind(this);
		this.dragged = this.dragged.bind(this);
		this.dragEnded = this.dragEnded.bind(this);
		this.detectHover = this.detectHover.bind(this);
		this.canvasClicked = this.canvasClicked.bind(this);
		this.exportSVG = this.exportSVG.bind(this);
		this.resetTransform = this.resetTransform.bind(this);
		this.bundleEdgesAsync = this.bundleEdgesAsync.bind(this);

		this.bundleEdgesWorker = new BundleEdgesWorker();

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

		this.elkLayoutProvider = new ElkLayoutProvider(graph);
	}

	initReadabilityWorker() {
		this.readabilityWorker = new ReadabilityWorker();
		this.readabilityWorker.postMessage({
			nodes: $state.snapshot(this.d3nodes),
			links: this.d3links
		});
		this.readabilityWorker.onmessage = (event) => {
			const { type, readability, message } = event.data;
			if (type === 'readability') {
				this.readability = readability;
				this.computeNextReadability = true;
			} else if (type === 'log') {
				console.log('readability worker log:', message);
			}
		};
	}

	graphChange(layout: LayoutSettings, nodeStyles: NodeStyles, edgeStyles: EdgeStyles) {
		console.log(
			'canvas handler graph change',
			layout.type.value,
			layout.edgeType.value,
			nodeStyles,
			edgeStyles
		);
		this.nodeStyles = nodeStyles;
		this.edgeStyles = edgeStyles;

		this.paperRenderer.restart(
			this.d3nodes as NodePositionDatum[],
			this.d3links as EdgeDatum[],
			nodeStyles,
			edgeStyles,
			layout.edgeType.value
		);

		this.changeLayout(layout, true);
	}

	start(layout: LayoutSettings, nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void {
		console.log('staaaaart');
		this.nodeStyles = nodeStyles;
		this.edgeStyles = edgeStyles;

		// console.log('edgeLayout', edgeLayout.value);
		// console.log('edgeStyles', edgeStyles);
		// console.log('nodeStyles', nodeStyles);

		// renderer
		if (this.paperRenderer)
			this.paperRenderer.restart(
				this.d3nodes as NodePositionDatum[],
				this.d3links as EdgeDatum[],
				nodeStyles,
				edgeStyles,
				layout.edgeType.value,
				this.canvas
			);
		else
			this.paperRenderer = new PaperRenderer(
				this.canvas,
				this.d3nodes as NodePositionDatum[],
				this.d3links as EdgeDatum[],
				nodeStyles,
				edgeStyles,
				layout.edgeType.value
			);

		// drag and zoom
		d3.select(this.canvas)
			.call(
				d3
					.drag<HTMLCanvasElement, unknown>()
					.container(this.canvas as d3.DragContainerElement)
					.subject(this.getD3NodeRegardlessCanvas)
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
		this.changeLayout(layout);
		this.started = true;
	}

	startForceSimulation(forceRestart: boolean = false) {
		this.sticky = false;
		this.staticPosition = false;

		console.log('starting force simulation');
		if (!this.simulationWorker) {
			this.simulationWorker = new Worker();
			this.simulationWorker.postMessage({
				type: 'startSimulation',
				nodes: $state.snapshot(this.d3nodes),
				links: this.d3links,
				width: this.width,
				height: this.height
			});
		} else {
			if (forceRestart) {
				console.log('forcing newGraph simulation d3 nodes:', this.d3nodes);
				this.simulationWorker.postMessage({
					type: 'newGraph',
					nodes: $state.snapshot(this.d3nodes),
					links: this.d3links,
					width: this.width,
					height: this.height
				});
			} else {
				console.log('resuming simulation d3 nodes:', this.d3nodes);
				this.simulationWorker.postMessage({
					type: 'resume',
					nodes: $state.snapshot(this.d3nodes),
					links: this.d3links,
					width: this.width,
					height: this.height
				});
			}
		}

		this.simulationWorker.onmessage = (event) => {
			const { type, nodes, links, message } = event.data;
			if (type === 'tick') {
				// if (this.tickCounter % 100 === 0) {
				// 	this.bundleEdges(nodes, links);
				// 	this.tickCounter++;
				// } else {
				// 	this.tickCounter++;
				// }

				// console.log('worker tick');
				// console.log(nodes);
				this.paperRenderer.updatePositions(nodes as NodePositionDatum[]);
				this.d3nodes = nodes as D3Node[];
				if (links) this.d3links = links; // only there on first tick, needed by greadability
				if (!this.readabilityWorker) this.initReadabilityWorker();
				else if (this.computeNextReadability) {
					this.readabilityWorker.postMessage({
						nodes: $state.snapshot(this.d3nodes),
						links: this.d3links
					});
					this.computeNextReadability = false;
				}
			} else if (type === 'log') {
				console.log('worker log:', message);
			} else if (type === 'alphaZero') {
				console.log('alpha Zero');
				// if (this.bundled) {
				// 	this.bundleEdges(nodes, links);
				// 	// todo this doesn't work
				// 	this.updateEdgeStyles(this.edgeStyles);
				// }
			}
		};
	}

	updateNodeStyles(nodeStyles: NodeStyles): void {
		this.paperRenderer.updateNodeStyles(nodeStyles);
		this.nodeStyles = nodeStyles;
	}

	async updateEdgeStyles(edgeStyles: EdgeStyles, layout: LayoutSettings): Promise<void> {
		console.log('updateEdgeStyles hehee', $state.snapshot(layout));
		if (this.edgeLayout != layout.edgeType.value && layout.edgeType.value === 'bundled') {
			layout.edgeType.loading = true;
			try {
				if (this.currentLayout === 'force-graph') {
					this.pauseSimulation();
				}
				await this.bundleEdgesAsync(edgeStyles);
			} catch (error) {
				console.error('Error during edge bundling:', error);
			} finally {
				layout.edgeType.loading = false;
			}
		}

		if (
			this.currentLayout === 'force-graph' &&
			this.edgeLayout === 'bundled' &&
			layout.edgeType.value !== 'bundled'
		) {
			this.resumeSimulation();
		}

		this.paperRenderer.updateEdgeStyles(edgeStyles, layout.edgeType.value);
		this.edgeStyles = edgeStyles;
		this.edgeLayout = layout.edgeType.value;
	}

	getD3NodeRegardlessCanvas(mouseEvent: MouseEvent) {
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

	getD3Node(mouseEvent: MouseEvent) {
		const canvasRect = this.canvas.getBoundingClientRect();
		const mouseX = this.transform.invertX(mouseEvent.x - canvasRect.left);
		const mouseY = this.transform.invertY(mouseEvent.y - canvasRect.top);

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
		if (!this.draggable) return;
		if (this.currentLayout === 'force-graph') this.dragStartedWorker(dragEvent);
		else this.dragStartedLocal(dragEvent);
	}

	dragStartedWorker(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		// sets the alpha target to a small value to restart the simulation
		if (!dragEvent.active)
			this.simulationWorker.postMessage({
				type: 'dragStarted'
			});
	}

	dragStartedLocal(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		// sets the alpha target to a small value to restart the simulation
		// if (!dragEvent.active)
		// 	this.simulationWorker.postMessage({
		// 		type: 'dragStarted'
		// 	});
	}
	dragged(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		if (!this.draggable) return;

		if (this.currentLayout === 'force-graph') {
			this.draggedWorker(dragEvent);
		} else this.draggedLocal(dragEvent);
	}

	draggedWorker(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;

		let rect = this.canvas.getBoundingClientRect();

		let { x, y } = getEventCoords(dragEvent.sourceEvent);

		x = x - rect.left;
		y = y - rect.top;

		draggedNode.fx = this.transform.invertX(x);
		draggedNode.fy = this.transform.invertY(y);

		if (this.selectedNode?.id === draggedNode.id) {
			this.selectedNode = draggedNode;
			// to update the selectedNodePosition
		}

		this.simulationWorker.postMessage({
			type: 'dragged',
			nodeId: draggedNode.id,
			position: { fx: draggedNode.fx, fy: draggedNode.fy }
		});
	}

	draggedLocal(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;

		let rect = this.canvas.getBoundingClientRect();
		let { x, y } = getEventCoords(dragEvent.sourceEvent);
		x = x - rect.left;
		y = y - rect.top;

		draggedNode.x = this.transform.invertX(x);
		draggedNode.y = this.transform.invertY(y);

		this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]);
		// todo readability
	}

	dragEnded(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		if (!this.draggable) return;

		if (this.currentLayout === 'force-graph') this.dragEndedWorker(dragEvent);
		else this.dragEndedLocal(dragEvent);
	}

	dragEndedWorker(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		let draggedNode = dragEvent.subject;

		// clear the fixed position
		if (!this.sticky && !this.staticPosition) {
			console.log('drag ended non sticky');
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

	dragEndedLocal(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
		// we don't have to do anything here
	}

	detectHover(event: MouseEvent) {
		let hoveredNode = this.getD3Node(event);
		this.handleHover(hoveredNode?.id);
	}

	handleHover(nodeKey: string | undefined) {
		if (!nodeKey || !this.nodeStyles.get(nodeKey)) return;
		if (this.hoveredNodeKey && this.hoveredNodeKey != nodeKey) {
			// cancel old shadow

			if (this.nodeStyles.get(this.hoveredNodeKey))
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

	// on resize local nodes
	updateNodePositionsOnResize(
		currentWidth: number,
		currentHeight: number,
		width: number,
		height: number
	) {
		const dx = (width - currentWidth) / 2;
		const dy = (height - currentHeight) / 2;
		this.d3nodes.forEach((node) => {
			if (node.x !== undefined && node.y !== undefined) {
				node.x += dx;
				node.y += dy;
			}
		});

		edgeBendPoints.forEach((bendPoints, linkId) => {
			bendPoints.forEach((point) => {
				point.x += dx;
				point.y += dy;
			});
		});

		this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[], { x: dx, y: dy });
	}

	resize(width: number, height: number): void {
		// todo move all sticky points

		this.paperRenderer.resize(width, height);
		if (this.currentLayout != 'force-graph')
			this.updateNodePositionsOnResize(this.width, this.height, width, height);
		if (this.currentLayout === 'force-graph') {
		}
		this.simulationWorker.postMessage({ type: 'resize', width, height });

		this.width = width;
		this.height = height;
	}

	async changeLayout(layout: LayoutSettings, forceRestart: boolean = false) {
		if (!forceRestart && this.currentLayout === layout.type.value) {
			console.log('changeLayout: same layout');
			return;
		}

		if (layout.type.value === 'force-graph') {
			this.startForceSimulation(forceRestart);
			this.currentLayout = layout.type.value;
			this.edgeLayout = layout.edgeType.value;
			return;
		}
		if (this.currentLayout === 'force-graph') {
			if (forceRestart) this.simulationWorker.postMessage({ type: 'pause' });
			this.simulationWorker.postMessage({ type: 'pause' });
		}

		layout.type.loading = true;
		console.log('changeLayout', layout.type.loading);

		let elkNodes = await this.elkLayoutProvider.layout(
			{ 'elk.algorithm': layout.type.value, 'elk.edgeRouting': 'ORTHOGONAL' },
			this.width,
			this.height
		);

		layout.type.loading = false;
		console.log('changeLayout', layout.type.loading);

		this.staticPosition = true;
		this.sticky = true;

		this.d3nodes.forEach((node, index) => {
			node.x ??= this.width / 2;
			node.y ??= this.height / 2;
			let elkNode = elkNodes.find((n) => n.id === node.id);

			// todo decide animation on size of graph - performance wise - set all performance considerations in graph file
			if (elkNode) {
				if (performance().shouldAnimate) {
					console.log($state.snapshot(node));
					gsap.to(node, {
						duration: 1,
						x: elkNode.x,
						y: elkNode.y,
						ease: 'power2.inOut',
						onUpdate: () => {
							this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]);
						},
						onComplete: () => {
							delete node._gsap;
						}
					});
				} else {
					node.x = elkNode.x;
					node.y = elkNode.y;
				}
			}
		});
		this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]);

		this.currentLayout = layout.type.value;
		this.edgeLayout = layout.edgeType.value;
	}

	resetTransform(): void {
		// Reset the transform to the identity transform
		this.transform = d3.zoomIdentity;

		// Reset the zoom behavior
		d3.select(this.canvas).call(d3.zoom().transform, d3.zoomIdentity);

		// Reset the paper renderer's zoom and center
		this.paperRenderer.resetZoom();
	}

	pauseSimulation() {
		this.staticPosition = true;
		this.simulationWorker.postMessage({ type: 'pause' });
	}

	resumeSimulation() {
		this.staticPosition = false;
		this.simulationWorker.postMessage({
			type: 'resume',
			nodes: $state.snapshot(this.d3nodes),
			links: this.d3links,
			width: this.width,
			height: this.height
		});
	}

	bundleEdges(nodes, links, edgeStyles: EdgeStyles): void {
		let linksFormated = links.map((link) => {
			return {
				source: link.source.id,
				target: link.target.id
			};
		});

		// Create an instance of the ForceEdgeBundling function
		const fbundling = forceEdgeBundling();

		// Configure the bundling
		fbundling
			.nodes(nodes.reduce((acc, n) => ({ ...acc, [n.id]: n }), {}))
			.edges(linksFormated)
			.bundling_stiffness(0.1)
			.step_size(0.1)
			.iterations(100)
			.iterations_rate(0.7)
			.subdivision_points_seed(1)
			.subdivision_rate(2);

		// Run the bundling algorithm
		const results = fbundling();

		// console.log(results);

		links.forEach((link, index) => {
			edgeBendPoints.set(link.id, results[index]);
			edgeStyles.get(link.id)!.bendPoints = results[index];
		});

		// edgeStyles.forEach((edgeStyle) => {
		// 	edgeStyle.bendPoints = edgeBendPoints.get(edgeStyle.id);
		// });

		console.log(edgeBendPoints);
	}

	async bundleEdgesAsync(edgeStyles: EdgeStyles): Promise<void> {
		return new Promise((resolve, reject) => {
			this.bundleEdgesWorker.onmessage = (event) => {
				const results = event.data;

				this.d3links.forEach((link, index) => {
					edgeBendPoints.set(link.id, results[index]);
					edgeStyles.get(link.id)!.bendPoints = results[index];
				});

				this.paperRenderer.updateEdgeStyles(edgeStyles, 'bundled');

				resolve();
			};

			this.bundleEdgesWorker.onerror = (error) => {
				console.error('Edge bundling worker error:', error);
				reject(error);
			};

			this.bundleEdgesWorker.postMessage({
				nodes: $state.snapshot(this.d3nodes),
				links: $state.snapshot(this.d3links)
			});
		});
	}
}

// export class CanvasHandler implements ICanvasHandler {
// 	canvas: HTMLCanvasElement;
// 	width: number;
// 	height: number;

// 	d3nodes: D3Node[] = $state([]);
// 	d3links: (d3.SimulationLinkDatum<D3Node> & { id: string })[];
// 	simulation: d3.Simulation<D3Node, d3.SimulationLinkDatum<D3Node>> | undefined;
// 	transform: d3.ZoomTransform = $state(d3.zoomIdentity);

// 	nodeStyles: NodeStyles;
// 	edgeStyles: EdgeStyles;

// 	paperRenderer: Renderer;

// 	sticky: boolean = $state(false);
// 	staticPosition: boolean = false;

// 	hoveredNodeKey: string | undefined = $state(undefined);
// 	selectedNode: D3Node | null = $state(null);
// 	selectedNodePosition: { x: number; y: number } | null = $derived.by(() => {
// 		if (this.selectedNode) {
// 			return {
// 				x: this.selectedNode.fx
// 					? this.transform.applyX(this.selectedNode.fx)
// 					: this.transform.applyX(this.selectedNode.x!),
// 				y: this.selectedNode.fy
// 					? this.transform.applyY(this.selectedNode.fy)
// 					: this.transform.applyY(this.selectedNode.y!)
// 			};
// 		}
// 		return null;
// 	});

// 	readability: ReadabilityMetrics | undefined = $state(undefined);

// 	lastTickTimestamp: number | undefined;

// 	constructor(canvas?: HTMLCanvasElement, width?: number, height?: number, graph?: Graph) {
// 		this.getD3Node = this.getD3Node.bind(this);
// 		this.dragStarted = this.dragStarted.bind(this);
// 		this.dragged = this.dragged.bind(this);
// 		this.dragEnded = this.dragEnded.bind(this);
// 		this.detectHover = this.detectHover.bind(this);
// 		this.canvasClicked = this.canvasClicked.bind(this);
// 		this.exportSVG = this.exportSVG.bind(this);

// 		if (canvas && width && height && graph) {
// 			this.initialize(canvas, width, height, graph);
// 		}
// 	}

// 	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void {
// 		this.canvas = canvas;
// 		this.width = width;
// 		this.height = height;
// 		this.simulation = undefined;

// 		this.d3nodes = graph.mapNodes((node: string) => ({
// 			id: node,
// 			v: node,
// 			value: {
// 				width: nodeSettingsDefaults.size?.value,
// 				height: nodeSettingsDefaults.size?.value
// 			}
// 		}));
// 		this.d3links = graph.mapEdges(
// 			(edgeKey: string, edgeAttributes: object, source: string, target: string) => ({
// 				id: edgeKey,
// 				source: source,
// 				target: target,
// 				v: source,
// 				w: target
// 			})
// 		);
// 	}

// 	computeReadability() {
// 		this.readability = greadability(this.d3nodes, this.d3links);
// 	}

// 	startForceSimulation(nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void {
// 		this.nodeStyles = nodeStyles;
// 		this.edgeStyles = edgeStyles;
// 		if (this.paperRenderer)
// 			this.paperRenderer.restart(
// 				this.d3nodes as NodePositionDatum[],
// 				this.d3links as EdgeDatum[],
// 				nodeStyles,
// 				edgeStyles
// 			);
// 		else
// 			this.paperRenderer = new PaperRenderer(
// 				this.canvas,
// 				this.d3nodes as NodePositionDatum[],
// 				this.d3links as EdgeDatum[],
// 				nodeStyles,
// 				edgeStyles
// 			);

// 		// start d3-force
// 		this.simulation = d3
// 			.forceSimulation(this.d3nodes)
// 			.force(
// 				'link',
// 				d3.forceLink(this.d3links).id((d3node) => (d3node as D3Node).id)
// 			)
// 			.force('charge', d3.forceManyBody())
// 			.force('center', d3.forceCenter(this.width / 2, this.height / 2))
// 			.on('tick', () => {
// 				// measure tick time
// 				// const now = performance.now();

// 				// if (this.lastTickTimestamp !== undefined) {
// 				// 	const timeSinceLastTick = now - this.lastTickTimestamp;
// 				// 	console.log(`Time since last tick: ${timeSinceLastTick} milliseconds`);
// 				// }

// 				// this.lastTickTimestamp = now;

// 				// const start = performance.now();
// 				this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]); // todo if simRunning?
// 				// const end = performance.now();
// 				// console.log('updatePositions took', end - start, 'ms');
// 				// if (tickCount++ > 100) {
// 				// 	tickCount = 0;
// 				// }
// 				// updateSelectedNode();
// 			})
// 			.on('end', () => {
// 				// readability = greadability(d3nodes, d3links);
// 			});

// 		// styles should persist

// 		// drag and zoom
// 		d3.select(this.canvas)
// 			.call(
// 				d3
// 					.drag<HTMLCanvasElement, unknown>()
// 					.container(this.canvas as d3.DragContainerElement)
// 					.subject(this.getD3Node)
// 					.on('start', this.dragStarted)
// 					.on('drag', this.dragged)
// 					.on('end', this.dragEnded)
// 			)
// 			.call(
// 				d3
// 					.zoom<HTMLCanvasElement, unknown>()
// 					.scaleExtent([1 / 10, 8])
// 					.on('zoom', (zoomEvent) => {
// 						this.transform = this.paperRenderer.zoomed(zoomEvent);
// 					})
// 			);
// 	}

// 	updateNodeStyles(nodeStyles: NodeStyles): void {
// 		this.paperRenderer.updateNodeStyles(nodeStyles);
// 		this.nodeStyles = nodeStyles;
// 	}

// 	updateEdgeStyles(edgeStyles: EdgeStyles): void {
// 		this.paperRenderer.updateEdgeStyles(edgeStyles);
// 		this.edgeStyles = edgeStyles;
// 	}

// 	getD3Node(mouseEvent: MouseEvent) {
// 		const node = this.simulation?.find(
// 			this.transform.invertX(mouseEvent.x),
// 			this.transform.invertY(mouseEvent.y),
// 			CLICK_RADIUS
// 		);

// 		return node;
// 	}

// 	dragStarted(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
// 		if (!dragEvent.active) this.simulation?.alphaTarget(0.3).restart();
// 		let draggedNode = dragEvent.subject;

// 		// draggedNode.fx = transform.invertX(dragEvent.x!);
// 		// draggedNode.fy = transform.invertY(dragEvent.y!);
// 	}

// 	dragged(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
// 		let draggedNode = dragEvent.subject;

// 		let rect = this.canvas.getBoundingClientRect();
// 		let x = dragEvent.sourceEvent.clientX - rect.left;
// 		let y = dragEvent.sourceEvent.clientY - rect.top;

// 		draggedNode.fx = this.transform.invertX(x);
// 		draggedNode.fy = this.transform.invertY(y);
// 	}

// 	dragEnded(dragEvent: d3.D3DragEvent<SVGCircleElement, any, D3Node>) {
// 		let draggedNode = dragEvent.subject;
// 		if (!dragEvent.active) {
// 			this.simulation?.alphaTarget(0);
// 		}

// 		if (!this.sticky && !this.staticPosition) {
// 			draggedNode.fx = null;
// 			draggedNode.fy = null;
// 		}
// 	}

// 	detectHover(event: MouseEvent) {
// 		let hoveredNode = this.getD3Node(event);
// 		this.handleHover(hoveredNode?.id);
// 	}

// 	handleHover(nodeKey: string | undefined) {
// 		if (this.hoveredNodeKey && this.hoveredNodeKey != nodeKey) {
// 			// cancel old shadow
// 			this.nodeStyles.get(this.hoveredNodeKey)!.shadow = false;
// 			this.paperRenderer.updateNodeStyle(
// 				this.hoveredNodeKey,
// 				this.nodeStyles.get(this.hoveredNodeKey)!
// 			);
// 		}

// 		if (nodeKey && this.hoveredNodeKey != nodeKey) {
// 			// apply shadow
// 			let nodeStyle = this.nodeStyles.get(nodeKey);
// 			nodeStyle!.shadow = true;
// 			this.paperRenderer.updateNodeStyle(nodeKey, nodeStyle!);
// 		}

// 		this.hoveredNodeKey = nodeKey;
// 	}

// 	canvasClicked(event: MouseEvent) {
// 		let clickedNode = this.getD3Node(event);
// 		if (clickedNode && this.selectedNode?.id != clickedNode.id) {
// 			this.selectedNode = clickedNode;
// 		} else {
// 			this.selectedNode = null;
// 		}
// 	}

// 	exportSVG(): string {
// 		return this.paperRenderer.exportSVG();
// 	}
// }
