<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import type { RangeAttribute, Attribute } from '../utils/graph.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';
	import AttributePicker from './AttributePicker.svelte';

	let { numSettings }: { numSettings: NumericalSetting } = $props();

	// proxy for Range slider which requires an array - two way binding achieved
	let valueArray = {
		get value() {
			return [numSettings.value];
		},
		set value(val: number[]) {
			numSettings.value = val[0];
		}
	};

	// Binding attrubutes
	let selectedAttribute: RangeAttribute | undefined = $state(undefined);
	let bound: boolean = $state(false);
	let selectedRange: [number, number] = $state([numSettings.min, numSettings.max]);

	function toggleAttributeBinding() {
		bound = !bound;
		if (numSettings.attribute) numSettings.attribute = undefined;
	}

	$effect(() => {
		if (selectedAttribute) {
			numSettings.domainRange = selectedAttribute.range;
			numSettings.attribute = selectedAttribute;
			numSettings.selectedRange = selectedRange;
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
		{#if bound}
			<!-- TODO: actual filter -->
			<AttributePicker
				bind:selectedAttribute
				filter={(attribute: Attribute) => (attribute.owner === 'node' && attribute.type === 'number')}
			/>
		{/if}
		<button onclick={toggleAttributeBinding}>
			<span class="material-symbols-outlined"> add_link </span>
		</button>
	</div>
</div>

{#if bound}
	<RangeSlider
		bind:values={selectedRange}
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
