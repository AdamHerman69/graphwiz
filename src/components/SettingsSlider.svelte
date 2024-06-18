<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';

	let { numSettings }: { numSettings: NumericalSetting } = $props();
	const owner = getContext('type');

	// proxy for Range slider which requires an array - two way binding achieved
	let valueArray = {
		get value() {
			return [numSettings.value];
		},
		set value(val: number[]) {
			numSettings.value = val[0];
		}
	};

	function toggleAttributeBinding() {
		if (numSettings.attribute) numSettings.attribute = undefined;
		else {
			numSettings.attribute = availableAttributes.filter(
				(attribute) => attribute.owner === owner && attribute.type === 'number'
			)[0] as RangeAttribute;
		}
	}

	$effect.pre(() => {
		if (numSettings.attribute) {
			numSettings.domainRange = numSettings.attribute.range;
			if (!numSettings.selectedRange) {
				numSettings.selectedRange = [numSettings.min, numSettings.max];
			}
		}
	});
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{numSettings.name}
		{numSettings.value}

		<!-- {numSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		{#if numSettings.attribute}
			<AttributePicker
				bind:selectedAttribute={numSettings.attribute}
				filter={(attribute: Attribute) => (attribute.owner === owner && attribute.type === 'number')}
			/>
		{/if}
		<button onclick={toggleAttributeBinding}>
			<span class="material-symbols-outlined"> add_link </span>
		</button>
	</div>
</div>

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
