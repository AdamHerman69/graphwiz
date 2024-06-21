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
let graphObject: Graph = $state(new Graph());
// export let graph = $state(graphObject);
export function getGraph(): Graph {
	return graphObject;
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
			general: general
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

export function importGraphJSON(newGraphObject: object): void {
	unbindAttributes();

	let newGraph = new Graph();
	newGraph.import(newGraphObject);
	computeAttributes(newGraph);
	graphObject = newGraph;

	// todo clear history
}

export function importGraphOther(graphString: string): void {
	unbindAttributes();

	graphObject = parse(Graph, graphString);
	computeAttributes(graphObject);
	// todo unbind attributes
	// recompute attributes
	// clear history
	console.log('imported graph');
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
