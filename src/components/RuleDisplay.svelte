<script lang="ts">
	import type { Rule } from '../utils/rules.svelte';
	import { isAtomic, type AtomicRule } from '../utils/rules.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import ToggleSwitch from './GUI/ToggleSwitch.svelte';
	import NodeRule from './NodeRule.svelte';
	import EdgeRule from './EdgeRule.svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { getContext } from 'svelte';

	let { rule, type }: { rule: Rule; type: 'node' | 'edge' } = $props();

	let owner = getContext('type');
</script>

<div class="labelContainer">
	<div class="absolute left-1/2 transform -translate-x-1/2 mt-1">
		<!-- <RadialSelector bind:selected={rule.operator} options={['AND', 'OR']} width={45} /> -->
		<ToggleSwitch bind:selected={rule.operator} disabled={true} />
	</div>
	<div class="absolute right-2"></div>

	<div class="mt-8" use:autoAnimate={{ duration: 300 }}>
		{#each rule.rules as subRule, index}
			{#if isAtomic(subRule)}
				<div class="flex w-full">
					<!-- TODO: combine node rule and edgeRule to one component, have adjecent edges optional -->
					{#if type === 'edge'}
						<!-- <EdgeRule2 bind:rule={rule.rules[index]} /> -->
						<EdgeRule rule={subRule as AtomicRule} disabled={true} />
					{:else}
						<!-- <NodeRule2 bind:rule={rule.rules[index]} /> -->
						<NodeRule rule={subRule as AtomicRule} disabled={true} />
					{/if}
				</div>
			{:else}
				<div class="ml-auto my-1 mx-1">
					<svelte:self rule={rule.rules[index]} {type} thisIndex={index} />
				</div>
			{/if}
			<div class={`${index < rule.rules.length - 1 ? 'border-b border-gray-200' : ''}`} />
		{/each}
	</div>
</div>

<style>
	.labelContainer {
		padding: 4px 8px;
	}
</style>
