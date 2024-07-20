<script lang="ts">
	import type { BooleanCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		booleanCondition,
		weightedCondition
	}: { booleanCondition: BooleanCondition; weightedCondition: WeightedCondition } = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between w-full items-center">
		<div>
			<div>{booleanCondition.property}</div>
		</div>
		<div>
			{#if graphCharacteristics[booleanCondition.property].value === booleanCondition.value}
				<span class="material-symbols-outlined flex items-center"> check </span>
			{:else}
				<span class="material-symbols-outlined flex items-center"> close </span>
			{/if}
		</div>
	</div>
	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
</div>
