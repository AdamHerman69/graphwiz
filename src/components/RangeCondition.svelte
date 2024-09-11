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

<div class="flex justify-between items-center">
	<div>
		{#if editable}
			<select bind:value={rangeCondition.property} class="w-1/2">
				{#each Object.entries(graphCharacteristics).filter(([key, value]) => value.type === 'number') as characteristicKVP}
					<option value={characteristicKVP[0]}>{characteristicKVP[0]}</option>
				{/each}
			</select>
		{:else}
			<div class="uppercase">{rangeCondition.property}</div>
			<span class="material-symbols-outlined">
				{graphCharacteristics[rangeCondition.property]?.value as number>= rangeCondition.min! &&
				graphCharacteristics[rangeCondition.property]?.value as number <= rangeCondition.max!
					? 'check'
					: 'close'}
			</span>
		{/if}
		<div>
			<span class="material-symbols-outlined"> arrow_range </span>
			{#if editable}
				<input type="number" class="w-1/4" bind:value={rangeCondition.min} /> -
				<input type="number" class="w-1/4" bind:value={rangeCondition.max} />
			{:else}
				<div>{rangeCondition.min} - {rangeCondition.max}</div>
			{/if}
		</div>
	</div>
	{#if !editable}
		<div>
			{formatDecimal(graphCharacteristics[rangeCondition.property].value as number, 2)}
		</div>
	{/if}
</div>
{#if !editable}
	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
{/if}
