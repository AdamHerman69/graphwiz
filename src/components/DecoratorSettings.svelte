<script lang="ts">
	import type {
		DecoratorSetting,
		DecoratorData,
		GraphSettingsClass
	} from '../utils/graphSettings.svelte';
	import RangeSlider from '$lib/RangeSlider/RangeSlider.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { getContext } from 'svelte';

	let { newGUIID } = getContext('graphSettings') as GraphSettingsClass;

	let { decoratorSetting }: { decoratorSetting: DecoratorSetting } = $props();

	let decoratorID = 0;

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
						<select bind:value={decorator.type} class="bg-transparent">
							{#each decoratorSetting.types as decoratorType}
								<option value={decoratorType}>{decoratorType}</option>
							{/each}
						</select>

						<button
							class="ml-auto flex items-center buttonGeneral"
							id={index.toString()}
							onclick={removeDecorator}
						>
							<span class="material-symbols-outlined"> close </span>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
