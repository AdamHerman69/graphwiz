<script lang="ts">
	import type { ColorSetting } from '../utils/graphSettings.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { colord, type RgbaColor } from 'colord';
	import ColorPicker from '$lib/colorPicker/components/ColorPicker.svelte';
	import RangeSliderGradient from '$lib/RangeSlider/RangeSliderGradient.svelte';
	import ColorPickerWrapper from '$lib/RangeSlider/ColorPickerWrapper.svelte';

	let { colorSetting }: { colorSetting: ColorSetting } = $props();

	let pickerColorIndex: number = $state(-1); // minus one if picker closed

	function addColor() {
		colorSetting.value.push([{ r: 255, g: 255, b: 255, a: 1 }, 0]);
	}

	function removeColor(index: number) {
		if (pickerColorIndex === index) pickerColorIndex = -1;
		if (pickerColorIndex > index) pickerColorIndex--;
		colorSetting.value.splice(index, 1);
	}

	// For range slider gradient positions
	let colorPositions = {
		get value() {
			return colorSetting.value.map((colorPosTuple) => colorPosTuple[1]);
		},
		set value(val: number[]) {
			colorSetting.value.forEach((colorPosTuple, index) => (colorPosTuple[1] = val[index]));
		}
	};

	// todo context for node/edge filtering
	function toggleAttributeBinding() {
		if (colorSetting.attribute) colorSetting.attribute = undefined;
		else {
			colorSetting.attribute = availableAttributes.filter(
				(attribute) => attribute.owner === 'node' && attribute.type === 'number'
			)[0] as RangeAttribute;
			if (colorSetting.value.length < 2) addColor(); // has to be a gradient
		}
	}

	function toggleColorPicker(index: number) {
		pickerColorIndex === index ? (pickerColorIndex = -1) : (pickerColorIndex = index);
	}

	$effect.pre(() => {
		if (colorSetting.attribute) {
			colorSetting.domainRange = colorSetting.attribute.range;
		}
	});
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		{colorSetting.name}
		<!-- {colorSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		{#if colorSetting.attribute}
			<!-- TODO: actual filter -->
			<AttributePicker
				bind:selectedAttribute={colorSetting.attribute}
				filter={(attribute: Attribute) => (attribute.owner === 'node' && attribute.type === 'number')}
			/>
		{/if}
		<button onclick={addColor} class="mx-2">+</button>
		<!-- TODO iset shadow variable -->
		{#if colorSetting.value.length == 1}
			<button
				onclick={() => toggleColorPicker(0)}
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

{#if colorSetting.value.length > 1}
	<!-- TODO remove color -->
	<RangeSliderGradient
		bind:values={colorPositions.value}
		gradient={colorSetting.value}
		max={1}
		min={0}
		step={0.05}
		float
		onRangeNubDubClick={(index: number) => toggleColorPicker(index)}
		{removeColor}
	/>
{/if}

{#if pickerColorIndex >= 0}
	<ColorPicker
		bind:rgb={colorSetting.value[pickerColorIndex][0] as RgbaColor}
		label="tadyy"
		isDialog={false}
		components={{ wrapper: ColorPickerWrapper }}
		closeFunction={() => console.log('close color picker')}
	/>
{/if}
