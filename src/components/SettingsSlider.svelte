<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';
	import GuidelineSource from './GUI/GuidelineSource.svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { blur } from 'svelte/transition';
	import { hoverPopup } from './GUI/hoverPopup.svelte';

	let { numSettings }: { numSettings: NumericalSetting } = $props();
	const owner = getContext('type');
	const isGuidelineEditor = getContext('isGuidelineEditor');
	let guidelines: Guideline[] = getContext('guidelines');

	let attributeFilter = $derived(
		isGuidelineEditor
			? (attribute: Attribute) =>
					attribute.owner === owner && attribute.general === true && attribute.type === 'number'
			: (attribute: Attribute) => attribute.owner === owner && attribute.type === 'number'
	);

	// proxy for Range slider which requires an array - two way binding achieved
	let valueArray = {
		get value() {
			return [numSettings.value];
		},
		set value(val: number[]) {
			numSettings.value = val[0];
			numSettings.source = null;
		}
	};

	function toggleAttributeBinding() {
		if (numSettings.attribute) numSettings.attribute = undefined;
		else {
			numSettings.attribute = availableAttributes.filter(attributeFilter)[0] as RangeAttribute;
		}
	}

	$effect.pre(() => {
		if (numSettings.attribute) {
			console.log($state.snapshot(numSettings.attribute));
			numSettings.domainRange = numSettings.attribute.range;
			if (!numSettings.selectedRange) {
				numSettings.selectedRange = [numSettings.min, numSettings.max];
			}
		}
	});
</script>

<div class="flex justify-between items-center">
	<div class="settingName">
		{numSettings.name}
		{#if numSettings.source != null}
			<GuidelineSource guidelineName={numSettings.source} />
		{/if}
	</div>
	<div class="flex justify-end items-center" class:bindContainer={numSettings.attribute}>
		{#if numSettings.attribute}
			<div transition:blur={{ duration: 200 }} class="mr-2">
				<AttributePicker
					bind:selectedAttribute={numSettings.attribute}
					filter={attributeFilter}
					alignRight={true}
				/>
			</div>
		{/if}
		<button
			onclick={toggleAttributeBinding}
			use:hoverPopup={{
				text: numSettings.attribute ? 'remove attribute binding' : 'bind attribute',
				delay: 300,
				position: 'left'
			}}
			class="buttonGeneral"
		>
			<span class="material-symbols-outlined">
				{numSettings.attribute ? 'link_off' : 'add_link'}</span
			>
		</button>
	</div>
</div>

<div transition:blur>
	{#if numSettings.attribute}
		<RangeSlider
			bind:values={numSettings.selectedRange}
			max={numSettings.max}
			min={numSettings.min}
			step={numSettings.increment || 1}
			range={true}
			float
		/>
	{:else}
		<RangeSlider
			bind:values={valueArray.value}
			max={numSettings.max}
			min={numSettings.min}
			step={numSettings.increment || 1}
			range={false}
			float
		/>
	{/if}
</div>
