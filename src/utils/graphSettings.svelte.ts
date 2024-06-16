import { type Attribute, type RangeAttribute } from './graph.svelte';
import type { Guideline } from './guidelines.svelte';
import { type Rule, stripAttributeBasedRules } from './rules.svelte';
import type { RgbaColor } from 'colord';

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
};

export const nodeSettingsDefaults: NodeProperties = {
	size: { name: 'size', value: 5, min: 1, max: 10, source: null },
	color: { name: 'color', value: [[{ r: 80, g: 220, b: 180, a: 1 }, 1]], source: null },
	strokeWidth: { name: 'strokeWidth', value: 1, min: 0, max: 10, source: null },
	strokeColor: { name: 'strokeColor', value: [[{ r: 80, g: 220, b: 180, a: 1 }, 1]], source: null },
	labels: []
};

// todo change based on actual rule
export const ruleSettingsDefaults: RuleSettings = {
	priority: 0,
	source: null
};

export type GraphSettings = {
	layout: SelectSetting<LayoutType>;
	nodeSettings: NodeSettings[];
	edgeSettings: EdgeSettings[];
};

export let graphSettings: GraphSettings = $state({
	layout: {
		name: 'layout',
		values: Array.from(layoutTypes),
		value: 'force-graph',
		source: null
	},
	nodeSettings: [
		{
			...nodeSettingsDefaults,
			...ruleSettingsDefaults
		}
	],
	edgeSettings: [
		{
			...edgeSettingsDefaults,
			...ruleSettingsDefaults
		}
	]
});

// export function getLayoutSettings(): SelectSetting<LayoutType> {
// 	return graphSettings.layout;
// }

// export function getNodeSettings(): NodeSettings[] {
// 	return graphSettings.nodeSettings;
// }

// export function getEdgeSettings(): EdgeSettings[] {
// 	return graphSettings.edgeSettings;
// }

// import / export

export function isValidSettings(object: any): boolean {
	// todo implement
	return true;
}

// todo rewrite so we're not reassigning the state
export function importSettings(settings: GraphSettings): void {
	graphSettings.layout = settings.layout;
	graphSettings.nodeSettings = settings.nodeSettings;
	graphSettings.edgeSettings = settings.edgeSettings;
}

export function exportSettings(): GraphSettings {
	return $state.snapshot(graphSettings);
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
	color: string | Gradient;
	strokeWidth: number;
	strokeColor: string;
	labels: NodeLabel[];
	shadow: boolean;
};

export type EdgeStyle = {
	type: EdgeType;
	width: number;
	color: string | Gradient;
	partialStart: number;
	partialEnd: number;
	decorators: DecoratorData[];
	labels: EdgeLabel[];
};
