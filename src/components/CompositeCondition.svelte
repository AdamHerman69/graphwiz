<script lang="ts">
	import type {
		CompositeCondition,
		WeightedCondition as wCondition
	} from '../utils/guideline.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		compositeCondition,
		weightedCondition
	}: { compositeCondition: CompositeCondition; weightedCondition: wCondition } = $props();
</script>

<div class="flex-col w-full">
	<div class="flex justify-between">
		<div>
			<div>composite</div>
		</div>
	</div>

	<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
	{#each compositeCondition.conditions as wc}
		<WeightedCondition weightedCondition={wc} />
	{/each}
</div>
