<script lang="ts">
	import type { WeightedCondition } from '../../utils/guideline.svelte';
	let { score, weightNormalized = 1 }: { score: number; weightNormalized: number } = $props();
</script>

<div class="container">
	<div class="progress-bar" style="width: {weightNormalized * 100}%">
		<div class="fill" style="width: {score * 100}%"></div>
	</div>
</div>

<style>
	.container {
		width: 100%;
	}
	.progress-bar {
		height: 6px;
		background-color: #eee;
		border-radius: 10px;
	}
	.fill {
		height: 100%;
		background-color: lightpink;
		border-radius: 10px;
	}
</style>
