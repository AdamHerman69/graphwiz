<script lang="ts">
	import type { StringCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		stringCondition,
		weightedCondition
	}: { stringCondition: StringCondition; weightedCondition: WeightedCondition } = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between">
		<div>
			<div>{stringCondition.property}</div>
		</div>
		<div class="flex items-center">
			<div class="pr-1">{stringCondition.value}</div>
			{#if graphCharacteristics[stringCondition.property].value === stringCondition.value}
				<span class="material-symbols-outlined text-xs"> check </span>
			{:else}
				<span class="material-symbols-outlined text-xs"> close </span>
			{/if}
		</div>
	</div>
	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
</div>
