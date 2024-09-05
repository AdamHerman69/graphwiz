<script lang="ts">
	import type { BooleanCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		booleanCondition = $bindable(),
		weightedCondition,
		editable = false
	}: {
		booleanCondition: BooleanCondition;
		weightedCondition: WeightedCondition;
		editable: boolean;
	} = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between w-full items-center">
		<div>
			{#if editable}
				<select bind:value={booleanCondition.property} class="w-1/2">
					{#each Object.entries(graphCharacteristics).filter(([key, value]) => value.type === 'boolean') as characteristicKVP}
						<option value={characteristicKVP[0]}>{characteristicKVP[0]}</option>
					{/each}
				</select>
			{:else}
				<div>{booleanCondition.property}</div>
			{/if}
		</div>
		<div>
			{#if editable}
				<select bind:value={booleanCondition.value}>
					<option selected value={true}>true</option>
					<option value={false}>false</option>
				</select>
			{:else if graphCharacteristics[booleanCondition.property].value === booleanCondition.value}
				<span class="material-symbols-outlined flex items-center"> check </span>
			{:else}
				<span class="material-symbols-outlined flex items-center"> close </span>
			{/if}
		</div>
	</div>
	{#if !editable}
		<ScoreBar
			score={weightedCondition.score}
			weightNormalized={weightedCondition.weightNormalized}
		/>
	{/if}
</div>
