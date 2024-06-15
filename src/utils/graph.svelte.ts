import Graph from 'graphology';

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

// export const graphProperties = ['degree, inDegree, outDegree', 'id'] as const;
// export type GraphProperty = (typeof graphProperties)[number];

export let availableAttributes: Attribute[] = $state([]);

function getNodeAttribute(graph: Graph, id: string, attribute: string): number | string {
	switch (attribute) {
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
				return graph.getNodeAttribute(id, attribute);
			} catch (e) {
				throw new Error('Property not found');
			}
	}
}

function getEdgeAttribute(graph: Graph, id: string, attributeName: string): number | string {
	switch (attributeName) {
		case 'test':
			return 4;
		default:
			try {
				return graph.getEdgeAttribute(id, attributeName);
			} catch (e) {
				throw new Error('Property not found');
			}
	}
}

export function getAttributeValue(graph: Graph, id: string, attribute: Attribute): number | string {
	if (attribute.owner === 'node') {
		return getNodeAttribute(graph, id, attribute.name);
	} else {
		return getEdgeAttribute(graph, id, attribute.name);
	}
}

export function computeAttributeRange(graph: Graph, attribute: RangeAttribute): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	graph.forEachNode((id) => {
		let value = getAttributeValue(graph, id, attribute) as number;
		if (value < min) min = value;
		if (value > max) max = value;
	});
	return [min, max];
}
