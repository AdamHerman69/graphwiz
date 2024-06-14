import { type RangeAttribute } from './graph.svelte';
import type { Guideline } from './guidelines.svelte';
import type { Rule } from './rules.svelte';

export type Setting<T> = {
	name: string;
	value: any;
	attribute?: RangeAttribute | GraphPropertyGetter;
	source: null | Guideline;
};

export type SelectSetting<T> = Setting<T> & {
	readonly values: T[];
	value: T;
};

export type NumericalSetting = Setting<number> & {
	value: number;
	min: number;
	max: number;
	//scale?: ScaleFunction;
	domainRange?: [number, number]; // min to max of the attribute/propertygetter
	selectedRange?: [number, number]; //selected range to map onto

	increment?: number;
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

export type Gradient = [string, number][];
export type ColorSetting = Setting<string | Gradient> & {
	value: string | Gradient;
	domainRange?: [number, number]; // min to max of the attribute/propertygetter
	//scale?: ScaleFunction;
};

type LabelStyle = {
	text: string;
	color: string;
	size: number;
	attributeName?: string; // can be a property as well
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

type RuleSettings = {
	priority: number;
	rule: Rule;
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
export const edgeSettingsDefaults: EdgeSettings = {
	type: { name: 'type', values: Array.from(edgeTypes), value: 'straight', source: null },
	width: { name: 'width', value: 1, min: 0, max: 5, increment: 0.5, source: null },
	color: {
		name: 'color',
		value: [
			['purple', 0],
			['lime', 1]
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
	color: { name: 'color', value: 'purple', source: null },
	strokeWidth: { name: 'strokeWidth', value: 1, min: 0, max: 10, source: null },
	strokeColor: { name: 'strokeColor', value: 'purple', source: null },
	labels: []
};

// todo change based on actual rule
export const ruleSettingsDefaults: RuleSettings = {
	priority: 0,
	rule: {},
	source: null
};

export let layoutSettings: SelectSetting<LayoutType> = $state({
	name: 'layout',
	values: Array.from(layoutTypes),
	value: 'force-graph'
});
export let nodeSettings: NodeSettings[] = $state([
	{
		...nodeSettingsDefaults,
		...ruleSettingsDefaults
	}
]);
export let edgeSettings: EdgeSettings[] = $state([
	{
		...edgeSettingsDefaults,
		...ruleSettingsDefaults
	}
]);
