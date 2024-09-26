<script lang="ts">
	import { type WeightedCondition, isComposite } from '../utils/guideline.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import BooleanCondition from './BooleanCondition.svelte';
	import RangeCondition from './RangeCondition.svelte';
	import StringCondition from './StringCondition.svelte';
	import NumericCondition from './NumericCondition.svelte';
	import CompositeCondition from './CompositeCondition.svelte';
	import IconValueDisplay from './GUI/IconValueDisplay.svelte';
	import { hoverPopup } from './GUI/hoverPopup.svelte';

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
	<div class="flex items-center weight">
		<!-- <IconValueDisplay
			icon="scale"
			content={stringDisplay}
			data={weightedCondition.weight.toString()}
		/> -->
		<div
			class={editable ? 'weightEditable' : 'bubble'}
			use:hoverPopup={{ text: 'weight', position: 'right' }}
		>
			{#if editable}
				<input type="number" bind:value={weightedCondition.weight} min="1" />
			{:else}
				<div class="weightNumber">
					{weightedCondition.weight > 0 ? weightedCondition.weight : '!'}
				</div>
			{/if}
			<span class="material-symbols-outlined weight"> weight </span>
		</div>
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
	{#if editable}
		<div class="flex items-center">
			<button onclick={deleteFunction} class="buttonGeneral">
				<span class="material-symbols-outlined text-xs">close</span>
			</button>
		</div>
	{/if}
</div>

<style>
	:global(input) {
		background-color: transparent;
		user-select: none; /* Prevent text selection */
		outline: none; /* Remove the default outline */
	}

	input {
		width: 15px;
		padding: 0px;
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
		margin: 5px 6px 2px 0px;
		cursor: help;
	}

	.weightEditable {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		padding: 5px;
		margin: 5px 6px 2px 0px;
	}

	.weightEditable input {
		width: 30px;
		padding: 0px;
		font-size: 18px;
	}

	input {
		text-align: center;
		/* border-bottom: 1px solid black; */
		/* animation: blink 1s infinite; */
	}

	@keyframes blink {
		0% {
			border-bottom-color: #000;
		}
		50% {
			border-bottom-color: transparent;
		}
		100% {
			border-bottom-color: #000;
		}
	}

	/* Hide arrows for Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Hide arrows for Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
	}

	.buttonGeneral {
		margin: 3px;
	}

	span.weight {
		font-size: 15px;
		font-variation-settings: 'FILL' 1;
	}
</style>
