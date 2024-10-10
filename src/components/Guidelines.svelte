<script lang="ts">
	import type Graph from 'graphology';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import {
		type Guideline,
		applyGuideline,
		isComposite,
		sortGuidelines
	} from '../utils/guideline.svelte';
	import { getContext, setContext, untrack } from 'svelte';
	import type { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import GuidelineCard from './GuidelineCard.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { getGraph } from '../utils/graph.svelte';
	import { isEdited } from '../utils/guideline.svelte';

	let { side }: { side: 'left' | 'right' } = $props();
	setContext('side', side);

	let guidelines: Guideline[] = getContext('guidelines') as Guideline[];

	let expandedGuideline: Guideline | null = $state(null);
	let editedGuideline: Guideline | null = $state(null);
	let expandedGuidelineOriginalDims: DOMRect | null = $state(null);
	let expandedCardElement: HTMLElement;
	let graphSettings: GraphSettingsClass = getContext('graphSettings');
	let isClosing = $state(false);
	let blurActive = $state(false);
	let overlay = getContext('overlay');

	$effect(() => {
		console.log('sorting');
		console.log(guidelines);
		untrack(() => {
			guidelines.sort((a, b) => {
				if (a.status?.applied === b.status?.applied) return b.score! - a.score!;

				if (a.status?.applied === 'fully') return -1;
				if (b.status?.applied === 'fully') return 1;

				if (a.status?.applied === 'partially') return -1;
				if (b.status?.applied === 'partially') return 1;
			});
		});

		console.log('sorted');
	});

	function expand(guideline: Guideline) {
		if (guideline.expanded) {
			guideline.editedGuideline = null;

			isClosing = true;
			blurActive = false;
			animateClose();
			setTimeout(() => (overlay.on = false), 700);
		} else {
			console.log('expanding, else guideline: ', guideline);
			overlay.on = true;
			expandedGuidelineOriginalDims = guideline.parentDiv!.getBoundingClientRect();
			console.log('after rect');
			expandedGuideline = guideline;
			guideline.expanded = true;
			isClosing = false;
			setTimeout(() => {
				blurActive = true;
			}, 10);
		}
	}

	function newGuideline(): Guideline {
		let newG = $state({
			name: 'Guideline name',
			description: 'Guideline description',
			literature: [],
			rootCondition: {
				weight: 1,
				condition: {
					type: 'composite',
					conditions: [
						{
							weight: 1,
							condition: {
								type: 'numeric',
								property: 'nodeCount',
								min: 50,
								max: 250
							}
						}
					]
				}
			},
			recommendations: {},
			id: graphSettings.newGUIID(),
			score: 0,
			status: { applied: 'notApplied', conflicts: [] },
			expanded: false
		});
		return newG;
	}

	export function addGuideline() {
		let newG = newGuideline();
		guidelines.push(newG);
		// setTimeout(() => {
		// 	expand(newG);
		// }, 50);
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
			expandedCardElement.style.top = '12.5vh';
			expandedCardElement.style.left = '12.5vw';
			expandedCardElement.style.width = '75vw';
			expandedCardElement.style.height = '75vh';
		}
	});
</script>

<div use:autoAnimate>
	<!-- <div>
		<button id="log" onclick={() => console.log(guidelines)} class="flex justify-end items-center">
			log guidelines
		</button>
	</div> -->
	{#if guidelines[0].status?.applied === 'fully'}
		<div class="sectionHeader">Applied</div>
	{/if}

	{#each guidelines as guideline, index (guideline.id)}
		{#if !guideline.expanded || isClosing}
			<GuidelineCard
				bind:guideline={guidelines[index]}
				first={index === 0 || (index === 1 && guidelines[0].expanded)}
				{expand}
			/>
			{#if guideline.status?.applied === 'fully' && (guidelines[index + 1]?.status?.applied == 'partially' || guidelines[index + 1]?.status?.applied == 'notApplied')}
				<div class="sectionHeader">not applied</div>
			{/if}
		{/if}
	{/each}
	<!-- <div class="card cardSpacing">
		<div class="text-lg font-bold">graphCharacteristics</div>
		{#each Object.keys(graphCharacteristics) as key}
			<div class="text-sm">{key} : {graphCharacteristics[key].value}</div>
		{/each}
	</div> -->
</div>

{#if expandedGuideline || isClosing}
	<div class="expandedGuideline" bind:this={expandedCardElement}>
		<GuidelineCard guideline={expandedGuideline!} {expand} />
	</div>
	<div class="overlay" class:active={blurActive} onclick={() => expand(expandedGuideline)}></div>
{/if}

<style>
	.expandedGuideline {
		position: fixed;
		z-index: 10000000;
	}

	.overlay {
		position: fixed;
		backdrop-filter: blur(0px);
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 100000;
		pointer-events: all;
		overflow: hidden;
		transition: backdrop-filter 0.7s ease;
	}

	.overlay.active {
		backdrop-filter: blur(15px);
	}

	#log {
		pointer-events: all;
	}

	.sectionHeader {
		font-size: 45px;
		font-weight: bold;
		margin: 20px 15px;
		text-transform: uppercase;
	}
</style>
