<script lang="ts">
	import type { Rule } from '../utils/rules.svelte';
	import { isAtomic, type AtomicRule } from '../utils/rules.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import ToggleSwitch from './GUI/ToggleSwitch.svelte';
	import NodeRule from './NodeRule.svelte';
	import EdgeRule from './EdgeRule.svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { getContext } from 'svelte';

	let newGUIID = getContext('graphSettings').newGUIID;
	let isGuidelineEditor = getContext('isGuidelineEditor');

	let {
		rule,
		type,
		deleteFunction = undefined
	}: { rule: Rule; type: 'node' | 'edge'; deleteFunction: (() => void) | undefined } = $props();

	let owner = getContext('type');

	function addAtomicRule() {
		rule.rules.push({
			id: newGUIID(),
			operator: '>',
			type: 'number',
			target: type,
			value: 0,
			property: availableAttributes.filter(
				(attribute) => attribute.owner === owner && attribute.general === isGuidelineEditor
			)[0]
		});
	}

	function addNestedRule() {
		// new
		rule.rules.push({
			id: newGUIID(),
			operator: 'AND',
			rules: []
		});
	}

	function deleteRule(index: number) {
		rule.rules.splice(index, 1);
	}
</script>

<div class="labelContainer p-1">
	<div class="absolute left-1/2 transform -translate-x-1/2 mt-1">
		<!-- <RadialSelector bind:selected={rule.operator} options={['AND', 'OR']} width={45} /> -->
		<ToggleSwitch bind:selected={rule.operator} />
	</div>
	<div class="mt-6" use:autoAnimate={{ duration: 300 }}>
		{#each rule.rules as subRule, index (subRule.id)}
			{#if isAtomic(subRule)}
				<div class="flex">
					<!-- TODO: combine node rule and edgeRule to one component, have adjecent edges optional -->
					{#if type === 'edge'}
						<!-- <EdgeRule2 bind:rule={rule.rules[index]} /> -->
						<EdgeRule rule={subRule as AtomicRule} />
					{:else}
						<!-- <NodeRule2 bind:rule={rule.rules[index]} /> -->
						<NodeRule rule={subRule as AtomicRule} />
					{/if}

					<!-- Delete button -->
					<button
						id={index.toString()}
						class="ml-auto flex items-center mr-1"
						onclick={(event) => {
							rule.rules.splice(parseInt(event.currentTarget.id), 1);
						}}
					>
						<span class="material-symbols-outlined" style="font-size: 14px"> close </span>
					</button>
				</div>
			{:else}
				<svelte:self
					rule={rule.rules[index]}
					{type}
					thisIndex={index}
					deleteFunction={() => deleteRule(index)}
				/>
			{/if}
		{/each}
	</div>

	<div class="flex">
		<button class="buttonSmall" onclick={addAtomicRule}
			><span class="material-symbols-outlined" style="font-size: 16px;"> add </span></button
		>
		<button class="buttonSmall" onclick={addNestedRule}
			><span class="material-symbols-outlined" style="font-size: 16px;">
				subdirectory_arrow_right
			</span></button
		>
		{#if deleteFunction !== undefined}
			<div class="flex justify-end w-full">
				<button class="buttonSmall" onclick={deleteFunction}>
					<span class="material-symbols-outlined" style="font-size: 16px;"> close </span>
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.buttonSmall {
		font-size: 14px;
		padding: 4px 4px 0px 4px;
	}
</style>
