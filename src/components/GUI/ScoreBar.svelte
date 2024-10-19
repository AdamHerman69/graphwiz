<script lang="ts">
	import type { WeightedCondition } from '../../utils/guideline.svelte';
	import { getGradientColorAsString } from '../../utils/gradient';
	import type { Gradient } from '../../utils/graphSettings.svelte';
	import { formatDecimal } from '../../utils/helperFunctions';

	const gradient: Gradient = [
		[{ r: 133, g: 0, b: 100, a: 1 }, 0],
		[{ r: 58, g: 144, b: 209, a: 1 }, 0.5],
		[{ r: 51, g: 223, b: 120, a: 1 }, 1]
	];

	let {
		score,
		weightNormalized = 1,
		hidePercentage = false
	}: { score: number; weightNormalized: number; hidePercentage?: boolean } = $props();
</script>

<div class="container">
	<div class="progress-bar" style="width: {weightNormalized * 100}%">
		<div
			class="fill"
			style="width: {score * 100}%; background-color: {getGradientColorAsString(
				gradient,
				score
			)}; box-shadow: 0 0px 4px {getGradientColorAsString(gradient, score)};"
		></div>
	</div>
	{#if !hidePercentage}
		<div class="score">{formatDecimal(score * 100, 0)}%</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		display: flex;
		align-items: center;
	}
	.progress-bar {
		height: 8px;
		background-color: #eee;
		border-radius: 10px;
		box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
		/* overflow: hidden; */
	}
	.fill {
		height: 100%;
		border-radius: 10px;
	}

	.score {
		margin-left: 5px;
		font-size: 11px;
		font-style: italic;
	}
</style>
