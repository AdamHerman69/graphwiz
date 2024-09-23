<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { getContext } from 'svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import { blur } from 'svelte/transition';

	let { name, numSettings }: { name: string; numSettings: NumericalSetting[] } = $props();
	const owner = getContext('type');
	let guidelines: Guideline[] = getContext('guidelines');

	// proxy for Range slider which requires an array - two way binding achieved
	let valueArray = {
		get value() {
			return numSettings.map((setting) => setting.value);
		},
		set value(val: number[]) {
			numSettings.forEach((setting, index) => {
				if (setting.value !== val[index]) setting.source = null; // now manually set
				setting.value = val[index];
			});
		}
	};

	function toggleAttributeBinding(index: number) {
		if (numSettings[index].attribute) numSettings[index].attribute = undefined;
		else {
			numSettings[index].attribute = availableAttributes.filter(
				(attribute) => attribute.owner === owner && attribute.type === 'number'
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
	<div class="settingName">
		{name}
		<!-- TODO proper source -->

		<!-- {numSettings.source} -->
	</div>
	<!-- Binding partial edges hidden for now -->
	<!-- <div class="flex justify-end items-center">
		{#each numSettings as numSetting, index}
			<div class="flex justify-end items-center" class:bindContainer={numSetting.attribute}>
				{#if numSetting.attribute}
					<div transition:blur={{ duration: 200 }} class="mr-2">
						<AttributePicker
							bind:selectedAttribute={numSetting.attribute}
							filter={(attribute: Attribute) => (attribute.owner === owner && attribute.type === 'number')}
							alignRight={true}
						/>
					</div>
				{/if}
				<button onclick={() => toggleAttributeBinding(index)} class="buttonGeneral">
					<span class="material-symbols-outlined">
						{numSetting.attribute ? 'link_off' : 'add_link'}</span
					>
				</button>
			</div>
		{/each}
	</div> -->
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
