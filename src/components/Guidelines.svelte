<script lang="ts">
	import type Graph from 'graphology';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import { type Guideline, applyGuideline, isComposite } from '../utils/guideline.svelte';
	import { getContext } from 'svelte';
	import type { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import GuidelineCard from './GuidelineCard.svelte';
	import autoAnimate from '@formkit/auto-animate';

	let guidelines: Guideline[] = getContext('guidelines') as Guideline[];

	let expandedGuideline: Guideline | null = $state(null);
	let expandedGuidelineOriginalDims: DOMRect | null = $state(null);
	let expandedCardElement: HTMLElement;
	let isClosing = $state(false);

	$effect(() => {
		guidelines.sort((a, b) => {
			if (a.status?.applied === b.status?.applied) return b.score! - a.score!;

			if (a.status?.applied === 'fully') return -1;
			if (b.status?.applied === 'fully') return 1;

			if (a.status?.applied === 'partially') return -1;
			if (b.status?.applied === 'partially') return 1;
		});
		console.log('sorted');
	});

	function expand(guideline: Guideline, div: HTMLDivElement) {
		if (guideline.expanded) {
			isClosing = true;
			animateClose();
		} else {
			expandedGuidelineOriginalDims = div.getBoundingClientRect();
			expandedGuideline = guideline;
			guideline.expanded = true;
			isClosing = false;
		}
	}

	function animateClose() {
		if (expandedCardElement && expandedGuidelineOriginalDims) {
			const { top, left, width, height } = expandedGuidelineOriginalDims;
			expandedCardElement.style.transition = 'all 0.3s ease-in-out';
			expandedCardElement.style.top = `${top}px`;
			expandedCardElement.style.left = `${left}px`;
			expandedCardElement.style.width = `${width}px`;
			expandedCardElement.style.height = `${height}px`;

			expandedCardElement.addEventListener(
				'transitionend',
				() => {
					if (expandedGuideline) {
						expandedGuideline.expanded = false;
						expandedGuideline = null;
						isClosing = false;
					}
				},
				{ once: true }
			);
		}
	}

	$effect(() => {
		if (expandedGuideline && expandedCardElement && expandedGuidelineOriginalDims && !isClosing) {
			const { top, left, width, height } = expandedGuidelineOriginalDims;
			expandedCardElement.style.transition = 'none';
			expandedCardElement.style.top = `${top}px`;
			expandedCardElement.style.left = `${left}px`;
			expandedCardElement.style.width = `${width}px`;
			expandedCardElement.style.height = `${height}px`;

			// Force a reflow
			expandedCardElement.offsetHeight;

			expandedCardElement.style.transition = 'all 0.3s ease-in-out';
			expandedCardElement.style.top = '25vh';
			expandedCardElement.style.left = '25vw';
			expandedCardElement.style.width = '50vw';
			expandedCardElement.style.height = '50vh';
		}
	});
</script>

<div use:autoAnimate>
	{#each guidelines as guideline, index (guideline.id)}
		{#if !guideline.expanded || isClosing}
			<GuidelineCard {guideline} first={index === 0} {expand} />
		{/if}
	{/each}
	<div class="card cardSpacing">
		<div class="text-lg font-bold">graphCharacteristics</div>
		{#each Object.keys(graphCharacteristics) as key}
			<div class="text-sm">{key} : {graphCharacteristics[key].value}</div>
		{/each}
	</div>
</div>

{#if expandedGuideline || isClosing}
	<div class="expanded" bind:this={expandedCardElement}>
		<GuidelineCard guideline={expandedGuideline!} {expand} />
	</div>
{/if}

<style>
	.expanded {
		position: fixed;
		z-index: 1000;
	}
</style>
