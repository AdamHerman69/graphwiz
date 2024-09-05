<script lang="ts">
	import type {
		CompositeCondition,
		WeightedCondition as wCondition
	} from '../utils/guideline.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import collapseAnimation from '../assets/animated_icons/alternating_arrow.json';
	import lottie, { type AnimationItem } from 'lottie-web';
	import { onMount } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';

	let {
		compositeCondition = $bindable(),
		weightedCondition,
		editable = false
	}: {
		compositeCondition: CompositeCondition;
		weightedCondition: wCondition;
		editable?: boolean;
	} = $props();

	let collapsed = $state(true);
	let collapseAnimationInstance: AnimationItem;
	let collapseButton: HTMLButtonElement;

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

	function collapse() {
		collapsed
			? collapseAnimationInstance.playSegments([0, 5], true)
			: collapseAnimationInstance.playSegments([7, 11], true);
		collapsed = !collapsed;
	}
</script>

<div class="flex-col w-full">
	<div class="flex justify-between">
		<div>
			<div>composite</div>
		</div>
		<div>
			<button bind:this={collapseButton} on:click={collapse} class="w-5 h-5 pt-1" />
		</div>
	</div>

	{#if !editable}
		<ScoreBar
			score={weightedCondition.score}
			weightNormalized={weightedCondition.weightNormalized}
		/>
	{/if}
	<div use:autoAnimate>
		{#if !collapsed}
			{#each compositeCondition.conditions.sort((a, b) => b.scoreWeighted - a.scoreWeighted) as wc, index (wc.GUIID)}
				<WeightedCondition
					weightedCondition={wc}
					{editable}
					deleteFunction={() => compositeCondition.conditions.splice(index, 1)}
				/>
				<div
					class={`mx-1 ${index < compositeCondition.conditions.length - 1 ? 'border-b border-gray-200' : ''}`}
				/>
			{/each}
		{/if}
	</div>
</div>
