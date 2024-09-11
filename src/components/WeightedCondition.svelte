<script lang="ts">
	import { type WeightedCondition, isComposite } from '../utils/guideline.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import BooleanCondition from './BooleanCondition.svelte';
	import RangeCondition from './RangeCondition.svelte';
	import StringCondition from './StringCondition.svelte';
	import NumericCondition from './NumericCondition.svelte';
	import CompositeCondition from './CompositeCondition.svelte';
	import IconValueDisplay from './GUI/IconValueDisplay.svelte';

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

{#snippet stringDisplay(text: string)}
	{text}
{/snippet}

<div class="flex mb-1 w-full">
	<div class="pr-4 flex items-center weight">
		<!-- <IconValueDisplay
			icon="scale"
			content={stringDisplay}
			data={weightedCondition.weight.toString()}
		/> -->
		<div class="bubble">
			{#if editable}
				<input type="number" bind:value={weightedCondition.weight} min="1" />
			{:else}
				<div class="weightNumber">{weightedCondition.weight}</div>
			{/if}
			<span class="material-symbols-outlined"> scale </span>
			{#if editable}
				<button onclick={deleteFunction}>
					<span class="material-symbols-outlined text-xs">close</span>
				</button>
			{/if}
		</div>
	</div>
	<div class="flex-1 py-1 w-full">
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
		width: 40px;
		padding: 5px;
	}

	:global(select) {
		background-color: transparent;
		user-select: none; /* Prevent text selection */
		outline: none; /* Remove the default outline */
	}

	.weight span {
		font-size: 16px;
	}

	.weight .weightNumber {
		font-size: 15px;
		font-weight: bold;
	}

	.weight .bubble {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		padding: 5px;
		margin: 5px 0px 2px 0px;
	}
</style>
