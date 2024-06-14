import Graph from 'graphology';

export type Attribute = {
	name: string;
	type: 'number' | 'string';
	owner: 'edge' | 'node';
};

export type RangeAttribute = Attribute & {
	range: [number, number];
	getter: (graph: Graph, id: string) => number;
};
