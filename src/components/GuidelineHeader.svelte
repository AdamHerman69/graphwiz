<script lang="ts">
	import { type Guideline, isComposite } from '../utils/guideline.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import WeightedCondition from './WeightedCondition.svelte';
	import { formatDecimal } from '../utils/helperFunctions';
	import collapseAnimation from '../assets/animated_icons/alternating_arrow.json';
	import lottie, { type AnimationItem } from 'lottie-web';
	import { onMount } from 'svelte';
	import { hoverPopup } from './GUI/HoverPopup.svelte';
	import IconValueDisplay from './GUI/IconValueDisplay.svelte';

	let { guideline }: { guideline: Guideline } = $props();

	let collapsed = $state(true);
	let collapseAnimationInstance: AnimationItem;
	let collapseButton: HTMLButtonElement;

	function collapse() {
		collapsed
			? collapseAnimationInstance.playSegments([0, 5], true)
			: collapseAnimationInstance.playSegments([7, 11], true);
		collapsed = !collapsed;
	}

	onMount(() => {
		collapseAnimationInstance = lottie.loadAnimation({
			container: collapseButton,
			loop: false,
			autoplay: false,
			animationData: collapseAnimation,
			initialSegment: [0, 5],
			rendererSettings: {
				preserveAspectRatio: 'xMidYMid slice',
				progressiveLoad: true
			}
		});
	});
</script>

<div class="flex justify-between align-middle mb-1">
	<div class="flex justify-center align-middle">
		<div class="text-lg font-bold uppercase">
			{guideline.name}
		</div>
	</div>
	<div>
		<div class="flex items-center">
			<button bind:this={collapseButton} on:click={collapse} class="w-5 h-5" />
			<div class="text-lg font-bold text-nowrap">{formatDecimal(guideline.score * 100, 0)} %</div>
		</div>
	</div>
</div>
<ScoreBar score={guideline.score} hidePercentage={true} />
<div use:autoAnimate class="mt-1 labelContainer px-3">
	{#if !collapsed}
		<div class="py-1">
			{#if isComposite(guideline.rootCondition.condition)}
				{#each guideline.rootCondition.condition.conditions.sort((a, b) => b.scoreWeighted - a.scoreWeighted) as weightedCondition, index}
					<WeightedCondition {weightedCondition} />
					<div
						class={`${index < guideline.rootCondition.condition.conditions.length - 1 ? 'border-b border-gray-200' : ''}`}
					/>
				{/each}
			{/if}
		</div>
	{/if}
</div>
