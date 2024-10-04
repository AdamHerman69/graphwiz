<script lang="ts">
	import type {
		DecoratorSetting,
		DecoratorData,
		GraphSettingsClass
	} from '../utils/graphSettings.svelte';
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { getContext } from 'svelte';
	import ColorPicker from '$lib/colorPicker/components/ColorPicker.svelte';
	import ColorPickerWrapper from '$lib/RangeSlider/ColorPickerWrapper.svelte';
	import { colord } from 'colord';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let { newGUIID } = getContext('graphSettings') as GraphSettingsClass;

	let { decoratorSetting }: { decoratorSetting: DecoratorSetting } = $props();

	let decoratorID = 0;
	let colorPickers: boolean[] = $state(Array(decoratorSetting.value.length).fill(false));

	// For range slider relative positions
	let decoratorPositions = {
		get value() {
			return decoratorSetting.value.map((decorator) => decorator.position);
		},
		set value(val: number[]) {
			decoratorSetting.value.forEach((decorator, index) => (decorator.position = val[index]));
		}
	};

	function addDecorator() {
		decoratorSetting.value.push({
			id: newGUIID(),
			type: 'triangle',
			position: 1
		});
		decoratorSetting = decoratorSetting;
		decoratorPositions.value.push(1);
	}

	function removeDecorator(event: MouseEvent) {
		let index = parseInt(event.currentTarget!.id);
		decoratorSetting.value.splice(index, 1);
	}

	function toggleColor(decorator: DecoratorData) {
		if (decorator.color) {
			decorator.color = undefined;
		} else {
			decorator.color = { r: 255, g: 255, b: 255, a: 1 };
		}
	}
</script>

<div class="flex justify-between items-center">
	<div class="settingName">
		Decorators
		<!-- {numSettings.source} -->
	</div>
	<button onclick={addDecorator} class="buttonGeneral"
		><span class="material-symbols-outlined"> add </span></button
	>
</div>

<!-- Position slider -->
<div class="mx-1">
	{#if decoratorPositions.value.length > 0}
		<RangeSlider bind:values={decoratorPositions.value} min={0} max={1} step={0.01} float />
	{/if}
</div>

<div class="labelContainer mt-1" use:autoAnimate={{ duration: 250 }}>
	{#each decoratorSetting.value as decorator, index (decorator.id)}
		<div
			class={`flex items-center mx-3 ${
				index < decoratorSetting.value.length - 1 ? 'border-b border-gray-200' : ''
			}`}
		>
			<div class="flex-1 my-1 py-1">
				<div class="flex items-center">
					<div class="flex flex-grow">
						<CustomSelect
							bind:selected={decorator.type}
							values={decoratorSetting.types}
							fontSize={12}
						/>

						<div class="ml-auto flex gap-1 justify-center" use:autoAnimate>
							<button
								class="flex items-center buttonGeneral"
								id={index.toString()}
								onclick={() => toggleColor(decorator)}
							>
								<span class="material-symbols-outlined">
									{decorator.color ? 'format_color_reset' : 'invert_colors'}</span
								>
							</button>

							{#if decorator.color}
								<div>
									<button
										onclick={() => (colorPickers[index] = !colorPickers[index])}
										class="colorButton hoverScale"
										style="background-color: {colord(
											decorator.color
										).toRgbString()}; box-shadow: inset 0px 0px 6px 0px rgba(0, 0, 0, 0.5);"
									></button>
								</div>
							{/if}

							<button
								class="flex items-center buttonGeneral"
								id={index.toString()}
								onclick={removeDecorator}
							>
								<span class="material-symbols-outlined"> close </span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		{#if colorPickers[index]}
			<div class="mx-3">
				<ColorPicker
					bind:rgb={decorator.color}
					label="tadyy"
					isDialog={false}
					components={{ wrapper: ColorPickerWrapper }}
					closeFunction={() => (colorPickers[index] = false)}
				/>
			</div>
		{/if}
	{/each}
</div>

<style>
	.colorButton {
		display: flex;
		align-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}
</style>
