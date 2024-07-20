<script lang="ts">
	import type { RangeCondition, WeightedCondition } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import { formatDecimal } from '../utils/helperFunctions';

	let {
		rangeCondition,
		weightedCondition
	}: { rangeCondition: RangeCondition; weightedCondition: WeightedCondition } = $props();
</script>

<div class="flex justify-between items-center">
	<div>
		<div class="font-bold">{rangeCondition.property}</div>
		<div>
			<span class="material-symbols-outlined"> arrow_range </span>
			<div>{rangeCondition.min} - {rangeCondition.max}</div>
		</div>
	</div>
	<div>
		{formatDecimal(graphCharacteristics[rangeCondition.property].value as number, 2)}
	</div>
</div>
<ScoreBar score={weightedCondition.score} weightNormalized={weightedCondition.weightNormalized} />
