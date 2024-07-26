<script lang="ts">
	import { type WeightedCondition, isComposite } from '../utils/guideline.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import BooleanCondition from './BooleanCondition.svelte';
	import RangeCondition from './RangeCondition.svelte';
	import StringCondition from './StringCondition.svelte';
	import NumericCondition from './NumericCondition.svelte';
	import CompositeCondition from './CompositeCondition.svelte';

	let { weightedCondition }: { weightedCondition: WeightedCondition } = $props();
	let collapsed = $state(true);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="flex mb-1">
	<div class="pr-4 flex items-center">
		<span class="material-symbols-outlined text-xs"> scale </span>
		<div>{weightedCondition.weight}</div>
	</div>
	<div class="flex-1 py-1">
		{#if weightedCondition.condition.type === 'boolean'}
			<BooleanCondition booleanCondition={weightedCondition.condition} {weightedCondition} />
		{:else if weightedCondition.condition.type === 'range'}
			<RangeCondition rangeCondition={weightedCondition.condition} {weightedCondition} />
		{:else if weightedCondition.condition.type === 'string'}
			<StringCondition stringCondition={weightedCondition.condition} {weightedCondition} />
		{:else if weightedCondition.condition.type === 'numeric'}
			<NumericCondition numericCondition={weightedCondition.condition} {weightedCondition} />
		{:else if weightedCondition.condition.type === 'composite'}
			<CompositeCondition compositeCondition={weightedCondition.condition} {weightedCondition} />
		{/if}
	</div>
</div>
<!-- 
<div class="flex justify-between">
	<div>
		<div>
			{#if isComposite(condition)}
				composite
			{:else}
				{weightedCondition.condition.property!}
			{/if}
		</div>
        <div>
            {#if }
        </div>
	</div>

	<div class="flex">
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> scale </span>
			{weightedCondition.scoreWeighted?.toFixed(2)}
		</div>
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> weight </span>
			{weightedCondition.weight}
		</div>
		<div class="text-sm flex justify-center align-middle">
			<span class="material-symbols-outlined"> readiness_score </span>
			{weightedCondition.score?.toFixed(2)}
		</div>

		{#if isComposite(condition)}
			<button onclick={toggleCollapse}>
				<span class="material-symbols-outlined">
					{collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
				</span>
			</button>
		{/if}
	</div>
</div>
{#if !collapsed}
	<div class="flex">
		<span class="material-symbols-outlined"> subdirectory_arrow_right </span>
		<div class="flex-1">
			{#each condition.conditions as wc}
				<div>
					<svelte:self weightedCondition={wc} />
				</div>
			{/each}
		</div>
	</div>
{/if} -->
