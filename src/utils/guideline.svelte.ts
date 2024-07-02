import { getGraph } from './graph.svelte';
import type Graph from 'graphology';
import type { NodeSettings, EdgeSettings, LayoutType } from './graphSettings.svelte';
import guidelinesFile from './guidelines.json';
import { graphCharacteristics } from './graph.svelte';

export type Literature = {
	title: string;
	authors: string[];
	year: number;
};

type NumericCondition = {
	type: 'numeric';
	property: string;
	min?: number;
	max?: number;
	ideal?: number;
	tolerance?: number;
};

type BooleanCondition = {
	type: 'boolean';
	property: string;
	value: boolean;
};

type StringCondition = {
	type: 'string';
	property: string;
	value: boolean;
};

type CompositeCondition = {
	type: 'composite';
	conditions: WeightedCondition[];
};

type Condition = NumericCondition | BooleanCondition | StringCondition | CompositeCondition;

type WeightedCondition = {
	weight: number;
	weightNormalized?: number;
	condition: Condition;
};

export type Guideline = {
	id: string;
	score?: number;
	description: string;
	literature: Literature[];
	rootCondition: WeightedCondition;
	recommendations: {
		layout?: LayoutType;
		edgeSettings?: EdgeSettings[];
		nodeSettings?: NodeSettings[];
	};
};

const normalizeWeights = (conditions: WeightedCondition[]): WeightedCondition[] => {
	const totalWeight = conditions.reduce((sum, wc) => sum + wc.weight, 0);
	return conditions.map((wc) => ({
		...wc,
		weightNormalized: wc.weight / totalWeight
	}));
};

const evaluateNumericCondition = (condition: NumericCondition): number => {
	const value: number = graphCharacteristics[condition.property].value as number;

	console.log('condition:', condition);
	console.log('characteristic:', graphCharacteristics[condition.property]);
	console.log(value);

	// Check if value is within range
	if (condition.min !== undefined && value < condition.min) return 0;
	if (condition.max !== undefined && value > condition.max) return 0;

	// Case 1: Ideal and tolerance are provided
	if (condition.ideal !== undefined && condition.tolerance !== undefined) {
		const deviation = Math.abs(value - condition.ideal);
		return Math.max(0, 1 - deviation / condition.tolerance);
	}

	// Case 2: Range is provided (min and max)
	if (condition.min !== undefined && condition.max !== undefined) {
		const range = condition.max - condition.min;
		const idealValue = condition.ideal !== undefined ? condition.ideal : condition.min + range / 2;
		const normalizedValue = (value - condition.min) / range;
		const normalizedIdeal = (idealValue - condition.min) / range;
		return 1 - Math.abs(normalizedValue - normalizedIdeal);
	}

	// Case 3: Only min or max is provided
	if (condition.min !== undefined || condition.max !== undefined) {
		// Treat it as a boolean condition
		return 1;
	}

	// If no constraints are provided, throw
	throw new Error('Invalid numeric condition');
};

const evaluateStringCondition = (condition: StringCondition): number => {
	console.log(condition);
	console.log(graphCharacteristics[condition.property].value);
	console.log(condition.value);
	return graphCharacteristics[condition.property].value === condition.value ? 1 : 0;
};

const evaluateBooleanCondition = (condition: BooleanCondition): number => {
	console.log(condition);
	console.log(graphCharacteristics[condition.property].value);
	console.log(condition.value);
	return graphCharacteristics[condition.property].value === condition.value ? 1 : 0;
};

const evaluateCompositeCondition = (condition: CompositeCondition): number => {
	const normalizedConditions = normalizeWeights(condition.conditions);
	return normalizedConditions.reduce((sum, wc) => {
		console.log('wc', wc);
		const score = evaluateCondition(wc.condition);
		return sum + score * wc.weightNormalized!;
	}, 0);
};

const evaluateCondition = (condition: Condition): number => {
	switch (condition.type) {
		case 'numeric':
			return evaluateNumericCondition(condition);
		case 'boolean':
			return evaluateBooleanCondition(condition);
		case 'composite':
			return evaluateCompositeCondition(condition);
		case 'string':
			return evaluateStringCondition(condition);
	}
};

const calculateApplicability = (guideline: Guideline): number => {
	console.log('calculate applicability: condition:', guideline.rootCondition.condition);
	guideline.score = evaluateCondition(guideline.rootCondition.condition);
	return guideline.score;
};

export const sortGuidelines = (graph: Graph): Guideline[] => {
	guidelines.forEach((guideline) => {
		console.log('rootCondition', guideline.rootCondition);
		$inspect(guideline);
		calculateApplicability(guideline);
	});
	guidelines.sort((a, b) => b.score! - a.score!);

	return guidelines;
};

let guidelines: Guideline[] = $state([]);
export function getGuidelines(): Guideline[] {
	return guidelines;
}
export function loadGuidelines() {
	guidelines = guidelinesFile;
}
