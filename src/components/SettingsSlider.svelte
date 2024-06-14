<script lang="ts">
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import { type NumericalSetting } from '../utils/graphSettings.svelte';

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
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{numSettings.name}
		{numSettings.value}

		<!-- {numSettings.source} -->
	</div>
	<!-- <div class="flex justify-end items-center">
		{#if numSettings.attribute}
			<PropertyPicker bind:property={selectedAttribute} {attributes} {propertyGetters} />
		{/if}
		<button
			class="h-6"
			bind:this={bindButton}
			on:click={bindAttributeHandler}
			on:mouseenter={() => bindAnimationInstance.play()}
			on:mouseleave={() => bindAnimationInstance.stop()}
			disabled={attributes.length === 0}
		/>
	</div> -->
</div>

<RangeSlider
	bind:values={valueArray.value}
	max={numSettings.max}
	min={numSettings.min}
	step={numSettings.increment || 1}
	range={false}
	float
/>

<!-- {#if numSettings.attribute}
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
		bind:values={numSettings.value}
		max={numSettings.max}
		min={numSettings.min}
		step={numSettings.increment || 1}
		range={secondNumSettings !== undefined}
		float
	/>
{/if} -->
