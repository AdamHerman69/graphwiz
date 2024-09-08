<script lang="ts">
	import { type EdgeLabel } from '../utils/graphSettings.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import AttributePicker from './AttributePicker.svelte';
	import { colord } from 'colord';
	import ColorPicker from '$lib/colorPicker/components/ColorPicker.svelte';
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import ColorPickerWrapper from '$lib/RangeSlider/ColorPickerWrapper.svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { getContext } from 'svelte';
	import BooleanCondition from './BooleanCondition.svelte';

	let newGUIID = getContext('graphSettings').newGUIID;

	let { labels, onlyGeneral = false }: { labels: EdgeLabel[]; onlyGeneral: boolean } = $props();
	let colorPickers: boolean[] = $state(Array(labels.length).fill(false));

	// For range slider relative positions
	let labelPositions = {
		get value() {
			return labels.map((label) => label.relativePosition);
		},
		set value(val: number[]) {
			labels.forEach((label, index) => (label.relativePosition = val[index]));
		}
	};

	function addLabel() {
		labels.push({
			id: newGUIID(),
			text: 'mid',
			color: { r: 0, g: 0, b: 0, a: 1 },
			size: 3,
			relativePosition: 0.5,
			position: 'below',
			rotate: true,
			attribute: availableAttributes.filter(
				(attribute) => attribute.owner === 'edge'
			)[0] as Attribute
		});
	}

	function deletelabel(event: MouseEvent) {
		let index = parseInt(event.currentTarget!.id);
		labels.splice(index, 1);
		colorPickers.splice(index, 1);
	}
</script>

<div class="flex justify-between items-center">
	<div class="text-m uppercase">
		Labels
		<!-- {numSettings.source} -->
	</div>
	<button onclick={addLabel} class="flex justify-end items-center"
		><span class="material-symbols-outlined"> add </span></button
	>
</div>
<div class="mb-4 mt-2">
	{#if labelPositions.value.length > 0}
		<RangeSlider bind:values={labelPositions.value} min={0} max={1} step={0.01} float />
	{/if}
</div>

<div class="labelContainer mt-1" use:autoAnimate={{ duration: 250 }}>
	<!-- todo keyed array -->
	{#each labels as label, index (label.id)}
		<div class="flex items-center mx-3">
			<div class="flex-1 my-1 py-1">
				<div class="flex items-center">
					<!-- TODO Size -->
					<div class="flex flex-col flex-grow">
						<div>{label.source}</div>
						<AttributePicker
							bind:selectedAttribute={label.attribute}
							filter={(attribute: Attribute) => attribute.owner === 'edge' && (!onlyGeneral || attribute.general === true)}
						/>
						<select bind:value={label.position} class="bg-transparent">
							<option value="above">above</option>
							<option value="below">below</option>
							<option value="center">center</option>
						</select>
					</div>

					<div>
						<button onclick={() => (label.size = label.size + 0.5)} class="mx-1 flex items-center">
							<span class="material-symbols-outlined text-sm"> text_increase </span>
						</button>
						<button onclick={() => (label.size = label.size - 0.5)} class="mx-1 flex items-center">
							<span class="material-symbols-outlined text-sm"> text_decrease </span>
						</button>
					</div>

					<button onclick={() => (label.rotate = !label.rotate)} class="mx-1 flex items-center">
						<span class="material-symbols-outlined text-sm"> text_rotation_angledown </span>
					</button>

					<div>
						<button
							onclick={() => (colorPickers[index] = !colorPickers[index])}
							class="rounded-full w-6 h-6 flex items-center"
							style="background-color: {colord(
								label.color
							).toRgbString()}; box-shadow: inset 0px 0px 6px 0px rgba(0, 0, 0, 0.5);"
						/>
					</div>

					<button class="ml-auto flex items-center" id={index.toString()} onclick={deletelabel}>
						<span class="material-symbols-outlined"> close </span>
					</button>
				</div>
			</div>
		</div>
		{#if colorPickers[index]}
			<div class="pl-4">
				<ColorPicker
					bind:rgb={label.color}
					label="tadyy"
					isDialog={false}
					components={{ wrapper: ColorPickerWrapper }}
					closeFunction={() => (colorPickers[index] = false)}
				/>
			</div>
		{/if}
		<div class={`mx-3 ${index < labels.length - 1 ? 'border-b border-gray-200' : ''}`} />
	{/each}
</div>
