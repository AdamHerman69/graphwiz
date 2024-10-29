import type Graph from 'graphology';
import {
	type NodeSettings,
	type EdgeSettings,
	type LayoutType,
	GraphSettingsClass,
	type LayoutSettings
} from './graphSettings.svelte';
import guidelinesFile from './guidelines.json';
import { graphCharacteristics } from './graph.svelte';
import { areRulesEqual } from './rules.svelte';
import { getCitationInfo, type Citation } from './citation.svelte';
import { assignIDsToRules } from './rules.svelte';
import { getGraph } from './graph.svelte';

export type GuidelineStatus = {
	applied: 'fully' | 'partially' | 'notApplied';
	conflicts: Conflict[];
};

export type Task = {
	name: string;
	description: string;
	icon?: string;
};

export let tasks = $state({
	tasks: [
		{ name: 'Path Finding', description: 'neco' },
		{ name: 'Cluster Detection', description: 'neco' },
		{ name: 'Other task', description: 'neco' }
	],
	selectedTask: { name: 'Path Finding', description: 'neco' }
});

export type Conflict = {
	type: 'layout' | 'nodeSetting' | 'edgeSetting';
	property?: string;
	index?: number;
	conflictingGuidelineId?: number;
	conflictingGuidelineName: string;
};

export type NumericCondition = {
	type: 'numeric';
	property: string;
	min?: number;
	max?: number;
	ideal?: number;
	tolerance?: number;
	logicalCondition?: LogicalCondition;
};

export type BooleanCondition = {
	type: 'boolean';
	property: string;
	value: boolean;
	logicalCondition?: LogicalCondition;
};

export type StringCondition = {
	type: 'string';
	property: string;
	value: boolean;
	logicalCondition?: LogicalCondition;
};

export type LogicalCondition = {
	type: 'logical';
	operator: 'and' | 'or';
	conditions: (BooleanCondition | StringCondition | LogicalCondition | RangeCondition)[];
	logicalCondition?: LogicalCondition;
};

export type RangeCondition = {
	type: 'range';
	property: string;
	min?: number;
	max?: number;
	logicalCondition?: LogicalCondition;
};

export type CompositeCondition = {
	type: 'composite';
	conditions: WeightedCondition[];
	logicalCondition?: LogicalCondition;
};

export function isComposite(condition: Condition): condition is CompositeCondition {
	return condition.type === 'composite';
}

export type Condition =
	| NumericCondition
	| BooleanCondition
	| StringCondition
	| CompositeCondition
	| LogicalCondition
	| RangeCondition;

export type WeightedCondition = {
	weight: number;
	weightNormalized?: number;
	score?: number;
	scoreWeighted?: number;
	condition: Condition;
	GUIID?: number;
};

export type StaticGuideline = {
	name: string;
	description: string;
	literature: string[]; // DOI
	rootCondition: WeightedCondition;
	recommendations: {
		layout?: LayoutSettings;
		edgeSettings?: EdgeSettings[];
		nodeSettings?: NodeSettings[];
		attributes?: { discrete: boolean; bind: { target: string; setting: string; name?: string }[] };
	};
};

export type Guideline = StaticGuideline & {
	id: number;
	score: number;
	status: GuidelineStatus;
	expanded: boolean;
	editedGuideline?: Guideline | null;
	parentDiv?: HTMLDivElement;
	imported?: boolean;
};

const normalizeWeights = (conditions: WeightedCondition[]): WeightedCondition[] => {
	const totalWeight = conditions.reduce((sum, wc) => (wc.weight === -1 ? sum : sum + wc.weight), 0);
	conditions.forEach((wc) => {
		if (wc.weight === -1) {
			wc.weightNormalized = 0; // Ultimate conditions don't contribute to normalized weight
		} else {
			wc.weightNormalized = wc.weight / totalWeight;
		}
	});

	return conditions;
};

const evaluateLogicalCondition = (condition: LogicalCondition): number => {
	const results = condition.conditions.map(evaluateCondition);
	if (condition.operator === 'and') {
		return results.every((result) => result === 1) ? 1 : 0;
	} else {
		return results.some((result) => result === 1) ? 1 : 0;
	}
};

const evaluateRangeCondition = (condition: RangeCondition): number => {
	const value = graphCharacteristics[condition.property].value as number;
	const minSatisfied = condition.min === undefined || value >= condition.min;
	const maxSatisfied = condition.max === undefined || value <= condition.max;
	return minSatisfied && maxSatisfied ? 1 : 0;
};

const evaluateNumericCondition = (condition: NumericCondition): number => {
	const value: number = graphCharacteristics[condition.property].value as number;

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
	return graphCharacteristics[condition.property].value === condition.value ? 1 : 0;
};

const evaluateBooleanCondition = (condition: BooleanCondition): number => {
	return graphCharacteristics[condition.property].value === condition.value ? 1 : 0;
};

const evaluateCompositeCondition = (condition: CompositeCondition): number => {
	const normalizedConditions = normalizeWeights(condition.conditions);

	// Check for ultimate conditions first
	const ultimateConditions = normalizedConditions.filter((wc) => wc.weight === -1);
	for (const ultimateCondition of ultimateConditions) {
		const score = evaluateCondition(ultimateCondition.condition);
		if (score === 0) {
			return 0; // Nullify all sibling conditions
		}
	}

	// If all ultimate conditions are satisfied, evaluate the rest
	return normalizedConditions.reduce((sum, wc) => {
		if (wc.weight === -1) {
			return sum; // Ultimate conditions don't contribute to the score
		}
		wc.score = evaluateCondition(wc.condition);
		wc.scoreWeighted = wc.score * wc.weightNormalized!;
		return sum + wc.scoreWeighted;
	}, 0);
};

const evaluateCondition = (condition: Condition): number => {
	let logicalConditionResult = 1;
	if (condition.logicalCondition) {
		logicalConditionResult = evaluateLogicalCondition(condition.logicalCondition);
	}

	switch (condition.type) {
		case 'numeric':
			return evaluateNumericCondition(condition) * logicalConditionResult;
		case 'boolean':
			return evaluateBooleanCondition(condition) * logicalConditionResult;
		case 'composite':
			return evaluateCompositeCondition(condition) * logicalConditionResult;
		case 'string':
			return evaluateStringCondition(condition) * logicalConditionResult;
		case 'logical':
			return evaluateLogicalCondition(condition) * logicalConditionResult;
		case 'range':
			return evaluateRangeCondition(condition) * logicalConditionResult;
		default:
			throw new Error('Invalid condition type');
	}
};

export function computeGuidelineStatuses(
	guidelines: Guideline[],
	graphSettings: GraphSettingsClass
): void {
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

	// Check layout type
	if (guideline.recommendations.layout?.type) {
		totalRecommendations++;
		if (
			graphSettings.graphSettings.layout.type.value ===
				guideline.recommendations.layout?.type.value &&
			graphSettings.graphSettings.layout.type.source === guideline.name
		) {
			appliedCount++;
		} else if (
			graphSettings.graphSettings.layout.type.source &&
			graphSettings.graphSettings.layout.type.source !== guideline.name
		) {
			status.conflicts.push({
				type: 'layout',
				conflictingGuidelineName: graphSettings.graphSettings.layout.type.source
			});
		}
	}

	// Check edge layout
	if (guideline.recommendations.layout?.edgeType) {
		totalRecommendations++;
		if (
			graphSettings.graphSettings.layout.edgeType.value ===
				guideline.recommendations.layout?.edgeType.value &&
			graphSettings.graphSettings.layout.edgeType.source === guideline.name
		) {
			appliedCount++;
		} else if (
			graphSettings.graphSettings.layout.edgeType.source &&
			graphSettings.graphSettings.layout.edgeType.source !== guideline.name
		) {
			status.conflicts.push({
				type: 'layout',
				conflictingGuidelineName: graphSettings.graphSettings.layout.edgeType.source
			});
		}
	}

	// Check node settings
	if (guideline.recommendations.nodeSettings) {
		appliedCount += checkSettings(
			guideline.recommendations.nodeSettings,
			graphSettings.graphSettings.nodeSettings,
			guideline.name,
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
			guideline.name,
			'edgeSetting',
			status.conflicts
		);
		totalRecommendations += countRecommendations(guideline.recommendations.edgeSettings);
	}

	// Determine application status
	if (appliedCount === totalRecommendations && totalRecommendations > 0) {
		status.applied = 'fully';
	} else if (appliedCount > 0) {
		status.applied = 'partially';
	}

	//console.log(guideline.name, appliedCount, totalRecommendations, status);

	return status;
}

// helper function to check Settings if guideline is applied
function checkSettings(
	recommendedSettings: (NodeSettings | EdgeSettings)[],
	currentSettings: (NodeSettings | EdgeSettings)[],
	guidelineName: string,
	settingType: 'nodeSetting' | 'edgeSetting',
	conflicts: Conflict[]
): number {
	let appliedCount = 0;

	// Check global settings (index 0)
	if (recommendedSettings[0] && currentSettings[0]) {
		appliedCount += checkProperties(
			recommendedSettings[0],
			currentSettings[0],
			guidelineName,
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

		if (currentSetting) {
			if (currentSetting.source === guidelineName) {
				appliedCount++;
			} else if (currentSetting.source) {
				conflicts.push({
					type: settingType,
					index: i,
					conflictingGuidelineName: currentSetting.source
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
	guidelineName: string,
	settingType: 'nodeSetting' | 'edgeSetting',
	index: number,
	conflicts: Conflict[]
): number {
	let appliedCount = 0;

	for (const [key, value] of Object.entries(recommended)) {
		if (key !== 'id' && key !== 'priority' && key !== 'rule' && key !== 'source') {
			const currentValue = current[key] as Setting<any>;
			if (currentValue) {
				if (currentValue.source === guidelineName) {
					appliedCount++;
				} else if (currentValue.source) {
					conflicts.push({
						type: settingType,
						property: key,
						index: index,
						conflictingGuidelineName: currentValue.source
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
	addSource(guideline);
	graphSettings.applyGuideline(
		guideline.recommendations.layout,
		guideline.recommendations.nodeSettings,
		guideline.recommendations.edgeSettings,
		guideline.recommendations.attributes
	);
}

function addSource(guideline: Guideline) {
	if (guideline.recommendations.layout?.type)
		guideline.recommendations.layout.type.source = guideline.name;
	if (guideline.recommendations.layout?.edgeType)
		guideline.recommendations.layout.edgeType.source = guideline.name;

	guideline.recommendations.nodeSettings?.forEach((nodeSetting: NodeSettings) => {
		nodeSetting.source = guideline.name;
		if (nodeSetting.shape) nodeSetting.shape.source = guideline.name;
		if (nodeSetting.size) nodeSetting.size.source = guideline.name;
		if (nodeSetting.color) nodeSetting.color.source = guideline.name;
		if (nodeSetting.strokeWidth) nodeSetting.strokeWidth.source = guideline.name;
		if (nodeSetting.strokeColor) nodeSetting.strokeColor.source = guideline.name;
		if (nodeSetting.labels)
			nodeSetting.labels.forEach((label) => {
				label.source = guideline.name;
			});
	});

	guideline.recommendations.edgeSettings?.forEach((edgeSetting) => {
		edgeSetting.source = guideline.name;
		if (edgeSetting.type) edgeSetting.type.source = guideline.name;
		if (edgeSetting.color) edgeSetting.color.source = guideline.name;
		if (edgeSetting.width) edgeSetting.width.source = guideline.name;
		if (edgeSetting.partialStart) edgeSetting.partialStart.source = guideline.name;
		if (edgeSetting.partialEnd) edgeSetting.partialEnd.source = guideline.name;
		if (edgeSetting.decorators)
			edgeSetting.decorators.value.forEach((decorator) => {
				decorator.source = guideline.name;
			});
		if (edgeSetting.decorators) edgeSetting.decorators.source = guideline.name;
		if (edgeSetting.labels)
			edgeSetting.labels.forEach((label) => {
				label.source = guideline.name;
			});
	});
}

function addSourceToSettings(guidelines: Guideline[]): void {
	guidelines.forEach((guideline) => {
		addSource(guideline);
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
		guideline.recommendations.nodeSettings?.forEach((nodeSetting) => {
			nodeSetting.id = graphSettings.newGUIID();
			if (nodeSetting.rule) assignIDsToRules(nodeSetting.rule, graphSettings.newGUIID);
		});
		guideline.recommendations.edgeSettings?.forEach((edgeSetting) => {
			edgeSetting.id = graphSettings.newGUIID();
			if (edgeSetting.rule) assignIDsToRules(edgeSetting.rule, graphSettings.newGUIID);
		});
	});
}

export const calculateApplicability = (guideline: Guideline): number => {
	guideline.score = evaluateCondition(guideline.rootCondition.condition);
	return guideline.score;
};

export const sortGuidelines = (guidelines: Guideline[], graph: Graph): Guideline[] => {
	guidelines.forEach((guideline) => {
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

	newGuidelineSet.forEach((guideline) => {
		guideline.expanded = false;
	});

	guidelineArray = newGuidelineSet;

	return newGuidelineSet;
}

// TODO refactor into a file and import
let guidelineArray: Guideline[] = $state([]);
// export let graph = $state(graphObject);
export function getGuidelines(): Guideline[] {
	return guidelineArray;
}

export async function loadGuidelines(newGUIID: () => number) {
	// todo check format
	let guidelinesFromFile = guidelinesFile as StaticGuideline[];
	defaultGuidelines = structuredClone(guidelinesFromFile) as StaticGuideline[];
	for (let guideline of defaultGuidelines) {
		assignGUIIDsToConditions(guideline.rootCondition, newGUIID);
		await Promise.all(guideline.literature.map((doi) => getCitationInfo(doi)));
	}
}

export function assignGUIIDsToConditions(
	weightedCondition: WeightedCondition,
	newGUIID: () => number
): void {
	weightedCondition.GUIID = newGUIID();

	const assignGUIIDsRecursively = (condition: Condition) => {
		switch (condition.type) {
			case 'composite':
				condition.conditions.forEach((subCondition) =>
					assignGUIIDsToConditions(subCondition, newGUIID)
				);
				break;
			case 'logical':
				condition.conditions.forEach(assignGUIIDsRecursively);
				break;
		}

		if (condition.logicalCondition) {
			assignGUIIDsRecursively(condition.logicalCondition);
		}
	};

	assignGUIIDsRecursively(weightedCondition.condition);
}

export function toStaticGuideline(guideline: Guideline): StaticGuideline {
	return {
		name: guideline.name,
		description: guideline.description,
		literature: $state.snapshot(guideline.literature),
		rootCondition: $state.snapshot(guideline.rootCondition),
		recommendations: $state.snapshot(guideline.recommendations)
	};
}

export function toStaticGuidelines(guidelines: Guideline[]): StaticGuideline[] {
	return guidelines.map(toStaticGuideline);
}

export async function importGuidelines(guidelines: StaticGuideline[], newGUIID: () => number) {
	for (let guideline of defaultGuidelines) {
		assignGUIIDsToConditions(guideline.rootCondition, newGUIID);
		addSourceToSettings(guidelines as Guideline[]);
		await Promise.all(guideline.literature.map((doi) => getCitationInfo(doi)));
	}
	getGuidelines().push(...(guidelines as Guideline[]));
	sortGuidelines(getGuidelines(), getGraph());
}

// todo doesn't work because of gui IDs
export function isEdited(guideline: Guideline): boolean {
	if (!guideline.editedGuideline) {
		return false;
	}

	const originalGuideline = toStaticGuideline(guideline);
	const editedGuideline = toStaticGuideline(guideline.editedGuideline);

	console.log(originalGuideline);
	console.log(editedGuideline);

	return JSON.stringify(originalGuideline) !== JSON.stringify(editedGuideline);
}
