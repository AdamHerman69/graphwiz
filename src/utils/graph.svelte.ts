import Graph, { DirectedGraph, UndirectedGraph } from 'graphology';
import { parse } from 'graphology-graphml';
import { density, diameter } from 'graphology-metrics/graph';
import hasCycle from 'graphology-dag/has-cycle';
import isBipartiteBy from 'graphology-bipartite/is-bipartite-by';
//import { unbindAttributes } from './graphSettings.svelte';
import { sortGuidelines, type Task, tasks } from './guideline.svelte';
import { bfs } from 'graphology-traversal';
import { graph } from 'graphology-metrics';
import { clusters } from 'graphology-generators/random';

export type Attribute = {
	name: string;
	type: 'number' | 'string';
	owner: 'edge' | 'node';
	general: boolean; // degree, inDegree, outDegree, id are general attributes
	values?: number[] | string[];
};

export type RangeAttribute = Attribute & {
	range: [number, number];
	values: number[];
};

export type StringAttribute = Attribute & {
	values: string[];
};

export function areAttributesEqual(
	attr1: Attribute | undefined,
	attr2: Attribute | undefined
): boolean {
	if (attr1 === undefined && attr2 === undefined) {
		return true;
	}
	if (attr1 === undefined || attr2 === undefined) {
		return false;
	}
	return (
		attr1.name === attr2.name &&
		attr1.type === attr2.type &&
		attr1.owner === attr2.owner &&
		attr1.general === attr2.general
	);
}

const generalAttributes: Attribute[] = [
	{ name: 'degree', type: 'number', owner: 'node', general: true },
	{ name: 'inDegree', type: 'number', owner: 'node', general: true },
	{ name: 'outDegree', type: 'number', owner: 'node', general: true },
	{ name: 'id', type: 'string', owner: 'node', general: true }
];
// export const graphProperties = ['degree, inDegree, outDegree', 'id'] as const;
// export type GraphProperty = (typeof graphProperties)[number];

export function getAttributeValue(id: string, attribute: Attribute): number | string {
	if (attribute.owner === 'node') {
		switch (attribute.name) {
			case 'degree':
				return graphObject.degree(id);
			case 'inDegree':
				return graphObject.inDegree(id);
			case 'outDegree':
				return graphObject.outDegree(id);
			case 'id':
				return id;
			default:
				try {
					return graphObject.getNodeAttribute(id, attribute.name);
				} catch (e) {
					throw new Error('Property not found');
				}
		}
	} else {
		switch (attribute.name) {
			case 'test':
				return 4;
			default:
				try {
					return graphObject.getEdgeAttribute(id, attribute.name);
				} catch (e) {
					throw new Error('Property not found');
				}
		}
	}
}

export function computeAttributeRange(graph: Graph, attribute: RangeAttribute): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	graph.forEachNode((id) => {
		let value = getAttributeValue(id, attribute) as number;
		if (value < min) min = value;
		if (value > max) max = value;
	});
	return [min, max];
}

// TODO refactor into a file and import
let graphObject: Graph = $state(new DirectedGraph());
// export let graph = $state(graphObject);
export function getGraph(): Graph {
	return graphObject;
}

// debounce
const DEBOUNCE_GRAPH_SIZE = 2500; // nodes + edges
const ANIMATE_GRAPH_SIZE = 400; // nodes + edges

let performanceOptimizations = $derived({
	shouldDebouce: graphObject.order + graphObject.size > DEBOUNCE_GRAPH_SIZE,
	shouldAnimate: graphObject.order + graphObject.size < ANIMATE_GRAPH_SIZE
});

export function performance() {
	return performanceOptimizations;
}

export function loadSampleGraph(): Graph {
	graphObject.addNode('a', { volume: 40, neco: 'nejakej string' });
	graphObject.addNode('b', { volume: 25 });
	graphObject.addNode('c', { volume: 80 });
	graphObject.addNode('d', { volume: 35 });
	graphObject.addNode('e', { volume: 41, neco: 'random string' });
	graphObject.addNode('f', { volume: 40, neco: 55 });
	graphObject.addNode('g', { volume: 27 });
	graphObject.addNode('h', { volume: 65 });
	graphObject.addNode('i', { volume: 58, kk: 2 });
	graphObject.addNode('j', { volume: 32, neco: 3 });
	graphObject.addEdge('a', 'b', { speed: 1010 });
	graphObject.addEdge('a', 'c', { speed: 250 });
	graphObject.addEdge('a', 'd', { speed: 555 });
	graphObject.addEdge('a', 'e', { speed: 666 });
	graphObject.addEdge('b', 'c', { speed: 100 });
	graphObject.addEdge('g', 'c', { speed: 889 });
	graphObject.addEdge('f', 'd', { speed: 1000 });
	graphObject.addEdge('d', 'c', { speed: 666 });
	graphObject.addEdge('e', 'f', { speed: 370 });
	graphObject.addEdge('e', 'g', { speed: 552 });
	graphObject.addEdge('h', 'c', { speed: 345 });
	graphObject.addEdge('i', 'd', { speed: 958 });
	graphObject.addEdge('j', 'c', { speed: 399 });
	graphObject.addEdge('h', 'i', { speed: 1005 });
	graphObject.addEdge('j', 'i', { speed: 396 });

	return graphObject;
}

export function computeAttributes(graph: Graph) {
	availableAttributes.length = 0;
	availableAttributes.push(...findAllNodeAttributes(graph));
	availableAttributes.push(...findAllEdgeAttributes(graph));
	// TODO: recompute ranges on general attributes
	availableAttributes.push(...computeRanges(graphObject, generalAttributes));
}

// Finding attributes
export let availableAttributes: Attribute[] = $state([]);

function findAllNodeAttributes(graph: Graph): Attribute[] {
	let foundNodeAttributes: Map<string, any[]> = new Map<string, any[]>();
	graph.forEachNode((id, attributes) => {
		for (const [key, value] of Object.entries(attributes)) {
			if (!foundNodeAttributes.get(key)?.push(value)) {
				foundNodeAttributes.set(key, [value]);
			}
		}
	});
	return classifyAttributes(foundNodeAttributes, 'node');
}

function findAllAttributeValues(graph: Graph, attribute: Attribute): any[] {
	let values: any[] = [];
	graph.forEachNode((id) => {
		try {
			values.push(getAttributeValue(id, attribute));
		} catch (e) {
			// do nothing
			console.warn("Couldn't find attribute value for node: ", id, ' attribute: ', attribute.name);
		}
	});
	return values;
}

function computeRanges(graph: Graph, attributes: Attribute[]): Attribute[] {
	attributes.forEach((attribute) => {
		if (attribute.type === 'number') {
			let range = computeAttributeRange(graph, attribute as RangeAttribute);
			(attribute as RangeAttribute).range = range;
		}
	});
	return attributes;
}

function findAllEdgeAttributes(graph: Graph): Attribute[] {
	let foundEdgeAttributes: Map<string, any[]> = new Map<string, any[]>();
	graph.forEachEdge((id, attributes) => {
		for (const [key, value] of Object.entries(attributes)) {
			if (!foundEdgeAttributes.get(key)?.push(value)) {
				foundEdgeAttributes.set(key, [value]);
			}
		}
	});
	return classifyAttributes(foundEdgeAttributes, 'edge');
}

function classifyAttribute(
	name: string,
	values: any[],
	owner: 'node' | 'edge',
	general = false
): RangeAttribute | StringAttribute {
	// Remove duplicates
	values = [...new Set(values)];

	const minValue = Math.min(...values);

	if (isNaN(minValue)) {
		return {
			name: name,
			values: values,
			type: 'string',
			owner: owner,
			general: general
		} as StringAttribute;
	} else {
		const maxValue = Math.max(...values);

		return {
			name: name,
			range: [minValue, maxValue],
			type: 'number',
			owner: owner,
			general: general,
			values: values
		} as RangeAttribute;
	}
}

function classifyAttributes(attributeMap: Map<string, any[]>, owner: 'node' | 'edge'): Attribute[] {
	let attributes: Attribute[] = [];
	attributeMap.forEach((values, name) => {
		attributes.push(classifyAttribute(name, values, owner));
	});
	return attributes;
}

// todo not sure if needed
// export function getAttributeType(attribute: RangeAttribute | StringAttribute): 'number' | 'string' {
// 	if (attribute.hasOwnProperty('range')) return 'number';
// 	else return 'string';
// }

// import/export

export function isValidGraph(object: any): boolean {
	// todo implement
	return true;
}

// unbind attributes
export const onGraphImport: ((graph: Graph) => void)[] = [
	computeAttributes,
	recomputeCharacteristics
];

function onGraphImportRun(graph: Graph) {
	onGraphImport.forEach((func) => func(graph));
}

export function importGraphJSON(newGraphObject: object): void {
	//unbindAttributes();

	let newGraph = new Graph();
	newGraph.import(newGraphObject);
	onGraphImportRun(newGraph);
	graphObject = newGraph;

	// todo clear history
}

export function importGraphOther(graphString: string): void {
	//unbindAttributes();

	graphObject = parse(Graph, graphString);
	onGraphImportRun(graphObject);
	// todo unbind attributes
	// recompute attributes
	// clear history
	console.log('imported graph');
}

export function generateGraph(
	order: number,
	size: number,
	clusterCount: number,
	clusterDensity = 0.8
) {
	graphObject = clusters(Graph, {
		order: order,
		size: size,
		clusters: clusterCount,
		clusterDensity: clusterDensity
	});
	onGraphImportRun(graphObject);
}

export function exportGraph(): object {
	return graphObject.export();
}

export function getEdgeSource(edge: string): string {
	return graphObject.source(edge);
}

export function getEdgeTarget(edge: string): string {
	return graphObject.target(edge);
}

////// Guidelines

export type CharacteristicType = 'boolean' | 'number' | 'string' | 'numberArray' | 'objectMap';

export type CharacteristicValue = boolean | number | string | number[] | { [key: string]: number };

export type Characteristic<T extends CharacteristicValue> = {
	type: CharacteristicType;
	value?: T;
	getter: (graph: Graph) => T;
};

// more here: https://graphology.github.io/standard-library/metrics.html#extent
export const graphCharacteristics: { [key: string]: Characteristic<CharacteristicValue> } = $state({
	type: {
		// 'directed' | 'mixed' | 'undirected'
		type: 'string',
		getter: (graph: Graph) => {
			return graph.type;
		}
	},
	nodeCount: {
		type: 'number',
		getter: (graph: Graph) => graph.order
	},
	edgeCount: {
		type: 'number',
		getter: (graph: Graph) => graph.size
	},
	density: {
		type: 'number',
		getter: (graph: Graph) => {
			return density(graph);
		}
	},
	diameter: {
		type: 'number',
		getter: (graph: Graph) => {
			return diameter(graph);
		}
	},
	averageDegree: {
		type: 'number',
		getter: (graph: Graph) => {
			return graph.size / graph.order;
		}
	},
	isDAG: {
		type: 'boolean',
		getter: (graph: Graph) => {
			hasCycle(graph);
			return false;
		}
	},
	task: {
		type: 'string',
		getter: (graph: Graph) => {
			return tasks.selectedTask;
		}
	},
	isBipartite: {
		type: 'boolean',
		getter: (graph: Graph) => {
			return isBipartiteCheck(graph);
		}
	},
	discreteAttributes: {
		type: 'number',
		getter: (graph: Graph) => {
			return findDiscreteAttributes(graph).length ?? 0;
		}
	}
});

export function recomputeCharacteristics(graph: Graph) {
	console.log('recomputing characteristics');
	for (const [key, characteristic] of Object.entries(graphCharacteristics)) {
		console.log('recomputing', key);
		characteristic.value = characteristic.getter(graph);
	}
	console.log('recomputed characteristics');
}

function isBipartiteCheck(graph: Graph) {
	const colors = new Map();
	let isBipartite = true;

	bfs(graph, (node) => {
		if (!colors.has(node)) {
			colors.set(node, 0);
		}

		const nodeColor = colors.get(node);

		graph.forEachNeighbor(node, (neighbor) => {
			if (!colors.has(neighbor)) {
				colors.set(neighbor, 1 - nodeColor);
			} else if (colors.get(neighbor) === nodeColor) {
				isBipartite = false;
				return true; // Stop the traversal
			}
		});

		console.log('returning bipartite: ', isBipartite);

		return !isBipartite; // Stop if not bipartite
	});

	console.log('returning bipartite: ', isBipartite);
	return isBipartite;
}

export function findDiscreteAttributes(graph: Graph, maxDistinctValues = 10): Attribute[] {
	return availableAttributes.filter(discreteAttributeFilter) as Attribute[];
}

const maxDistinctValues = 10;
export function discreteAttributeFilter(attribute: Attribute): boolean {
	return attribute.values?.length <= maxDistinctValues;
}

export function generateRandomTree(order = 100): Graph {
	if (order < 1) {
		throw new Error('Order must be at least 1');
	}

	// Create a new undirected graph
	const graph = new UndirectedGraph();

	// Add the first node (root)
	graph.addNode(0);

	// Add the rest of the nodes, ensuring the tree structure
	for (let i = 1; i < order; i++) {
		// Add a new node
		graph.addNode(i);

		// Connect the new node to a random existing node, ensuring it remains a tree
		const randomParent = Math.floor(Math.random() * i); // Random node from the already added nodes
		graph.addEdge(i, randomParent);
	}

	graphObject = graph;
	onGraphImportRun(graphObject);

	return graph;
}
