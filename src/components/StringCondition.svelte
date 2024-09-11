<script lang="ts">
	import type { StringCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		stringCondition = $bindable(),
		weightedCondition,
		editable = false
	}: {
		stringCondition: StringCondition;
		weightedCondition: WeightedCondition;
		editable?: boolean;
	} = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between">
		<div>
			{#if editable}
				<select bind:value={stringCondition.property} class="w-1/2">
					{#each Object.entries(graphCharacteristics).filter(([key, value]) => value.type === 'string') as characteristicKVP}
						<option value={characteristicKVP[0]}>{characteristicKVP[0]}</option>
					{/each}
				</select>
			{:else}
				<div class="uppercase">{stringCondition.property}</div>
			{/if}
		</div>
		{#if editable}
			<input type="string" class="w-1/2" bind:value={stringCondition.value} />
		{:else}
			<div class="flex items-center">
				<div class="pr-1">{stringCondition.value}</div>
				{#if graphCharacteristics[stringCondition.property].value === stringCondition.value}
					<span class="material-symbols-outlined text-xs"> check </span>
				{:else}
					<span class="material-symbols-outlined text-xs"> close </span>
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
