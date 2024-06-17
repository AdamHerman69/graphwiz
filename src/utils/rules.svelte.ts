import { getAttributeValue, type Attribute, getEdgeSource, getEdgeTarget } from './graph.svelte';
import type Graph from 'graphology';

type RuleOperator = 'AND' | 'OR';

export type AtomicRule = {
	id: number;
	operator: '>' | '<' | '=' | '≥' | '≤'; // property always on the left side
	type: 'string' | 'number';
	target: 'node' | 'edge' | 'source' | 'target';
	property?: Attribute;
	value: number | string;
};

export type Rule = {
	id: number;
	operator: RuleOperator;
	rules: (Rule | AtomicRule)[];
};

export function isAtomic(rule: Rule | AtomicRule): boolean {
	return 'target' in rule;
}

function evalAtomicRule(rule: AtomicRule, id: string): boolean {
	if (rule.property === undefined) {
		return false;
	}

	if (rule.type === 'string') {
		return rule.value === getAttributeValue(id, rule.property);
	} else {
		let propertyValue: number;
		rule.value = Number(rule.value);

		// get the property from the appropriate target
		switch (rule.target) {
			case 'node':
				propertyValue = Number(getAttributeValue(id, rule.property));
				break;
			case 'edge':
				propertyValue = Number(getAttributeValue(id, rule.property));
				break;
			case 'source':
				propertyValue = Number(getAttributeValue(getEdgeSource(id), rule.property));
				break;
			case 'target':
				propertyValue = Number(getAttributeValue(getEdgeTarget(id), rule.property));
				break;
		}

		// evaluate the rule
		switch (rule.operator) {
			case '>':
				return propertyValue > rule.value;
			case '<':
				return propertyValue < rule.value;
			case '=':
				return propertyValue === rule.value;
			case '≥':
				return propertyValue >= rule.value;
			case '≤':
				return propertyValue <= rule.value;
		}
	}
}

export function evalRule(rule: Rule | AtomicRule, id: string): boolean {
	if (isAtomic(rule)) {
		return evalAtomicRule(rule as AtomicRule, id);
	}

	switch (rule.operator) {
		case 'AND':
			return rule.rules.every((r) => evalRule(r, id));
		case 'OR':
			return rule.rules.some((r) => evalRule(r, id));
		default:
			throw new Error('Invalid operator');
	}
}

export function stripAttributeBasedRules(rule: Rule | AtomicRule): void {
	if (isAtomic(rule)) {
		// shouldn't happen
		return;
	}

	(rule as Rule).rules = (rule as Rule).rules.filter((r) => {
		if (isAtomic(r)) {
			let isGeneral = (r as AtomicRule).property?.general;
			console.log(isGeneral);
			return (r as AtomicRule).property?.general;
		} else {
			console.log(r);
			stripAttributeBasedRules(r);
			return true;
		}
	});
}
