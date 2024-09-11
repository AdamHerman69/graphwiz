<script lang="ts">
	import type {
		CompositeCondition,
		WeightedCondition as wCondition,
		Condition
	} from '../utils/guideline.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import collapseAnimation from '../assets/animated_icons/alternating_arrow.json';
	import lottie, { type AnimationItem } from 'lottie-web';
	import { onMount } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import HoverButton from './GUI/HoverButton.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import { getContext } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';

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

	let { newGUIID } = getContext('graphSettings') as GraphSettingsClass;

	function addCondition(type: 'boolean' | 'range' | 'string' | 'numeric' | 'composite') {
		const getDefaultProperty = (propertyType: 'number' | 'boolean' | 'string') => {
			const properties = Object.entries(graphCharacteristics)
				.filter(([, value]) => value.type === propertyType)
				.map(([key]) => key);
			return properties[0] || 'nodeCount'; // Fallback to 'nodeCount' if no properties of the specified type
		};

		let newCondition: Condition;

		switch (type) {
			case 'boolean':
				newCondition = {
					type: 'boolean',
					property: getDefaultProperty('boolean'),
					value: true
				};
				break;
			case 'range':
			case 'numeric':
				newCondition = {
					type: type,
					property: getDefaultProperty('number'),
					min: 0,
					max: 0
				};
				break;
			case 'string':
				newCondition = {
					type: 'string',
					property: getDefaultProperty('string'),
					value: ''
				};
				break;
			case 'composite':
				newCondition = {
					type: 'composite',
					conditions: []
				};
				break;
			default:
				throw new Error(`Invalid condition type: ${type}`);
		}

		compositeCondition.conditions.push({
			GUIID: newGUIID(),
			condition: newCondition,
			weight: 1
		});
	}
</script>

<div class="flex-col w-full">
	<div class="flex justify-between">
		<div>
			<div class="uppercase">composite</div>
		</div>
		<div>
			<button bind:this={collapseButton} onclick={collapse} class="w-5 h-5 pt-1" />
		</div>
	</div>

	{#if !editable}
		<ScoreBar
			score={weightedCondition.score}
			weightNormalized={weightedCondition.weightNormalized}
		/>
	{/if}
	<div use:autoAnimate class="w-full">
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
		{#if editable}
			<div class="border-b border-gray-200"></div>
			<div class="flex mb-1 gap-1 w-full">
				<span class="material-symbols-outlined text-xs"> add </span>
				<button onclick={() => addCondition('boolean')}
					><HoverButton icon="check_box" text="boolean" />
				</button>
				<button onclick={() => addCondition('numeric')}
					><HoverButton icon="pin_drop" text="numeric" />
				</button>
				<button onclick={() => addCondition('range')}
					><HoverButton icon="arrow_range" text="range" />
				</button>
				<button onclick={() => addCondition('string')}
					><HoverButton icon="spellcheck" text="string" />
				</button>
				<button onclick={() => addCondition('composite')}
					><HoverButton icon="layers" text="composite" />
				</button>
			</div>
		{/if}
	</div>
</div>
