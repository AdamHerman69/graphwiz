import Paper from 'paper';
import { PNode } from './Node';
import type { IPNode } from './Node';
import { PEdge } from './Edge';
import type { IPEdge } from './Edge';
import * as d3 from 'd3';
import type { NodeStyle, EdgeStyle, EdgeLayoutType } from '../utils/graphSettings.svelte';
import { type Decorator, TriangleDecorator } from './Triangle';

export type NodePositionDatum = {
	id: string;
	x: number;
	y: number;
};

export type EdgeDatum = {
	id: string;
	source: string;
	target: string;
};

export interface Renderer {
	updatePositions(
		positions: NodePositionDatum[],
		edgeBendPoints?: Map<string, { x: number; y: number }[]>
	): void;
	updateNodeStyles(styles: Map<string, NodeStyle>): void;
	updateEdgeStyles(styles: Map<string, EdgeStyle>): void;
	updateNodeStyle(id: string, style: NodeStyle): void;
	updateEdgeStyle(id: string, style: EdgeStyle): void;
	updateEdgeLayout(
		edgeLayout: EdgeLayoutType,
		bendPoints?: Map<string, { x: number; y: number }[]>
	): void;
	restart(
		inputNodes: NodePositionDatum[],
		inputEdges: EdgeDatum[],
		nodeStyles: Map<string, NodeStyle>,
		edgeStyles: Map<string, EdgeStyle>,
		edgeLayout: EdgeLayoutType,
		canvas?: HTMLCanvasElement
	): void;
	zoomed(zoomEvent: d3.ZoomBehavior<HTMLCanvasElement, any>): d3.ZoomTransform;
	exportSVG(): string;
	resize(width: number, height: number): void;
	resetZoom(): void;
}

export class PaperRenderer implements Renderer {
	nodes: Map<string, IPNode>;
	edges: Map<string, IPEdge>;
	paperScope: paper.PaperScope;
	transform: d3.ZoomTransform;

	constructor(
		canvas: HTMLCanvasElement,
		inputNodes: NodePositionDatum[],
		inputEdges: EdgeDatum[],
		nodeStyles: Map<string, NodeStyle>,
		edgeStyles: Map<string, EdgeStyle>,
		edgeLayout: EdgeLayoutType
	) {
		this.paperScope = new Paper.PaperScope();
		this.paperScope.setup(canvas);
		this.nodes = new Map<string, IPNode>();
		this.edges = new Map<string, PEdge>();
		this.transform = d3.zoomIdentity;

		this.initGraph(inputNodes, inputEdges, nodeStyles, edgeStyles, edgeLayout);

		this.updateNodeStyles(nodeStyles);
		this.updateEdgeStyles(edgeStyles, edgeLayout);
	}

	updatePositions(
		positions: NodePositionDatum[],
		bendPoints?: Map<string, { x: number; y: number }[]>
	) {
		this.paperScope.activate();
		positions.forEach((pos) => {
			this.nodes.get(pos.id)?.updatePosition(pos.x, pos.y);
		});
		this.edges.forEach((edge) => edge.updatePosition());
	}

	updateNodeStyles(styles: Map<string, NodeStyle>) {
		this.paperScope.activate();
		this.nodes.forEach((node, key) => {
			if (!styles.get(key)) console.warn('style not found', key);
			node.updateStyle(styles.get(key)!);
		});

		// if node changes size TODO check
		this.edges.forEach((edge) => edge.updatePosition());
	}

	updateNodeStyle(id: string, style: NodeStyle) {
		this.paperScope.activate();
		this.nodes.get(id)?.updateStyle(style);
	}

	updateEdgeStyles(styles: Map<string, EdgeStyle>) {
		console.log('updateEdgeStyles');
		this.paperScope.activate();
		this.edges.forEach((edge, key) => edge.updateStyle(styles.get(key)!));
	}

	updateEdgeStyle(id: string, style: EdgeStyle) {
		this.paperScope.activate();
		this.edges.get(id)?.updateStyle(style);
	}

	updateEdgeLayout(
		edgeLayout: EdgeLayoutType,
		bendPoints?: Map<string, { x: number; y: number }[]>
	) {
		this.paperScope.activate();
		this.edges.forEach((edge) => edge.updateLayout(edgeLayout, bendPoints?.get(edge.id)));
	}

	restart(
		inputNodes: NodePositionDatum[],
		inputEdges: EdgeDatum[],
		nodeStyles: Map<string, NodeStyle>,
		edgeStyles: Map<string, EdgeStyle>,
		edgeLayout: EdgeLayoutType,
		canvas?: HTMLCanvasElement
	) {
		// todo if canvas is provided fucks things up!
		if (canvas) {
			this.paperScope = new Paper.PaperScope();
			this.paperScope.setup(canvas);
		} else {
			this.paperScope.activate();
			this.paperScope.project.clear();
		}

		this.nodes = new Map<string, IPNode>();
		this.edges = new Map<string, PEdge>();

		this.initGraph(inputNodes, inputEdges, nodeStyles, edgeStyles, edgeLayout);
	}

	initGraph(
		inputNodes: NodePositionDatum[],
		inputEdges: EdgeDatum[],
		nodeStyles: Map<string, NodeStyle>,
		edgeStyles: Map<string, EdgeStyle>,
		edgeLayout: EdgeLayoutType
	): void {
		this.paperScope.activate();

		console.log('initGraph', inputNodes, inputEdges, nodeStyles, edgeStyles, edgeLayout);

		inputNodes.forEach((node, key) => {
			const paperNode = new PNode(node.id, node.x, node.y, nodeStyles.get(node.id)!);
			this.nodes.set(node.id, paperNode);
		});

		inputEdges.forEach((edge) => {
			const source = this.nodes.get(edge.source);
			const target = this.nodes.get(edge.target);

			if (source && target) {
				const paperEdge = new PEdge(edge.id, source, target, edgeStyles.get(edge.id)!, edgeLayout);
				this.edges.set(edge.id, paperEdge);
			}
		});
	}

	zoomed(zoomEvent: d3.ZoomBehavior<HTMLCanvasElement, any>): d3.ZoomTransform {
		this.paperScope.activate();
		let transform = zoomEvent.transform as any;
		const { x, y, k } = transform;

		// Apply zoom first
		this.paperScope.view.zoom = k;

		const canvasCenter = new Paper.Point(
			this.paperScope.view.bounds.width / 2,
			this.paperScope.view.bounds.height / 2
		);

		// Adjust the calculation of the new center to account for the new zoom level
		const newCenter = new this.paperScope.Point(
			canvasCenter.x - x / this.paperScope.view.zoom,
			canvasCenter.y - y / this.paperScope.view.zoom
		);

		// Apply pan
		this.paperScope.view.center = newCenter;

		return transform;
	}

	resetZoom(): void {
		this.paperScope.activate();

		// Reset zoom to default (1)
		this.paperScope.view.zoom = 1;

		// Reset the center of the view to the original center of the canvas
		const originalCenter = new this.paperScope.Point(
			this.paperScope.view.bounds.width / 2,
			this.paperScope.view.bounds.height / 2
		);

		this.paperScope.view.center = originalCenter;
	}

	exportSVG() {
		return this.paperScope.project.exportSVG({ asString: true }) as string;
	}

	resize(width: number, height: number): void {
		this.paperScope.activate();
		this.paperScope.view.viewSize.width = width;
		this.paperScope.view.viewSize.height = height;
	}
}
