<script lang="ts">
	import { type WeightedCondition } from '../utils/guideline.svelte';
	import { availableAttributes } from '../utils/graph.svelte';
	import { bin } from 'd3';

	let { weightedCondition = $bindable() }: { weightedCondition: WeightedCondition } = $props();

	$effect(() => {
		if (weightedCondition.condition.type === 'numeric' && !weightedCondition.condition.property) {
			weightedCondition.condition.property = availableAttributes[0].name;
		}
	});

	function updateConditionType(type: string) {
		if (type === 'numeric') {
			weightedCondition.condition = {
				type: 'numeric',
				property: availableAttributes[0].name,
				ideal: 0,
				tolerance: 0
			};
		} else if (type === 'boolean') {
			weightedCondition.condition = {
				type: 'boolean',
				property: availableAttributes[0].name,
				value: true
			};
		} else if (type === 'string') {
			weightedCondition.condition = {
				type: 'string',
				property: availableAttributes[0].name,
				value: ''
			};
		}
	}
</script>

<div class="condition-editor">
	<select
		bind:value={weightedCondition.condition.type}
		on:change={(e) => updateConditionType(e.target.value)}
	>
		<option value="numeric">Numeric</option>
		<option value="boolean">Boolean</option>
		<option value="string">String</option>
	</select>

	<input type="number" bind:value={weightedCondition.weight} min="0" step="0.1" />

	<select bind:value={weightedCondition.condition.property}>
		{#each availableAttributes as attribute}
			<option value={attribute.name}>{attribute.name}</option>
		{/each}
	</select>

	{#if weightedCondition.condition.type === 'numeric'}
		<input type="number" bind:value={weightedCondition.condition.ideal} placeholder="Ideal" />
		<input
			type="number"
			bind:value={weightedCondition.condition.tolerance}
			placeholder="Tolerance"
		/>
	{:else if weightedCondition.condition.type === 'boolean'}
		<select bind:value={weightedCondition.condition.value}>
			<option value={true}>True</option>
			<option value={false}>False</option>
		</select>
	{:else if weightedCondition.condition.type === 'string'}
		<input type="text" bind:value={weightedCondition.condition.value} placeholder="Value" />
	{/if}
</div>

<style>
	.condition-editor {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	select,
	input {
		padding: 0.25rem;
	}
</style>
