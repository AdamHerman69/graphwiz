import Graph from 'graphology';
import { parse } from 'graphology-graphml';
import { unbindAttributes } from './graphSettings.svelte';

export type Attribute = {
	name: string;
	type: 'number' | 'string';
	owner: 'edge' | 'node';
	general: boolean; // degree, inDegree, outDegree, id are general attributes
};

export type RangeAttribute = Attribute & {
	range: [number, number];
};

export type StringAttribute = Attribute & {
	values: string[];
};

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
				return graph.degree(id);
			case 'inDegree':
				return graph.inDegree(id);
			case 'outDegree':
				return graph.outDegree(id);
			case 'id':
				return id;
			default:
				try {
					return graph.getNodeAttribute(id, attribute.name);
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
					return graph.getEdgeAttribute(id, attribute.name);
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
let graph: Graph = $state(new Graph());
export function loadSampleGraph(): Graph {
	graph.addNode('a', { volume: 40, neco: 'nejakej string' });
	graph.addNode('b', { volume: 25 });
	graph.addNode('c', { volume: 80 });
	graph.addNode('d', { volume: 35 });
	graph.addNode('e', { volume: 41, neco: 'random string' });
	graph.addNode('f', { volume: 40, neco: 55 });
	graph.addNode('g', { volume: 27 });
	graph.addNode('h', { volume: 65 });
	graph.addNode('i', { volume: 58, kk: 2 });
	graph.addNode('j', { volume: 32, neco: 3 });
	graph.addEdge('a', 'b', { speed: 1010 });
	graph.addEdge('a', 'c', { speed: 250 });
	graph.addEdge('a', 'd', { speed: 555 });
	graph.addEdge('a', 'e', { speed: 666 });
	graph.addEdge('b', 'c', { speed: 100 });
	graph.addEdge('g', 'c', { speed: 889 });
	graph.addEdge('f', 'd', { speed: 1000 });
	graph.addEdge('d', 'c', { speed: 666 });
	graph.addEdge('e', 'f', { speed: 370 });
	graph.addEdge('e', 'g', { speed: 552 });
	graph.addEdge('h', 'c', { speed: 345 });
	graph.addEdge('i', 'd', { speed: 958 });
	graph.addEdge('j', 'c', { speed: 399 });
	graph.addEdge('h', 'i', { speed: 1005 });
	graph.addEdge('j', 'i', { speed: 396 });

	return graph;
}

export function computeAttributes(graph: Graph) {
	availableAttributes.length = 0;
	availableAttributes.push(...findAllNodeAttributes(graph));
	availableAttributes.push(...findAllEdgeAttributes(graph));
	availableAttributes.push(...generalAttributes);
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
	owner: 'node' | 'edge'
): RangeAttribute | StringAttribute {
	const minValue = Math.min(...values);

	if (isNaN(minValue)) {
		return {
			name: name,
			values: values,
			type: 'string',
			owner: owner,
			general: false
		} as StringAttribute;
	} else {
		const maxValue = Math.max(...values);

		return {
			name: name,
			range: [minValue, maxValue],
			type: 'number',
			owner: owner,
			general: false
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

export function importGraphJSON(graphObject: object): void {
	unbindAttributes();

	let newGraph = new Graph();
	newGraph.import(graphObject);
	computeAttributes(newGraph);
	graph = newGraph;

	// todo clear history
}

export function importGraphOther(graphString: string): void {
	unbindAttributes();

	graph = parse(Graph, graphString); // won't work raessigning probably
	computeAttributes(graph);
	// todo unbind attributes
	// recompute attributes
	// clear history
}

export function exportGraph(): object {
	return graph.export();
}

export function getEdgeSource(edge: string): string {
	return graph.source(edge);
}

export function getEdgeTarget(edge: string): string {
	return graph.target(edge);
}
