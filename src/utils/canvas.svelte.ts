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
import { orthogonalBendPoints, bundledBendPoints } from './graphSettings.svelte';
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
	updateEdgeStyles(edgeStyles: EdgeStyles): void;
	initialize(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph): void;
	graphChange(layout: LayoutSettings, nodeStyles: NodeStyles, edgeStyles: EdgeStyles): void;

	detectHover(event: MouseEvent): void;
	canvasClicked(event: MouseEvent): void;
	exportSVG(): string;
	changeLayout(layout: LayoutSettings): Promise<void>;
	resize(width: number, height: number): void;
	resetTransform(): void;
	changeTransform(transform: d3.ZoomTransform): void;
	tweenTransform(transform: d3.ZoomTransform, duration?: number): void;

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

	disablePanZoom: boolean = false;

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
		if (true) {
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
		} else {
			d3.select(this.canvas).call(
				d3
					.drag<HTMLCanvasElement, unknown>()
					.container(this.canvas as d3.DragContainerElement)
					.subject(this.getD3NodeRegardlessCanvas)
					.on('start', this.dragStarted)
					.on('drag', this.dragged)
					.on('end', this.dragEnded)
			);
		}
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

	updateEdgeStyles(edgeStyles: EdgeStyles): void {
		this.paperRenderer.updateEdgeStyles(edgeStyles);
		this.edgeStyles = edgeStyles;
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

		orthogonalBendPoints.forEach((bendPoints, linkId) => {
			bendPoints.forEach((point) => {
				point.x += dx;
				point.y += dy;
			});
		});

		bundledBendPoints.forEach((bendPoints, linkId) => {
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

	// async updateEdgeStyles(edgeStyles: EdgeStyles, layout: LayoutSettings): Promise<void> {
	// 	console.log('updateEdgeStyles hehee', $state.snapshot(layout));
	// 	if (this.edgeLayout != layout.edgeType.value && layout.edgeType.value === 'bundled') {
	// 		layout.edgeType.loading = true;
	// 		try {
	// 			if (this.currentLayout === 'force-graph') {
	// 				this.pauseSimulation();
	// 			}
	// 			await this.bundleEdgesAsync(edgeStyles);
	// 		} catch (error) {
	// 			console.error('Error during edge bundling:', error);
	// 		} finally {
	// 			layout.edgeType.loading = false;
	// 		}
	// 	}

	// 	if (
	// 		this.currentLayout === 'force-graph' &&
	// 		this.edgeLayout === 'bundled' &&
	// 		layout.edgeType.value !== 'bundled'
	// 	) {
	// 		this.resumeSimulation();
	// 	}

	// 	this.paperRenderer.updateEdgeStyles(edgeStyles, layout.edgeType.value);
	// 	this.edgeStyles = edgeStyles;
	// 	this.edgeLayout = layout.edgeType.value;
	// }

	async changeLayout(layout: LayoutSettings, forceRestart: boolean = false) {
		console.log('changeLayout', layout.type.value, layout.edgeType.value);
		let layoutChanged = forceRestart || this.currentLayout !== layout.type.value;
		let edgeLayoutChanged = this.edgeLayout !== layout.edgeType.value;

		console.log(
			'layoutChanged',
			layoutChanged,
			edgeLayoutChanged,
			forceRestart,
			this.currentLayout,
			layout.type.value
		);

		// D3 Force

		if (layoutChanged) {
			if (layout.type.value === 'force-graph') {
				this.startForceSimulation(forceRestart);
				this.currentLayout = layout.type.value;
				this.edgeLayout = layout.edgeType.value;

				if (layout.edgeType.value === 'bundled')
					setTimeout(async () => {
						try {
							layout.edgeType.loading = true;
							if (this.currentLayout === 'force-graph') {
								this.pauseSimulation();
							}
							console.log('bundleEdgesAsync');
							await this.bundleEdgesAsync();
							this.paperRenderer.updateEdgeLayout(layout.edgeType.value, bundledBendPoints);
							layout.edgeType.loading = false;
						} catch (error) {
							console.error('Error during edge bundling:', error);
						}
					}, 2000);
				return;
			}
			if (this.currentLayout === 'force-graph') {
				if (forceRestart) this.simulationWorker.postMessage({ type: 'pause' });
				this.simulationWorker.postMessage({ type: 'pause' });
			}
		}

		console.log('edgeLayoutChanged:', edgeLayoutChanged);
		if (edgeLayoutChanged) {
			layout.edgeType.loading = true;
		}

		if (edgeLayoutChanged && layout.edgeType.value === 'bundled') {
			try {
				if (this.currentLayout === 'force-graph') {
					this.pauseSimulation();
				}
				console.log('bundleEdgesAsync');
				await this.bundleEdgesAsync();
			} catch (error) {
				console.error('Error during edge bundling:', error);
			}
		}

		if (
			this.currentLayout === 'force-graph' &&
			this.edgeLayout === 'bundled' &&
			layout.edgeType.value !== 'bundled'
		) {
			this.resumeSimulation();
		}

		// Elk layout
		let computingElk = layoutChanged && layout.type.value !== 'force-graph';
		if (computingElk) {
			layout.type.loading = true;

			let elkNodes = await this.elkLayoutProvider.layout(
				{ 'elk.algorithm': layout.type.value, 'elk.edgeRouting': 'ORTHOGONAL' },
				this.width,
				this.height
			);

			layout.type.loading = false;

			this.staticPosition = true;
			this.sticky = true;

			this.d3nodes.forEach((node, index) => {
				node.x ??= this.width / 2;
				node.y ??= this.height / 2;
				let elkNode = elkNodes.find((n) => n.id === node.id);

				// todo decide animation on size of graph - performance wise - set all performance considerations in graph file
				if (elkNode) {
					if (performance().shouldAnimate) {
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
								if (layout.edgeType?.loading && layout.edgeType.value === 'orthogonal')
									this.paperRenderer.updateEdgeLayout(layout.edgeType.value, orthogonalBendPoints);
							}
						});
					} else {
						node.x = elkNode.x;
						node.y = elkNode.y;
						if (layout.edgeType.value === 'orthogonal') {
							this.paperRenderer.updateEdgeLayout(layout.edgeType.value, orthogonalBendPoints);
							layout.edgeType.loading = false;
						}
					}
				}
			});
			this.paperRenderer.updatePositions(this.d3nodes as NodePositionDatum[]);
		}

		if (edgeLayoutChanged && !computingElk) {
			console.log('updateEdgeLayout');
			let bendPoints =
				layout.edgeType.value === 'bundled' ? bundledBendPoints : orthogonalBendPoints;
			this.paperRenderer.updateEdgeLayout(layout.edgeType.value, bendPoints);
			layout.edgeType.loading = false;
		}
		this.edgeLayout = layout.edgeType.value;
		this.currentLayout = layout.type.value;
	}

	resetTransform(): void {
		// Use the smooth tweenTransform method to reset to identity
		this.tweenTransform(d3.zoomIdentity, 0.3);
	}

	changeTransform(transform: d3.ZoomTransform): void {
		this.transform = transform;
		d3.select(this.canvas).call(d3.zoom().transform, transform);
		// Create a synthetic zoom event object that matches what d3.zoom() would produce
		const event = {
			transform: transform,
			sourceEvent: null,
			target: this.canvas,
			type: 'zoom'
		};
		this.paperRenderer.zoomed(event as any);
	}

	/**
	 * Smoothly animates the transform to the target transform over the specified duration.
	 * @param transform - The target transform to animate to
	 * @param duration - Animation duration in seconds (default: 0.5)
	 */
	tweenTransform(transform: d3.ZoomTransform, duration?: number): void {
		console.log('tweenTransform');
		const animDuration = duration ?? 0.5;

		// If duration is 0 or very small, apply immediately (for performance)
		if (animDuration <= 0.05) {
			this.changeTransform(transform);
			return;
		}

		// Get current transform values
		const currentTransform = this.transform;
		const startX = currentTransform.x;
		const startY = currentTransform.y;
		const startK = currentTransform.k;

		const endX = transform.x;
		const endY = transform.y;
		const endK = transform.k;

		// Store reference to 'this' for use in the callback
		const self = this;

		// Animate the transform using GSAP
		gsap.to(
			{},
			{
				duration: animDuration,
				ease: 'power2.inOut',
				onUpdate: function () {
					// Get the progress from the tween
					const t = this.progress();

					// Interpolate between start and end values
					const interpolatedTransform = d3.zoomIdentity
						.translate(startX + (endX - startX) * t, startY + (endY - startY) * t)
						.scale(startK + (endK - startK) * t);

					// Apply the interpolated transform
					self.transform = interpolatedTransform;
					d3.select(self.canvas).call(d3.zoom().transform, interpolatedTransform);

					// Create a synthetic zoom event object
					const event = {
						transform: interpolatedTransform,
						sourceEvent: null,
						target: self.canvas,
						type: 'zoom'
					};
					self.paperRenderer.zoomed(event as any);
				}
			}
		);
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

	bundleEdges(nodes, links): void {
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
			bundledBendPoints.set(link.id, results[index]);
		});

		// edgeStyles.forEach((edgeStyle) => {
		// 	edgeStyle.bendPoints = edgeBendPoints.get(edgeStyle.id);
		// });
	}

	async bundleEdgesAsync(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.bundleEdgesWorker.onmessage = (event) => {
				const results = event.data;

				this.d3links.forEach((link, index) => {
					bundledBendPoints.set(link.id, results[index]);
				});

				// todo call updateEdgeStyles?

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
