<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import type { RangeAttribute, Attribute } from '../utils/graph.svelte';
	import { nodeSettings, type NumericalSetting } from '../utils/graphSettings.svelte';
	import AttributePicker from './AttributePicker.svelte';

	let { name, numSettings }: { name: string; numSettings: NumericalSetting[] } = $props();

	// proxy for Range slider which requires an array - two way binding achieved
	let valueArray = {
		get value() {
			return numSettings.map((setting) => setting.value);
		},
		set value(val: number[]) {
			numSettings.forEach((setting, index) => (setting.value = val[index]));
		}
	};

	// Binding attrubutes
	let selectedAttributes: (RangeAttribute | undefined)[] = $state(
		nodeSettings.map(() => undefined)
	);
	let bound: boolean[] = $state(numSettings.map(() => false));
	let selectedRanges: [number, number][] = $state(
		nodeSettings.map((setting) => [setting.min, setting.max])
	);

	function toggleAttributeBinding(index: number) {
		bound[index] = !bound[index];
		if (numSettings[index].attribute) numSettings[index].attribute = undefined;
	}

	$effect(() => {
		selectedAttributes.forEach((selectedAttribute, index) => {
			if (selectedAttribute) {
				numSettings[index].domainRange = selectedAttributes[index].range;
				numSettings[index].attribute = selectedAttributes[index];
				numSettings[index].selectedRange = selectedRanges[index];
			}
		});
	});
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{name}
		{numSettings.map((setting) => setting.value).join(', ')}

		<!-- {numSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		{#each numSettings as numSetting, index}
			{#if bound[index]}
				<AttributePicker
					bind:selectedAttribute={selectedAttributes[index]}
					filter={(attribute: Attribute) => (attribute.owner === 'node' && attribute.type === 'number')}
				/>
			{:else}
				<button onclick={() => toggleAttributeBinding(index)}>
					<span class="material-symbols-outlined"> add_link </span>
				</button>
			{/if}
		{/each}
	</div>
</div>

{#each numSettings as numSetting, index}
	{#if bound[index]}
		<RangeSlider
			bind:values={selectedRanges[index]}
			max={numSettings[index].max}
			min={numSettings[index].min}
			step={numSettings[index].increment || 1}
			range={true}
			float
		/>
	{/if}
{/each}

{#if bound.some((b) => b === false)}
	<RangeSlider
		bind:values={valueArray.value}
		max={numSettings[0].max}
		min={numSettings[0].min}
		step={numSettings[0].increment || 1}
		range={true}
		float
	/>
{/if}
