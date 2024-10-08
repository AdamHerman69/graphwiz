<script lang="ts">
	import type { NumericCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import { formatDecimal } from '../utils/helperFunctions';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let {
		numericCondition = $bindable(),
		weightedCondition,
		editable = false
	}: {
		numericCondition: NumericCondition;
		weightedCondition: WeightedCondition;
		editable?: boolean;
	} = $props();
</script>

<div class="flex-col w-full">
	<div class="flex-col">
		<div class="flex justify-between w-full">
			{#if editable}
				<CustomSelect
					bind:selected={numericCondition.property}
					values={Object.keys(graphCharacteristics).filter(
						(key) => graphCharacteristics[key].type === 'number'
					)}
					width={150}
				/>
			{:else}
				<div class="uppercase">{numericCondition.property}</div>
			{/if}
			{#if !editable}
				<div class="font-bold">
					{formatDecimal(graphCharacteristics[numericCondition.property].value as number, 2)}
				</div>
			{/if}
		</div>

		{#if editable}
			<div class="flex mr-2 w-full">
				<!-- <span class="material-symbols-outlined"> arrow_range </span> -->
				<label class="valueLabel" for="min">min:</label>
				<input
					id="min"
					type="number"
					class="valueLabel"
					bind:value={numericCondition.min}
					placeholder="min"
					disabled={numericCondition.ideal && numericCondition.tolerance}
				/>
				<label class="valueLabel" for="max">max:</label>
				<input
					id="max"
					type="number"
					class="valueLabel"
					placeholder="max"
					bind:value={numericCondition.max}
					disabled={numericCondition.ideal && numericCondition.tolerance}
				/>
			</div>
			<div class="flex mr-2 w-full">
				<!-- <span class="material-symbols-outlined"> pin_drop </span> -->
				<div class="valueLabel">ideal:</div>

				<input type="number" class="flex-1" bind:value={numericCondition.ideal} />
			</div>
			<div class="flex mr-2 w-full">
				<!-- <span class="material-symbols-outlined"> arrow_range </span> -->
				<div class="valueLabel">tolerance:</div>
				<input
					type="number"
					class="flex-1"
					bind:value={numericCondition.tolerance}
					disabled={numericCondition.min && numericCondition.max}
				/>
			</div>
		{:else}
			<div class="flex">
				{#if typeof numericCondition.min === 'number' && typeof numericCondition.max === 'number'}
					<div class="flex mr-2">
						<!-- <span class="material-symbols-outlined"> arrow_range </span> -->
						<div class="valueLabel">range:</div>
						<div class="flex items-center font-bold">
							{numericCondition.min} - {numericCondition.max}
						</div>
					</div>
				{/if}
				{#if typeof numericCondition.ideal === 'number'}
					<div class="flex mr-2">
						<div class="flex">
							<!-- <span class="material-symbols-outlined"> pin_drop </span> -->
							<div class="valueLabel">ideal:</div>

							<div class="flex items-center font-bold">{numericCondition.ideal}</div>
						</div>
					</div>
				{/if}
				{#if typeof numericCondition.tolerance === 'number'}
					<div class="flex mr-2">
						<!-- <span class="material-symbols-outlined"> arrow_range </span> -->
						<div class="valueLabel">tolerance:</div>
						<div class="flex items-center font-bold">{numericCondition.tolerance}</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if !editable}
		<ScoreBar
			score={weightedCondition.score}
			weightNormalized={weightedCondition.weightNormalized}
		/>
	{/if}
</div>

<style>
	span {
		font-size: 18px;
	}

	.valueLabel {
		font-size: 14px;
		margin-right: 5px;
		font-style: italic;
	}

	input {
		border: none;
		/* border-bottom: 1px solid #000; */
		padding: 0px;
		text-align: center;
	}
</style>
