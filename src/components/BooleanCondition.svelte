<script lang="ts">
	import type { BooleanCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

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

<div class="w-full h-full" class:flex={editable} class:items-center={editable}>
	<div class="flex justify-between w-full items-center">
		<div>
			{#if editable}
				<CustomSelect
					bind:selected={booleanCondition.property}
					values={Object.keys(graphCharacteristics).filter(
						(key) => graphCharacteristics[key].type === 'boolean'
					)}
					width={100}
				/>
			{:else}
				<div class="uppercase">{booleanCondition.property}</div>
			{/if}
		</div>
		<div>
			{#if editable}
				<CustomSelect bind:selected={booleanCondition.value} values={[true, false]} width={80} />
			{:else if graphCharacteristics[booleanCondition.property].value === booleanCondition.value}
				<span class="check material-symbols-outlined flex items-center"> check </span>
			{:else}
				<span class="check material-symbols-outlined flex items-center"> close </span>
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

<style>
	span.check {
		font-size: 15px;
	}
</style>
