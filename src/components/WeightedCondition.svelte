<script lang="ts">
	import { type WeightedCondition, isComposite } from '../utils/guideline.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import BooleanCondition from './BooleanCondition.svelte';
	import RangeCondition from './RangeCondition.svelte';
	import StringCondition from './StringCondition.svelte';
	import NumericCondition from './NumericCondition.svelte';
	import CompositeCondition from './CompositeCondition.svelte';

	let {
		weightedCondition = $bindable(),
		editable = false,
		deleteFunction = undefined
	}: {
		weightedCondition: WeightedCondition;
		editable: boolean;
		deleteFunction?: () => void;
	} = $props();
	let collapsed = $state(true);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="flex mb-1">
	<div class="pr-4 flex items-center">
		<span class="material-symbols-outlined text-xs"> scale </span>
		{#if editable}
			<input type="number" bind:value={weightedCondition.weight} min="1" />
			<button onclick={deleteFunction}>
				<span class="material-symbols-outlined text-xs">close</span>
			</button>
		{:else}
			<div>{weightedCondition.weight}</div>
		{/if}
	</div>
	<div class="flex-1 py-1">
		{#if weightedCondition.condition.type === 'boolean'}
			<BooleanCondition
				bind:booleanCondition={weightedCondition.condition}
				{weightedCondition}
				{editable}
			/>
		{:else if weightedCondition.condition.type === 'range'}
			<RangeCondition
				bind:rangeCondition={weightedCondition.condition}
				{weightedCondition}
				{editable}
			/>
		{:else if weightedCondition.condition.type === 'string'}
			<StringCondition
				bind:stringCondition={weightedCondition.condition}
				{weightedCondition}
				{editable}
			/>
		{:else if weightedCondition.condition.type === 'numeric'}
			<NumericCondition
				bind:numericCondition={weightedCondition.condition}
				{weightedCondition}
				{editable}
			/>
		{:else if weightedCondition.condition.type === 'composite'}
			<CompositeCondition
				bind:compositeCondition={weightedCondition.condition}
				{weightedCondition}
				{editable}
			/>
		{/if}
	</div>
</div>

<style>
	:global(input) {
		background-color: transparent;
		user-select: none; /* Prevent text selection */
		outline: none; /* Remove the default outline */
	}

	input {
		width: 30px;
		padding: 5px;
	}

	:global(select) {
		background-color: transparent;
		user-select: none; /* Prevent text selection */
		outline: none; /* Remove the default outline */
	}
</style>
