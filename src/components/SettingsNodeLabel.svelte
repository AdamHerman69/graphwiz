<script lang="ts">
	import { type NodeLabel } from '../utils/graphSettings.svelte';
	import type { Attribute } from '../utils/graph.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import AttributePicker from './AttributePicker.svelte';
	import { colord } from 'colord';
	import ColorPicker from '$lib/colorPicker/components/ColorPicker.svelte';
	import ColorPickerWrapper from '$lib/RangeSlider/ColorPickerWrapper.svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { getContext } from 'svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let newGUIID = getContext('graphSettings').newGUIID;

	let { labels, onlyGeneral = false }: { labels: NodeLabel[]; onlyGeneral: boolean } = $props();
	let colorPickers: boolean[] = $state(Array(labels.length).fill(false));

	function addLabel() {
		// to add label with an unused position
		const positions = ['below', 'above', 'center', 'left', 'right'] as const;
		const unusedPositions = positions.filter(
			(pos) => !labels.some((label) => label.position === pos)
		);
		labels.push({
			text: 'label',
			size: 4,
			position: unusedPositions.length > 0 ? unusedPositions[0] : 'below',
			color: { r: 0, g: 0, b: 0, a: 1 },
			id: newGUIID(),
			attribute: availableAttributes.filter(
				(attribute) => attribute.owner === 'node'
			)[0] as Attribute
		});
	}

	function deleteLabel(event: MouseEvent) {
		let index = parseInt(event.currentTarget!.id);
		labels.splice(index, 1);
		colorPickers.splice(index, 1);
	}
</script>

<div class="flex justify-between items-center">
	<div class="settingName">
		Labels
		<!-- {numSettings.source} -->
	</div>
	<button onclick={addLabel} class="buttonGeneral"
		><span class="material-symbols-outlined"> add </span></button
	>
</div>

<!-- style={`height: ${height}px;`} -->
<div class="labelContainer mt-1" use:autoAnimate={{ duration: 250 }}>
	<!-- todo keyed array -->
	{#each labels as label, index (label.id)}
		<div use:autoAnimate={{ duration: 250 }}>
			<div class="flex items-center mx-3">
				<div class="flex-1 my-1 py-1">
					<div class="flex items-center">
						<div class="flex-col flex-grow">
							<div>{label.source}</div>
							<AttributePicker
								bind:selectedAttribute={label.attribute}
								filter={(attribute: Attribute) => attribute.owner === 'node' && (!onlyGeneral || attribute.general === true)}
							/>

							<!-- <select class="bg-transparent outline-none" bind:value={label.position}>
								<option value="below">below</option>
								<option value="above">above</option>
								<option value="center">center</option>
								<option value="left">left</option>
								<option value="right">right</option>
							</select> -->
							<CustomSelect
								bind:selected={label.position}
								values={['below', 'above', 'center', 'left', 'right']}
								fontSize={12}
							/>
						</div>
						<div class="mx-1">
							<button
								onclick={() => (label.size = label.size + 0.5)}
								class="mx-1 flex items-center buttonGeneral textSizeButton"
							>
								<span class="material-symbols-outlined text-sm"> text_increase </span>
							</button>
							<button
								onclick={() => (label.size = label.size - 0.5)}
								class="mx-1 flex items-center buttonGeneral textSizeButton"
							>
								<span class="material-symbols-outlined text-sm"> text_decrease </span>
							</button>
						</div>

						<!-- TODO shadow refactor -->
						<button
							onclick={() => (colorPickers[index] = !colorPickers[index])}
							class="colorButton hoverScale"
							style="background-color: {colord(
								label.color
							).toRgbString()}; box-shadow: inset 0px 0px 6px 0px rgba(0, 0, 0, 0.5);"
						></button>

						<!-- Close button -->
						<button id={index.toString()} class="ml-auto buttonGeneral" onclick={deleteLabel}>
							<span class="material-symbols-outlined"> close </span>
						</button>
					</div>
				</div>
			</div>
			{#if colorPickers[index]}
				<div class="mx-3">
					<ColorPicker
						bind:rgb={label.color}
						isDialog={false}
						components={{ wrapper: ColorPickerWrapper }}
						closeFunction={() => (colorPickers[index] = false)}
					/>
				</div>
			{/if}
			<div class={`mx-3 ${index < labels.length - 1 ? 'border-b border-gray-200' : ''}`} />
		</div>
	{/each}
</div>

<style>
	.colorButton {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.buttonGeneral:not(.textSizeButton) {
		margin-left: 2px;
	}

	.textSizeButton span {
		font-size: 14px;
	}
</style>
