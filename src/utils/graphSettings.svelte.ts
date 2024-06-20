import { type Attribute, type RangeAttribute, getAttributeValue, getGraph } from './graph.svelte';
import type { Guideline } from './guidelines.svelte';
import { type Rule, stripAttributeBasedRules, evalRule } from './rules.svelte';
import type { RgbaColor } from 'colord';
import { scaleLinear } from './scaleLinear';
import { getGradientColor } from './gradient';

export type Setting<T> = {
	name: string;
	value: T;
	attribute?: RangeAttribute;
	source: null | Guideline;
};

export type SelectSetting<T> = Setting<T> & {
	readonly values: T[];
};

export type NumericalSetting = Setting<number> & {
	min: number;
	max: number;
	increment?: number;

	domainRange?: [number, number]; // min to max of the attribute/propertygetter
	selectedRange?: [number, number]; //selected range to map onto
};

export type DecoratorData = {
	id: number;
	type: DecoratorType;
	position: number;
};

const decoratorTypes = ['triangle', 'circle', 'square'] as const;
export type DecoratorType = (typeof decoratorTypes)[number];

export type DecoratorSetting = Setting<DecoratorData[]> & {
	types: DecoratorType[];
	value: DecoratorData[];
};

export type Gradient = [RgbaColor, number][];
export type ColorSetting = Setting<Gradient> & {
	domainRange?: [number, number];
};

type LabelStyle = {
	text: string;
	color: RgbaColor;
	size: number;
	attribute?: Attribute;
};

export type NodeLabel = LabelStyle & {
	position: 'below' | 'above' | 'left' | 'right' | 'center';
	id: number;
};

export type EdgeLabel = LabelStyle & {
	relativePosition: number;
	position: 'below' | 'above' | 'center';
	rotate: boolean;
	id: number;
};

export type NodeProperties = {
	size?: NumericalSetting;
	color?: ColorSetting;
	strokeWidth?: NumericalSetting;
	strokeColor?: ColorSetting;
	labels?: NodeLabel[];
	// todo shape?
};

const nodeSettingsTypes = ['size', 'color', 'strokeWidth', 'strokeColor', 'labels'] as const;
export type NodeSettingsName = (typeof nodeSettingsTypes)[number];

const edgeSettingsTypes = [
	'type',
	'width',
	'color',
	'partialStart',
	'partialEnd',
	'decorators',
	'labels'
] as const;
export type EdgeSettingsName = (typeof edgeSettingsTypes)[number];

type RuleSettings = {
	id: number; // for keyed each blocks
	priority: number;
	rule?: Rule;
	source: null | Guideline;
};

export type NodeSettings = NodeProperties & RuleSettings;
export type EdgeSettings = EdgeProperties & RuleSettings;

const edgeTypes = ['straight', 'arrow', 'conical'] as const;
export type EdgeType = (typeof edgeTypes)[number];

// todo layout specific settings in a layout object. swich layouts based on this object, not other
const layoutTypes = [
	'force-graph',
	'layered',
	'stress',
	'disco',
	'force',
	'radial',
	'mrtree',
	'sporeCompaction',
	'random',
	'sporeOverlap',
	'box',
	'rectpacking'
] as const;
export type LayoutType = (typeof layoutTypes)[number];

export type EdgeProperties = {
	type?: SelectSetting<EdgeType>;
	width?: NumericalSetting;
	color?: ColorSetting;
	partialStart?: NumericalSetting;
	partialEnd?: NumericalSetting;
	decorators?: DecoratorSetting;
	labels?: EdgeLabel[];
};

// todo decorator and label source
export const edgeSettingsDefaults: EdgeProperties = {
	type: { name: 'type', values: Array.from(edgeTypes), value: 'straight', source: null },
	width: { name: 'width', value: 1, min: 0, max: 5, increment: 0.5, source: null },
	color: {
		name: 'color',
		value: [
			[{ r: 115, g: 80, b: 214, a: 1 }, 0],
			[{ r: 80, g: 220, b: 180, a: 1 }, 1]
		],
		source: null
	},
	partialStart: { name: 'partialStart', value: 0, min: 0, max: 1, increment: 0.05, source: null },
	partialEnd: { name: 'partialEnd', value: 1, min: 0, max: 1, increment: 0.05, source: null },
	decorators: { types: Array.from(decoratorTypes), name: 'decorators', value: [], source: null },
	labels: []
} as const;

export const nodeSettingsDefaults: NodeProperties = {
	size: { name: 'size', value: 5, min: 1, max: 10, source: null },
	color: { name: 'color', value: [[{ r: 80, g: 220, b: 180, a: 1 }, 1]], source: null },
	strokeWidth: { name: 'strokeWidth', value: 1, min: 0, max: 10, source: null },
	strokeColor: { name: 'strokeColor', value: [[{ r: 80, g: 220, b: 180, a: 1 }, 1]], source: null },
	labels: []
} as const;

let guiID = $state(0);

export type GraphSettings = {
	guiID: number;
	layout: SelectSetting<LayoutType>;
	nodeSettings: NodeSettings[];
	edgeSettings: EdgeSettings[];
};

export let graphSettings: GraphSettings = $state({
	guiID: guiID,
	layout: {
		name: 'layout',
		values: Array.from(layoutTypes),
		value: 'force-graph',
		source: null
	},
	nodeSettings: [
		{
			...nodeSettingsDefaults,
			id: newGUIID(),
			priority: 0,
			source: null
		}
	],
	edgeSettings: [
		{
			...edgeSettingsDefaults,
			id: newGUIID(),
			priority: 0,
			source: null
		}
	]
});

// import / export

export function isValidSettings(object: any): boolean {
	// todo implement
	return true;
}

export function exportState(): GraphSettings {
	return $state.snapshot(graphSettings);
}

export function importState(state: GraphSettings): void {
	graphSettings.guiID = state.guiID;
	graphSettings.layout = state.layout;
	graphSettings.nodeSettings = state.nodeSettings;
	graphSettings.edgeSettings = state.edgeSettings;
}

// called on new graph import to remove all non-general attribute bindings
export function unbindAttributes() {
	graphSettings.nodeSettings.forEach((ns) => {
		if (ns.size?.attribute) ns.size.attribute = undefined;
		if (ns.color?.attribute) ns.color.attribute = undefined;
		if (ns.strokeWidth?.attribute) ns.strokeWidth.attribute = undefined;
		if (ns.strokeColor?.attribute) ns.strokeColor.attribute = undefined;

		if (ns.rule) stripAttributeBasedRules(ns.rule);
	});

	graphSettings.edgeSettings.forEach((es) => {
		if (es.width?.attribute) es.width.attribute = undefined;
		if (es.color?.attribute) es.color.attribute = undefined;
		if (es.partialStart?.attribute) es.partialStart.attribute = undefined;
		if (es.partialEnd?.attribute) es.partialEnd.attribute = undefined;

		if (es.rule) stripAttributeBasedRules(es.rule);
	});
}

// Types for renderer
export type NodeStyle = {
	size: number;
	color: Gradient;
	strokeWidth: number;
	strokeColor: Gradient;
	labels: NodeLabel[];
	shadow: boolean;
};

export type EdgeStyle = {
	type: EdgeType;
	width: number;
	color: Gradient;
	partialStart: number;
	partialEnd: number;
	decorators: DecoratorData[];
	labels: EdgeLabel[];
};

export type NodeStyles = Map<string, NodeStyle>;
export type EdgeStyles = Map<string, EdgeStyle>;

export function getNodeStyle(id: string, nodeSettings: NodeSettings[]): NodeStyle {
	let chosenSettings: NodeProperties = {};

	// iterating in increasing priority order

	// TODO BIG BUG says it's undefined while still running evalRule
	nodeSettings.forEach((ns, index) => {
		if (ns.rule === undefined || evalRule(ns.rule!, id)) {
			if (ns.size) chosenSettings['size'] = ns.size;
			if (ns.color) chosenSettings['color'] = ns.color;
			if (ns.strokeWidth) chosenSettings['strokeWidth'] = ns.strokeWidth;
			if (ns.strokeColor) chosenSettings['strokeColor'] = ns.strokeColor;
			if (ns.labels) chosenSettings['labels'] = ns.labels;
		}
	});

	let nodeStyle: NodeStyle = {};

	// todo handle range with properties
	// attribute based styles
	for (let [key, setting] of Object.entries(chosenSettings)) {
		if (setting.attribute) {
			if (setting.min != undefined) {
				setting = setting as NumericalSetting;
				nodeStyle[setting.name] = scaleLinear(
					setting.domainRange!,
					setting.selectedRange!,
					getAttributeValue(id, setting.attribute)
				);
			} else {
				setting = setting as ColorSetting;
				let gradientPosition = scaleLinear(
					setting.domainRange!,
					[0, 1],
					getAttributeValue(id, setting.attribute)
				);
				nodeStyle[setting.name] = getGradientColor(setting.value, gradientPosition);
			}
		} else {
			nodeStyle[setting.name] = setting.value;
		}
	}

	// labels
	// label attributes
	// node property getters

	// TODO
	// console.log('chosenSettings.labels: ', $state.snapshot(chosenSettings.labels));
	nodeStyle.labels = $state.snapshot(chosenSettings.labels);
	nodeStyle.labels.forEach((label) => {
		if (label.attribute) {
			label.text = getAttributeValue(id, label.attribute).toString();
		}
	});

	// TODO
	// nodeStyle.shadow = false;
	// if (hoveredNodeKey === id) {
	// 	//nodeStyle.size = nodeStyle.size + 2;
	// 	nodeStyle.shadow = true;
	// } else if (selectedNode?.id === id) {
	// 	// nodeStyle.strokeWidth = 5;
	// 	// nodeStyle.strokeColor = 'rgba(115, 255, 100, 1)';
	// }

	return nodeStyle;
}

export function getEdgeStyle(id: string, edgeSettings: EdgeSettings[]): EdgeStyle {
	let chosenSettings: EdgeProperties = {};

	// iterating in increasing priority order
	edgeSettings.forEach((edgeSettings) => {
		if (edgeSettings.rule === undefined || evalRule(edgeSettings.rule, id)) {
			if (edgeSettings.type) chosenSettings['type'] = edgeSettings.type;
			if (edgeSettings.width) chosenSettings['width'] = edgeSettings.width;
			if (edgeSettings.color) chosenSettings['color'] = edgeSettings.color;
			if (edgeSettings.partialStart) chosenSettings['partialStart'] = edgeSettings.partialStart;
			if (edgeSettings.partialEnd) chosenSettings['partialEnd'] = edgeSettings.partialEnd;
			if (edgeSettings.decorators) chosenSettings['decorators'] = edgeSettings.decorators;
			if (edgeSettings.labels) chosenSettings['labels'] = edgeSettings.labels;
		}
	});

	let edgeStyle: EdgeStyle = {};

	// attribute based styles
	for (let [key, setting] of Object.entries(chosenSettings)) {
		setting = setting as NumericalSetting;
		if (setting.attribute) {
			if (setting.min != undefined) {
				setting = setting as NumericalSetting;
				edgeStyle[setting.name] = scaleLinear(
					setting.domainRange,
					setting.selectedRange,
					getAttributeValue(id, setting.attribute)
				);
			} else {
				setting = setting as ColorSetting;
				let gradientPosition = scaleLinear(
					setting.domainRange!,
					[0, 1],
					getAttributeValue(id, setting.attribute)
				);
				edgeStyle[setting.name] = getGradientColor(setting.value, gradientPosition);
			}
		} else {
			edgeStyle[setting.name] = setting.value;
		}
	}

	// TODO labels
	edgeStyle.labels = $state.snapshot(chosenSettings.labels);
	edgeStyle.labels.forEach((label) => {
		if (label.attribute) {
			label.text = getAttributeValue(id, label.attribute).toString();
		}
	});
	return edgeStyle;
}

// todo maybe don't create a new map every time
let nodeStyles: Map<string, NodeStyle> = $derived.by(() => {
	let ns = new Map<string, NodeStyle>();
	getGraph().forEachNode((id: string) => {
		ns.set(id, getNodeStyle(id, graphSettings.nodeSettings));
	});
	console.log('styles recomputed');
	return ns;
});
let edgeStyles: Map<string, EdgeStyle> = $derived.by(() => {
	let es = new Map<string, EdgeStyle>();
	getGraph().forEachEdge((id: string) => {
		es.set(id, getEdgeStyle(id, graphSettings.edgeSettings));
	});
	return es;
});

export function getNodeStyles() {
	return nodeStyles;
}

export function getEdgeStyles() {
	return edgeStyles;
}

export function newGUIID(): number {
	return guiID++;
}
