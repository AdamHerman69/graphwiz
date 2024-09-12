<script lang="ts">
	import type { RangeCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import { formatDecimal } from '../utils/helperFunctions';

	let {
		rangeCondition = $bindable(),
		weightedCondition,
		editable = false
	}: {
		rangeCondition: RangeCondition;
		weightedCondition: WeightedCondition;
		editable?: boolean;
	} = $props();
</script>

<div class="flex justify-between">
	<div class="flex-1">
		{#if editable}
			<select bind:value={rangeCondition.property} class="w-1/2">
				{#each Object.entries(graphCharacteristics).filter(([key, value]) => value.type === 'number') as characteristicKVP}
					<option value={characteristicKVP[0]}>{characteristicKVP[0]}</option>
				{/each}
			</select>
		{:else}
			<div class="uppercase">{rangeCondition.property}</div>
		{/if}
		<div class="flex">
			<!-- <span class="material-symbols-outlined"> arrow_range </span> -->
			<div class="valueLabel">range:</div>
			{#if editable}
				<input type="number" class="w-1/4" bind:value={rangeCondition.min} /> -
				<input type="number" class="w-1/4" bind:value={rangeCondition.max} />
			{:else}
				<div class="font-bold">{rangeCondition.min} - {rangeCondition.max}</div>
			{/if}
		</div>
	</div>
	{#if !editable}
		<div>
			<div class="flex items-center font-bold">
				<div class="font-bold flex align-middle justify-center mr-1">
					{formatDecimal(graphCharacteristics[rangeCondition.property].value as number, 2)}
				</div>
				<span class="check material-symbols-outlined">
					{graphCharacteristics[rangeCondition.property]?.value as number>= rangeCondition.min! &&
				graphCharacteristics[rangeCondition.property]?.value as number <= rangeCondition.max!
					? 'check'
					: 'close'}
				</span>
			</div>
		</div>
	{/if}
</div>
{#if !editable}
	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
{/if}

<style>
	.valueLabel {
		font-size: 14px;
		margin-right: 5px;
		font-style: italic;
	}

	span.check {
		font-size: 15px;
	}
</style>
