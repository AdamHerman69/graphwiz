<script lang="ts">
	import type { NumericCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import { formatDecimal } from '../utils/helperFunctions';

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
	<div class="flex justify-between w-full">
		<div class="flex-col">
			{#if editable}
				<select bind:value={numericCondition.property} class="w-1/2">
					{#each Object.entries(graphCharacteristics).filter(([key, value]) => value.type === 'number') as characteristicKVP}
						<option value={characteristicKVP[0]}>{characteristicKVP[0]}</option>
					{/each}
				</select>
			{:else}
				<div>{numericCondition.property}</div>
			{/if}

			{#if editable}
				<div class="mr-2 w-full">
					<span class="material-symbols-outlined"> arrow_range </span>
					<input
						type="number"
						class="w-1/4"
						bind:value={numericCondition.min}
						disabled={numericCondition.ideal && numericCondition.tolerance}
					/>
					-
					<input
						type="number"
						class="w-1/4"
						bind:value={numericCondition.max}
						disabled={numericCondition.ideal && numericCondition.tolerance}
					/>
				</div>
				<div class="flex mr-2 w-full">
					<span class="material-symbols-outlined"> pin_drop </span>
					<input type="number" class="w-1/4" bind:value={numericCondition.ideal} />
				</div>
				<div class="flex mr-2 w-full">
					<span class="material-symbols-outlined"> arrow_range </span>
					<input
						type="number"
						class="w-1/4"
						bind:value={numericCondition.tolerance}
						disabled={numericCondition.min && numericCondition.max}
					/>
				</div>
			{:else}
				<div class="flex">
					{#if typeof numericCondition.min === 'number' && typeof numericCondition.max === 'number'}
						<div class="flex mr-2">
							<span class="material-symbols-outlined"> arrow_range </span>
							<div class="flex items-center">{numericCondition.min} - {numericCondition.max}</div>
						</div>
					{/if}
					{#if typeof numericCondition.ideal === 'number'}
						<div class="flex mr-2">
							<div class="flex">
								<span class="material-symbols-outlined"> pin_drop </span>
								<div class="flex items-center">{numericCondition.ideal}</div>
							</div>
						</div>
					{/if}
					{#if typeof numericCondition.tolerance === 'number'}
						<div class="flex mr-2">
							<span class="material-symbols-outlined"> arrow_range </span>
							<div class="flex items-center">{numericCondition.tolerance}</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
		{#if !editable}
			<div>
				{formatDecimal(graphCharacteristics[numericCondition.property].value as number, 2)}
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
