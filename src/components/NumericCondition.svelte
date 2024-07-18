<script lang="ts">
	import type { NumericCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		numericCondition,
		weightedCondition
	}: { numericCondition: NumericCondition; weightedCondition: WeightedCondition } = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between w-full">
		<div class="flex-col">
			<div>{numericCondition.property}</div>
			<div class="flex">
				{#if typeof numericCondition.min === 'number' && typeof numericCondition.max === 'number'}
					<div class="flex">
						<span class="material-symbols-outlined"> arrow_range </span>
						<div>{numericCondition.min} - {numericCondition.max}</div>
					</div>
				{/if}
				{#if typeof numericCondition.ideal === 'number'}
					<div class="flex">
						<div class="flex">
							<span class="material-symbols-outlined"> pin_drop </span>
							<div>{numericCondition.ideal}</div>
						</div>
					</div>
				{/if}
				{#if typeof numericCondition.tolerance === 'number'}
					<div class="flex">
						<span class="material-symbols-outlined"> arrow_range </span>
						<div>{numericCondition.tolerance}</div>
					</div>
				{/if}
			</div>
		</div>
		<div>
			{graphCharacteristics[numericCondition.property].value}
		</div>
	</div>
	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
</div>
