<script lang="ts">
	import type { StringCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

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

<div class="w-full h-full" class:flex={editable} class:items-center={editable}>
	<div class="flex justify-between w-full">
		<div>
			{#if editable}
				<CustomSelect
					bind:selected={stringCondition.property}
					values={Object.keys(graphCharacteristics).filter(
						(key) => graphCharacteristics[key].type === 'string'
					)}
					width={100}
				/>
			{:else}
				<div class="uppercase">{stringCondition.property}</div>
			{/if}
		</div>
		{#if editable}
			<input type="string" placeholder="value" bind:value={stringCondition.value} />
		{:else}
			<div class="flex items-center">
				<div class="pr-1 font-bold">"{stringCondition.value}"</div>
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

<style>
	input {
		/* border-bottom: 1px solid #000; */
		font-size: 18px;
		text-align: right;
		/* font-style: italic; */
	}

	input::placeholder {
		font-style: italic;
		padding-right: 5px;
	}
</style>
