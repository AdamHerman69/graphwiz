import { getGraph } from './graph.svelte';
import type Graph from 'graphology';
import {
	type NodeSettings,
	type EdgeSettings,
	type LayoutType,
	GraphSettingsClass,
	type Setting
} from './graphSettings.svelte';
import guidelinesFile from './guidelines.json';
import { graphCharacteristics } from './graph.svelte';
import { areRulesEqual } from './rules.svelte';

export type Literature = {
	title: string;
	authors: string[];
	year: number;
};

export type GuidelineStatus = {
	applied: 'fully' | 'partially' | 'notApplied';
	conflicts: Conflict[];
};

type Conflict = {
	type: 'layout' | 'nodeSetting' | 'edgeSetting';
	property?: string;
	index?: number;
	conflictingGuidelineId: number;
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

export function isComposite(condition: Condition): condition is CompositeCondition {
	return condition.type === 'composite';
}

type Condition = NumericCondition | BooleanCondition | StringCondition | CompositeCondition;

export type WeightedCondition = {
	weight: number;
	weightNormalized?: number;
	score?: number;
	scoreWeighted?: number;
	condition: Condition;
};

export type StaticGuideline = {
	name: string;
	description: string;
	literature: Literature[];
	rootCondition: WeightedCondition;
	recommendations: {
		layout?: LayoutType;
		edgeSettings?: EdgeSettings[];
		nodeSettings?: NodeSettings[];
	};
};

export type Guideline = StaticGuideline & {
	id: number;
	score: number;
	status: GuidelineStatus;
};

const normalizeWeights = (conditions: WeightedCondition[]): WeightedCondition[] => {
	const totalWeight = conditions.reduce((sum, wc) => sum + wc.weight, 0);
	conditions.forEach((wc) => {
		wc.weightNormalized = wc.weight / totalWeight;
	});

	return conditions;
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
		wc.score = evaluateCondition(wc.condition);
		console.log('wc.score', wc.score);
		wc.scoreWeighted = wc.score * wc.weightNormalized!;
		return sum + wc.scoreWeighted;
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

export function computeGuidelineStatuses(
	guidelines: Guideline[],
	graphSettings: GraphSettingsClass
): void {
	console.log('guidelines:', guidelines);
	guidelines.forEach((guideline) => {
		guideline.status = getGuidelineStatus(guideline, graphSettings);
	});
}

// todo layout and labels[] derocators[] don't work
function getGuidelineStatus(
	guideline: Guideline,
	graphSettings: GraphSettingsClass
): GuidelineStatus {
	const status: GuidelineStatus = {
		applied: 'notApplied',
		conflicts: []
	};

	let appliedCount = 0;
	let totalRecommendations = 0;

	// Check layout
	if (guideline.recommendations.layout) {
		totalRecommendations++;
		if (
			graphSettings.graphSettings.layout.value === guideline.recommendations.layout &&
			graphSettings.graphSettings.layout.source === guideline.id
		) {
			appliedCount++;
		} else if (
			graphSettings.graphSettings.layout.source &&
			graphSettings.graphSettings.layout.source !== guideline.id
		) {
			status.conflicts.push({
				type: 'layout',
				conflictingGuidelineId: graphSettings.graphSettings.layout.source
			});
		}
	}

	// Check node settings
	if (guideline.recommendations.nodeSettings) {
		appliedCount += checkSettings(
			guideline.recommendations.nodeSettings,
			graphSettings.graphSettings.nodeSettings,
			guideline.id,
			'nodeSetting',
			status.conflicts
		);
		totalRecommendations += countRecommendations(guideline.recommendations.nodeSettings);
	}

	// Check edge settings
	if (guideline.recommendations.edgeSettings) {
		appliedCount += checkSettings(
			guideline.recommendations.edgeSettings,
			graphSettings.graphSettings.edgeSettings,
			guideline.id,
			'edgeSetting',
			status.conflicts
		);
		totalRecommendations += countRecommendations(guideline.recommendations.edgeSettings);
	}

	// Determine application status
	if (appliedCount === totalRecommendations) {
		status.applied = 'fully';
	} else if (appliedCount > 0) {
		status.applied = 'partially';
	}

	console.log(
		'guideline id:',
		guideline.id,
		'status:',
		status,
		'appliedCount:',
		appliedCount,
		'totalRecommendations:',
		totalRecommendations
	);
	console.log('recommendations:', JSON.stringify(guideline.recommendations, null, 2));

	return status;
}

// helper function to check Settings if guideline is applied
function checkSettings(
	recommendedSettings: (NodeSettings | EdgeSettings)[],
	currentSettings: (NodeSettings | EdgeSettings)[],
	guidelineId: number,
	settingType: 'nodeSetting' | 'edgeSetting',
	conflicts: Conflict[]
): number {
	let appliedCount = 0;

	// Check global settings (index 0)
	if (recommendedSettings[0] && currentSettings[0]) {
		appliedCount += checkProperties(
			recommendedSettings[0],
			currentSettings[0],
			guidelineId,
			settingType,
			0,
			conflicts
		);
	}

	// Check conditional settings (index 1-n)
	for (let i = 1; i < recommendedSettings.length; i++) {
		const recommendedSetting = recommendedSettings[i];
		const currentSetting = currentSettings.find((s) =>
			areRulesEqual(s.rule, recommendedSetting.rule)
		);

		console.log('guideline: ', guidelineId, 'currentSetting: ', currentSetting);

		if (currentSetting) {
			if (currentSetting.source === guidelineId) {
				appliedCount++;
			} else if (currentSetting.source) {
				conflicts.push({
					type: settingType,
					index: i,
					conflictingGuidelineId: currentSetting.source
				});
			}
		}
	}

	return appliedCount;
}

// helper function used by checkSettings to check for applied guidelines
function checkProperties(
	recommended: NodeSettings | EdgeSettings,
	current: NodeSettings | EdgeSettings,
	guidelineId: number,
	settingType: 'nodeSetting' | 'edgeSetting',
	index: number,
	conflicts: Conflict[]
): number {
	let appliedCount = 0;

	for (const [key, value] of Object.entries(recommended)) {
		if (key !== 'id' && key !== 'priority' && key !== 'rule' && key !== 'source') {
			const currentValue = current[key] as Setting<any>;
			if (currentValue) {
				if (currentValue.source === guidelineId) {
					appliedCount++;
				} else if (currentValue.source) {
					conflicts.push({
						type: settingType,
						property: key,
						index: index,
						conflictingGuidelineId: currentValue.source
					});
				}
			}
		}
	}

	return appliedCount;
}

// helper for checkSettings
function countRecommendations(settings: (NodeSettings | EdgeSettings)[]): number {
	let count = 0;
	settings.forEach((setting, index) => {
		if (index === 0) {
			// Count properties in global settings
			count += Object.keys(setting).filter(
				(key) => key !== 'id' && key !== 'priority' && key !== 'rule' && key !== 'source'
			).length;
		} else {
			// Count conditional settings
			count++;
		}
	});
	return count;
}

export function applyGuideline(guideline: Guideline, graphSettings: GraphSettingsClass): void {
	graphSettings.applyGuideline(
		guideline.recommendations.layout,
		guideline.recommendations.nodeSettings,
		guideline.recommendations.edgeSettings
	);
}

function addSourceToSettings(guidelines: Guideline[]): void {
	// todo layout
	console.log('source guidelines:', $state.snapshot(guidelines));
	guidelines.forEach((guideline) => {
		guideline.recommendations.nodeSettings?.forEach((nodeSetting: NodeSettings) => {
			nodeSetting.source = guideline.id;
			if (nodeSetting.size) nodeSetting.size.source = guideline.id;
			if (nodeSetting.color) nodeSetting.color.source = guideline.id;
			if (nodeSetting.strokeWidth) nodeSetting.strokeWidth.source = guideline.id;
			if (nodeSetting.strokeColor) nodeSetting.strokeColor.source = guideline.id;
			if (nodeSetting.labels)
				nodeSetting.labels.forEach((label) => {
					label.source = guideline.id;
				});
		});

		guideline.recommendations.edgeSettings?.forEach((edgeSetting) => {
			edgeSetting.source = guideline.id;
			if (edgeSetting.color) edgeSetting.color.source = guideline.id;
			if (edgeSetting.width) edgeSetting.width.source = guideline.id;
			if (edgeSetting.partialStart) edgeSetting.partialStart.source = guideline.id;
			if (edgeSetting.partialEnd) edgeSetting.partialEnd.source = guideline.id;
			if (edgeSetting.decorators)
				edgeSetting.decorators.value.forEach((decorator) => {
					decorator.source = guideline.id;
				});
			if (edgeSetting.labels)
				edgeSetting.labels.forEach((label) => {
					label.source = guideline.id;
				});
		});
	});

	// guideline.recommendations.edgeSettings?.forEach((edgeSetting) => {
	// 	edgeSetting.source = guideline;
	// 	Object.keys(edgeSetting).forEach((key) => {
	// 		if (edgeSetting[key]) edgeSetting[key].source = guideline;
	// 	});
	// });
}

function addGuidelineIDs(guidelines: Guideline[], graphSettings: GraphSettingsClass): void {
	guidelines.forEach((guideline) => {
		guideline.id = graphSettings.newGUIID();
	});
}

const calculateApplicability = (guideline: Guideline): number => {
	console.log('calculate applicability: condition:', guideline.rootCondition.condition);
	guideline.score = evaluateCondition(guideline.rootCondition.condition);
	return guideline.score;
};

export const sortGuidelines = (guidelines: Guideline[], graph: Graph): Guideline[] => {
	guidelines.forEach((guideline) => {
		console.log('rootCondition', guideline.rootCondition);
		$inspect(guideline);
		calculateApplicability(guideline);
	});
	guidelines.sort((a, b) => b.score! - a.score!);

	return guidelines;
};

let defaultGuidelines: StaticGuideline[] = $state([]);
export function newGuidelineSet(graphSettings: GraphSettingsClass): Guideline[] {
	const newGuidelineSet = $state.snapshot(defaultGuidelines) as Guideline[];
	addGuidelineIDs(newGuidelineSet, graphSettings);
	addSourceToSettings(newGuidelineSet);

	return newGuidelineSet;
}

export function loadGuidelines() {
	// todo check format
	let guidelinesFromFile = guidelinesFile as StaticGuideline[];
	defaultGuidelines = structuredClone(guidelinesFromFile) as StaticGuideline[];
}
