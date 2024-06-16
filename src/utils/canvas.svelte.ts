import * as d3 from 'd3';
import type Graph from 'graphology';
import {
	nodeSettingsDefaults,
	type NodeStyle,
	type EdgeStyle,
	type NodeSettings,
	type EdgeSettings,
	graphSettings
} from './graphSettings.svelte';
import {
	type Renderer,
	type NodePositionDatum,
	type EdgeDatum,
	PaperRenderer
} from '../paperJS/PaperRenderer';

const CLICK_RADIUS = 10;

type D3Node = d3.SimulationNodeDatum & {
	id: string;
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
	nodeStyles: Map<string, NodeStyle>; // new Map<string, NodeStyle>()
	edgeStyles: Map<string, EdgeStyle>;

	sticky: boolean = false;
	staticPosition: boolean = false;

	constructor(canvas: HTMLCanvasElement, width: number, height: number, graph: Graph) {
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

		this.nodeStyles = new Map<string, NodeStyle>();
		graph.forEachNode((id: string) => {
			this.nodeStyles.set(id, getNodeStyle(id, graphSettings.nodeSettings)); // todo here's getNodeStyle
		});

		this.edgeStyles = new Map<string, EdgeStyle>();
		graph.forEachEdge((id) =>
			this.edgeStyles.set(id, getEdgeStyle(id, graphSettings.edgeSettings))
		);

		this.paperRenderer = new PaperRenderer(
			canvas,
			this.d3nodes as NodePositionDatum[],
			this.d3links as EdgeDatum[],
			this.nodeStyles,
			this.edgeStyles
		);
	}

	startForceSimulation(): void {
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
				// 	readability = greadability(d3nodes, d3links);
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
}

function getNodeStyle(id: string, nodeSettings: NodeSettings[]): NodeStyle {
	// todo actually implement
	let nodeStyle: NodeStyle = {
		// add random styles that fit the NodeStyle type
		size: 5,
		color: 'red',
		strokeWidth: 1,
		strokeColor: 'blue',
		labels: [],
		shadow: false
	};

	return nodeStyle;
}

function getEdgeStyle(id: string, edgeSettings: EdgeSettings[]): EdgeStyle {
	// todo actually implement
	let edgeStyle: EdgeStyle = {
		type: 'straight',
		width: 1,
		color: 'black',
		partialStart: 0,
		partialEnd: 0,
		decorators: [],
		labels: []
	};

	return edgeStyle;
}
