import type { Attribute } from './graph.svelte';

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
