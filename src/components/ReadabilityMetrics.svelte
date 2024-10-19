<script lang="ts">
	import { blur } from 'svelte/transition';
	import { getGradientColorAsString } from '../utils/gradient';
	import type { Gradient } from '../utils/graphSettings.svelte';
	import type { ReadabilityMetrics } from '../utils/canvas.svelte';

	const gradient: Gradient = [
		[{ r: 255, g: 0, b: 0, a: 1 }, 0],
		[{ r: 0, g: 255, b: 0, a: 1 }, 1]
	];

	let { readability = $bindable() }: { readability: ReadabilityMetrics } = $props();
</script>

{#if readability}
	<div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex" transition:blur>
		<div class="p-4">
			<div
				class="value"
				style={`color: ${getGradientColorAsString(gradient, readability?.crossing)}`}
			>
				{readability?.crossing.toFixed(3)}
			</div>
			<div class="heading">Crossings</div>
		</div>
		<div class="p-4">
			<div
				class="value"
				style={`color: ${getGradientColorAsString(gradient, readability?.crossingAngle)}`}
			>
				{readability?.crossingAngle.toFixed(3)}
			</div>
			<div class="heading">Crossing Angle</div>
		</div>
		<div class="p-4">
			<div
				class="value"
				style={`color: ${getGradientColorAsString(gradient, readability?.angularResolutionMin)}`}
			>
				{readability?.angularResolutionMin.toFixed(3)}
			</div>
			<div class="heading">Angular Resolution Min</div>
		</div>
		<div class="p-4">
			<div
				class="value"
				style={`color: ${getGradientColorAsString(gradient, readability?.angularResolutionDev)}`}
			>
				{readability?.angularResolutionDev.toFixed(3)}
			</div>
			<div class="heading">Angular Resolution Deviation</div>
		</div>
	</div>
{/if}

<style>
	.heading {
		text-transform: uppercase;
		font-size: 10px;
		max-width: 150px;
		line-height: 1.3;
	}
	.value {
		font-size: 16px;
		font-weight: bold;
	}
</style>
