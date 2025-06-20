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
import { countConnectedComponents, stronglyConnectedComponents } from 'graphology-components';

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
	},
	edgeNumericAttribute: {
		type: 'boolean',
		getter: (graph: Graph) => {
			return availableAttributes.some((attr) => attr.owner === 'edge' && attr.type === 'number');
		}
	},
	nodeNumericAttribute: {
		type: 'boolean',
		getter: (graph: Graph) => {
			return availableAttributes.some((attr) => attr.owner === 'node' && attr.type === 'number');
		}
	},
	connectedComponents: {
		type: 'number',
		getter: (graph: Graph) => {
			return countConnectedComponents(graph);
		}
	},
	stronglyConnectedComponents: {
		type: 'number',
		getter: (graph: Graph) => {
			return stronglyConnectedComponents(graph).length;
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

const maxDistinctValues = 12;
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

export function loadCitationNetwork(): Graph {
	// Create a realistic academic citation network
	const papers = [
		// Core papers in graph visualization
		{
			id: 'p1',
			title: 'Force-Directed Graph Drawing Algorithms',
			authors: ['Eades P'],
			year: 1984,
			citations: 1200,
			area: 'graph-algorithms'
		},
		{
			id: 'p2',
			title: 'A Multi-Level Algorithm for Force-Directed Graph Drawing',
			authors: ['Walshaw C'],
			year: 2000,
			citations: 800,
			area: 'graph-algorithms'
		},
		{
			id: 'p3',
			title: 'Graph Drawing by Force-Directed Placement',
			authors: ['Fruchterman TMJ', 'Reingold EM'],
			year: 1991,
			citations: 1500,
			area: 'graph-algorithms'
		},
		{
			id: 'p4',
			title: 'Efficient and High Quality Force-Directed Graph Drawing',
			authors: ['Hachul S', 'Jünger M'],
			year: 2004,
			citations: 600,
			area: 'graph-algorithms'
		},

		// Network analysis papers
		{
			id: 'p5',
			title: 'The Structure and Function of Complex Networks',
			authors: ['Newman MEJ'],
			year: 2003,
			citations: 2000,
			area: 'network-analysis'
		},
		{
			id: 'p6',
			title: 'Finding and Evaluating Community Structure in Networks',
			authors: ['Newman MEJ', 'Girvan M'],
			year: 2004,
			citations: 1800,
			area: 'network-analysis'
		},
		{
			id: 'p7',
			title: 'Community Detection in Networks',
			authors: ['Fortunato S'],
			year: 2010,
			citations: 1200,
			area: 'network-analysis'
		},
		{
			id: 'p8',
			title: 'Modularity and Community Structure in Networks',
			authors: ['Newman MEJ'],
			year: 2006,
			citations: 1600,
			area: 'network-analysis'
		},

		// Social network papers
		{
			id: 'p9',
			title: 'The Strength of Weak Ties',
			authors: ['Granovetter MS'],
			year: 1973,
			citations: 2500,
			area: 'social-networks'
		},
		{
			id: 'p10',
			title: 'Social Network Analysis: Methods and Applications',
			authors: ['Wasserman S', 'Faust K'],
			year: 1994,
			citations: 1400,
			area: 'social-networks'
		},
		{
			id: 'p11',
			title: 'The Small World Problem',
			authors: ['Milgram S'],
			year: 1967,
			citations: 3000,
			area: 'social-networks'
		},
		{
			id: 'p12',
			title: 'Six Degrees of Separation',
			authors: ['Watts DJ', 'Strogatz SH'],
			year: 1998,
			citations: 2200,
			area: 'social-networks'
		},

		// Information visualization papers
		{
			id: 'p13',
			title: 'The Visual Display of Quantitative Information',
			authors: ['Tufte ER'],
			year: 1983,
			citations: 1800,
			area: 'visualization'
		},
		{
			id: 'p14',
			title: 'Envisioning Information',
			authors: ['Tufte ER'],
			year: 1990,
			citations: 1200,
			area: 'visualization'
		},
		{
			id: 'p15',
			title: 'Interactive Data Visualization',
			authors: ['Heer J', 'Bostock M', 'Ogievetsky V'],
			year: 2010,
			citations: 900,
			area: 'visualization'
		},
		{
			id: 'p16',
			title: 'D3: Data-Driven Documents',
			authors: ['Bostock M', 'Ogievetsky V', 'Heer J'],
			year: 2011,
			citations: 1100,
			area: 'visualization'
		},

		// Machine learning and networks
		{
			id: 'p17',
			title: 'Deep Learning on Graphs',
			authors: ['Hamilton WL'],
			year: 2020,
			citations: 800,
			area: 'ml-networks'
		},
		{
			id: 'p18',
			title: 'Graph Neural Networks',
			authors: ['Wu Z', 'Pan S', 'Chen F'],
			year: 2020,
			citations: 700,
			area: 'ml-networks'
		},
		{
			id: 'p19',
			title: 'Semi-Supervised Classification with Graph Convolutional Networks',
			authors: ['Kipf TN', 'Welling M'],
			year: 2017,
			citations: 1000,
			area: 'ml-networks'
		},
		{
			id: 'p20',
			title: 'Graph Attention Networks',
			authors: ['Veličković P', 'Cucurull G', 'Casanova A'],
			year: 2018,
			citations: 900,
			area: 'ml-networks'
		},

		// Biological networks
		{
			id: 'p21',
			title: "Network Biology: Understanding the Cell's Functional Organization",
			authors: ['Barabási AL', 'Oltvai ZN'],
			year: 2004,
			citations: 1100,
			area: 'biological'
		},
		{
			id: 'p22',
			title: 'Protein Interaction Networks',
			authors: ['Ito T', 'Chiba T', 'Ozawa R'],
			year: 2001,
			citations: 800,
			area: 'biological'
		},
		{
			id: 'p23',
			title: 'Metabolic Networks',
			authors: ['Jeong H', 'Tombor B', 'Albert R'],
			year: 2000,
			citations: 700,
			area: 'biological'
		},
		{
			id: 'p24',
			title: 'Gene Regulatory Networks',
			authors: ['Shen-Orr SS', 'Milo R', 'Mangan S'],
			year: 2002,
			citations: 600,
			area: 'biological'
		},

		// Internet and web networks
		{
			id: 'p25',
			title: "The Internet's Small World",
			authors: ['Adamic LA'],
			year: 1999,
			citations: 500,
			area: 'internet'
		},
		{
			id: 'p26',
			title: 'Web Graph Structure',
			authors: ['Broder A', 'Kumar R', 'Maghoul F'],
			year: 2000,
			citations: 600,
			area: 'internet'
		},
		{
			id: 'p27',
			title: 'Power-Law Distribution of the World Wide Web',
			authors: ['Barabási AL', 'Albert R', 'Jeong H'],
			year: 1999,
			citations: 800,
			area: 'internet'
		},
		{
			id: 'p28',
			title: 'The Web as a Graph',
			authors: ['Kleinberg JM', 'Kumar R', 'Raghavan P'],
			year: 1999,
			citations: 400,
			area: 'internet'
		},

		// Recent influential papers
		{
			id: 'p29',
			title: 'Attention Is All You Need',
			authors: ['Vaswani A', 'Shazeer N', 'Parmar N'],
			year: 2017,
			citations: 1500,
			area: 'ml-networks'
		},
		{
			id: 'p30',
			title: 'BERT: Pre-training of Deep Bidirectional Transformers',
			authors: ['Devlin J', 'Chang MW', 'Lee K'],
			year: 2019,
			citations: 1200,
			area: 'ml-networks'
		},
		{
			id: 'p31',
			title: 'GraphSAGE: Inductive Representation Learning on Large Graphs',
			authors: ['Hamilton WL', 'Ying R', 'Leskovec J'],
			year: 2017,
			citations: 800,
			area: 'ml-networks'
		},
		{
			id: 'p32',
			title: 'Node2Vec: Scalable Feature Learning for Networks',
			authors: ['Grover A', 'Leskovec J'],
			year: 2016,
			citations: 900,
			area: 'ml-networks'
		}
	];

	// Create citation relationships (realistic citation patterns)
	const citations = [
		// Graph algorithms citing each other
		['p2', 'p1'],
		['p3', 'p1'],
		['p4', 'p1'],
		['p4', 'p2'],
		['p4', 'p3'],

		// Network analysis papers citing graph algorithms
		['p5', 'p3'],
		['p6', 'p5'],
		['p7', 'p6'],
		['p8', 'p6'],
		['p8', 'p5'],

		// Social networks citing network analysis
		['p10', 'p5'],
		['p12', 'p11'],
		['p12', 'p5'],

		// Visualization papers citing graph algorithms
		['p15', 'p3'],
		['p16', 'p15'],
		['p16', 'p3'],

		// ML papers citing network analysis and graph algorithms
		['p17', 'p5'],
		['p17', 'p7'],
		['p18', 'p17'],
		['p19', 'p17'],
		['p20', 'p19'],
		['p31', 'p17'],
		['p32', 'p17'],
		['p31', 'p32'],

		// Biological networks citing network analysis
		['p21', 'p5'],
		['p22', 'p21'],
		['p23', 'p21'],
		['p24', 'p21'],

		// Internet papers citing network analysis
		['p25', 'p5'],
		['p26', 'p25'],
		['p27', 'p5'],
		['p28', 'p26'],

		// Recent papers citing foundational work
		['p29', 'p17'],
		['p30', 'p29'],
		['p31', 'p18'],
		['p32', 'p18']
	];

	// Create the graph
	const graph = new Graph();

	// Add nodes (papers)
	papers.forEach((paper) => {
		graph.addNode(paper.id, {
			title: paper.title,
			authors: paper.authors,
			year: paper.year,
			citations: paper.citations,
			area: paper.area,
			label: paper.title.substring(0, 30) + (paper.title.length > 30 ? '...' : '')
		});
	});

	// Add edges (citations)
	citations.forEach(([source, target]) => {
		graph.addEdge(source, target, {
			type: 'cites',
			weight: 1
		});
	});

	return graph;
}
