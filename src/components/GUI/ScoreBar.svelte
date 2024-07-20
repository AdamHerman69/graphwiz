<script lang="ts">
	import type { WeightedCondition } from '../../utils/guideline.svelte';
	import { getGradientColorAsString } from '../../utils/gradient';
	import type { Gradient } from '../../utils/graphSettings.svelte';

	const gradient: Gradient = [
		[{ r: 200, g: 0, b: 0, a: 1 }, 0],
		[{ r: 0, g: 200, b: 0, a: 1 }, 1]
	];
	let { score, weightNormalized = 1 }: { score: number; weightNormalized: number } = $props();
</script>

<div class="container">
	<div class="progress-bar" style="width: {weightNormalized * 100}%">
		<div
			class="fill"
			style="width: {score * 100}%; background-color: {getGradientColorAsString(gradient, score)}"
		></div>
	</div>
</div>

<style>
	.container {
		width: 100%;
	}
	.progress-bar {
		height: 8px;
		background-color: #eee;
		border-radius: 10px;
	}
	.fill {
		height: 100%;
		border-radius: 10px;
	}
</style>
