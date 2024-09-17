<script lang="ts">
	import type { ColorSetting } from '../utils/graphSettings.svelte';
	import { type RangeAttribute, type Attribute, availableAttributes } from '../utils/graph.svelte';
	import AttributePicker from './AttributePicker.svelte';
	import { colord, type RgbaColor } from 'colord';
	import ColorPicker from '$lib/colorPicker/components/ColorPicker.svelte';
	import RangeSliderGradient from '$lib/RangeSlider/RangeSliderGradient.svelte';
	import ColorPickerWrapper from '$lib/RangeSlider/ColorPickerWrapper.svelte';
	import { getContext } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import type { Guideline } from '../utils/guideline.svelte';
	import GuidelineSource from './GUI/GuidelineSource.svelte';
	import { blur } from 'svelte/transition';

	let {
		colorSetting,
		isGuidelineEditor = false
	}: { colorSetting: ColorSetting; guidelineEditor: boolean } = $props();
	const owner = getContext('type');
	let guidelines: Guideline[] = getContext('guidelines');

	let pickerColorIndex: number = $state(-1); // minus one if picker closed

	function addColor() {
		colorSetting.value.push([{ r: 255, g: 255, b: 255, a: 1 }, 0]);
		colorSetting.source = null;
	}

	function removeColor(index: number) {
		if (pickerColorIndex === index) pickerColorIndex = -1;
		if (pickerColorIndex > index) pickerColorIndex--;
		colorSetting.value.splice(index, 1);
		colorSetting.source = null;
	}

	// proxy just to set source to manual (null)
	let colorValue = {
		get value() {
			return colorSetting.value[pickerColorIndex][0];
		},
		set value(val: RgbaColor) {
			colorSetting.value[pickerColorIndex][0] = val;
			colorSetting.source = null;
		}
	};

	// For range slider gradient positions, runs only if position changes
	let colorPositions = {
		get value() {
			return colorSetting.value.map((colorPosTuple) => colorPosTuple[1]);
		},
		set value(val: number[]) {
			colorSetting.value.forEach((colorPosTuple, index) => (colorPosTuple[1] = val[index]));
		}
	};

	function toggleAttributeBinding() {
		if (colorSetting.attribute) colorSetting.attribute = undefined;
		else {
			colorSetting.attribute = availableAttributes.filter(
				(attribute) => attribute.owner === owner && attribute.type === 'number'
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
	<div class="settingName">
		{colorSetting.name}
		{#if colorSetting.source}
			<GuidelineSource guidelineName={colorSetting.source} />
		{/if}
	</div>
	<div class="flex justify-end items-center gap-1">
		<div class:bindContainer={colorSetting.attribute}>
			{#if colorSetting.attribute}
				<div class="mr-2">
					<AttributePicker
						bind:selectedAttribute={colorSetting.attribute}
						filter={(attribute: Attribute) => (attribute.owner === owner && attribute.type === 'number')}
						alignRight={true}
					/>
				</div>
			{/if}

			<button
				onclick={toggleAttributeBinding}
				class="buttonGeneral"
				class:linkMargin={colorSetting.value.length <= 1}
			>
				<span class="material-symbols-outlined">
					{colorSetting.attribute ? 'link_off' : 'add_link'}</span
				>
			</button>
		</div>
		<!-- TODO iset shadow variable -->
		{#if colorSetting.value.length == 1}
			<button
				onclick={() => toggleColorPicker(0)}
				class="colorButton"
				style="background-color: {colord(
					colorSetting.value[0][0]
				).toRgbString()}; box-shadow: inset 0px 0px 10px 0px rgba(0, 0, 0, 0.5);"
			>
			</button>
		{/if}

		<button onclick={addColor} class="buttonGeneral"
			><span class="material-symbols-outlined"> add</span></button
		>
	</div>
</div>

<div use:autoAnimate>
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
			bind:rgb={colorValue.value as RgbaColor}
			label="tadyy"
			isDialog={false}
			components={{ wrapper: ColorPickerWrapper }}
			closeFunction={() => console.log('close color picker')}
		/>
	{/if}
</div>

<style>
	.colorButton {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.colorButton:hover {
		transform: scale(1.1);
	}

	.linkMargin {
		margin-right: 3px;
	}
</style>
