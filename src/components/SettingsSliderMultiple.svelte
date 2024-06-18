<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';
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

	function toggleAttributeBinding(index: number) {
		if (numSettings[index].attribute) numSettings[index].attribute = undefined;
		else {
			numSettings[index].attribute = availableAttributes.filter(
				(attribute) => attribute.owner === 'edge' && attribute.type === 'number'
			)[0] as RangeAttribute;
		}
	}

	$effect.pre(() => {
		numSettings.forEach((numSetting) => {
			if (numSetting.attribute) {
				numSetting.domainRange = numSetting.attribute.range;
				if (!numSetting.selectedRange) {
					numSetting.selectedRange = [numSetting.min, numSetting.max];
				}
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
			{#if numSetting.attribute}
				<AttributePicker
					bind:selectedAttribute={numSetting.attribute}
					filter={(attribute: Attribute) => (attribute.owner === 'edge' && attribute.type === 'number')}
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
	{#if numSetting.attribute}
		<RangeSlider
			bind:values={numSetting.selectedRange}
			max={numSettings[index].max}
			min={numSettings[index].min}
			step={numSettings[index].increment || 1}
			range={true}
			float
		/>
	{/if}
{/each}

{#if numSettings.some((numSetting) => !numSetting.attribute)}
	<RangeSlider
		bind:values={valueArray.value}
		max={numSettings[0].max}
		min={numSettings[0].min}
		step={numSettings[0].increment || 1}
		range={true}
		float
	/>
{/if}
