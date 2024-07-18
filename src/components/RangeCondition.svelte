<script lang="ts">
	import type { RangeCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';

	let {
		rangeCondition,
		weightedCondition
	}: { rangeCondition: RangeCondition; weightedCondition: WeightedCondition } = $props();
</script>

<div class="flex justify-between">
	<div>
		<div>{rangeCondition.property}</div>
		<div>
			<span class="material-symbols-outlined"> arrow_range </span>
			<div>{rangeCondition.min} - {rangeCondition.max}</div>
		</div>
	</div>
	<div>
		{graphCharacteristics[rangeCondition.property].value}
	</div>
</div>
<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
