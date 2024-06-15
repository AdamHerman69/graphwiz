<script lang="ts">
	import type { ColorSetting } from '../utils/graphSettings.svelte';
	import type { RangeAttribute, Attribute } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { colord, type RgbaColor } from 'colord';

	let { colorSetting }: { colorSetting: ColorSetting } = $props();

	function addColor() {
		colorSetting.value.push([{ r: 255, g: 255, b: 255, a: 1 }, 1]);
	}

	// Binding attrubutes
	let selectedAttribute: RangeAttribute | undefined = $state(undefined);
	let bound: boolean = $state(false);

	function toggleAttributeBinding() {
		bound = !bound;
		if (colorSetting.attribute) colorSetting.attribute = undefined;
	}

	$effect(() => {
		if (selectedAttribute) {
			colorSetting.domainRange = selectedAttribute.range;
			colorSetting.attribute = selectedAttribute;
		}
	});
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{colorSetting.name}
		<!-- {colorSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		{#if bound}
			<!-- TODO: actual filter -->
			<AttributePicker
				bind:selectedAttribute
				filter={(attribute: Attribute) => (attribute.owner === 'node' && attribute.type === 'number')}
			/>
		{/if}
		<button onclick={addColor} class="mx-2">+</button>
		<!-- TODO iset shadow variable -->
		{#if colorSetting.value.length == 1}
			<button
				onclick={() => console.log('color picker open TODO')}
				class="rounded-full w-6 h-6"
				style="background-color: {colord(
					colorSetting.value[0][0]
				).toRgbString()}; box-shadow: inset 0px 0px 10px 0px rgba(0, 0, 0, 0.5);"
			>
			</button>
		{/if}

		<button onclick={toggleAttributeBinding}>
			<span class="material-symbols-outlined"> add_link </span>
		</button>
	</div>
</div>
