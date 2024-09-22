<script lang="ts">
	import { onMount } from 'svelte';
	import { isComposite, type Condition } from '../utils/guideline.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { getContext } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { assignGUIIDsToConditions } from '../utils/guideline.svelte';
	import { graphCharacteristics } from '../utils/graph.svelte';
	import HoverButton from './GUI/HoverButton.svelte';

	let { weightedCondition = $bindable() }: { weightedCondition: WeightedCondition } = $props();

	function deleteFunction(index: number) {
		weightedCondition.condition.conditions.splice(index, 1);
	}

	let { newGUIID } = getContext('graphSettings') as GraphSettingsClass;

	assignGUIIDsToConditions(weightedCondition, newGUIID);

	function addCondition(type: 'boolean' | 'range' | 'string' | 'numeric' | 'composite') {
		const getDefaultProperty = (propertyType: 'number' | 'boolean' | 'string') => {
			const properties = Object.entries(graphCharacteristics)
				.filter(([, value]) => value.type === propertyType)
				.map(([key]) => key);
			return properties[0] || 'nodeCount'; // Fallback to 'nodeCount' if no properties of the specified type
		};

		let newCondition: Condition;

		switch (type) {
			case 'boolean':
				newCondition = {
					type: 'boolean',
					property: getDefaultProperty('boolean'),
					value: true
				};
				break;
			case 'range':
			case 'numeric':
				newCondition = {
					type: type,
					property: getDefaultProperty('number'),
					min: 0,
					max: 0
				};
				break;
			case 'string':
				newCondition = {
					type: 'string',
					property: getDefaultProperty('string'),
					value: ''
				};
				break;
			case 'composite':
				newCondition = {
					type: 'composite',
					conditions: []
				};
				break;
			default:
				throw new Error(`Invalid condition type: ${type}`);
		}

		weightedCondition.condition.conditions.push({
			GUIID: newGUIID(),
			condition: newCondition,
			weight: 1
		});
	}
</script>

<div use:autoAnimate class="mt-1 p-2 labelContainer">
	<div class="pb-1" use:autoAnimate>
		{#if isComposite(weightedCondition.condition)}
			{#each weightedCondition.condition.conditions as wc, index (wc.GUIID)}
				<!-- <div class="labelContainer"> -->
				<WeightedCondition
					weightedCondition={wc}
					editable={true}
					deleteFunction={() => deleteFunction(index)}
				/>
				<!-- </div> -->
				<div
					class={`${index < weightedCondition.condition.conditions.length - 1 ? 'border-b border-gray-200' : ''}`}
				></div>
			{/each}
			<div class="border-b border-gray-200"></div>
			<div class="flex my-1 gap-1 overflow-scroll items-center">
				<span class="plusSign material-symbols-outlined"> add </span>
				<button onclick={() => addCondition('boolean')}
					><HoverButton icon="check_box" text="boolean" />
				</button>
				<button onclick={() => addCondition('numeric')}
					><HoverButton icon="pin_drop" text="numeric" />
				</button>
				<button onclick={() => addCondition('range')}
					><HoverButton icon="arrow_range" text="range" />
				</button>
				<button onclick={() => addCondition('string')}
					><HoverButton icon="spellcheck" text="string" />
				</button>
				<button onclick={() => addCondition('composite')}
					><HoverButton icon="layers" text="composite" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.plusSign {
		transition: all 0.2s ease-in-out;
	}

	.plusSign:hover {
		margin-right: 5px;
		cursor: default;
	}
</style>
