<script lang="ts">
	import { onMount } from 'svelte';
	import { type Attribute, availableAttributes } from '../utils/graph.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';
	import { bin } from 'd3';

	let {
		selectedAttribute = $bindable(),
		filter,
		disabled = false,
		alignRight = false
	}: {
		selectedAttribute: Attribute | undefined;
		filter: (attribute: Attribute) => boolean;
		disabled: boolean;
		alignRight?: boolean;
	} = $props();

	let filteredAttributes = $derived(availableAttributes.filter(filter));
	let attributeNames = $derived(filteredAttributes.map((attribute) => attribute.name));
	let selectedAttributeName: string = $state(attributeNames.length > 0 ? attributeNames[0] : 'prd');

	let select: HTMLSelectElement;
	function handleChange(index: number) {
		selectedAttribute = filteredAttributes[index];
		//console.log('handle change', selectedAttribute);
	}

	// todo bug attributes shown which don't have values for all nodes

	// for state changes not coming from this component
	$effect(() => {
		if (
			selectedAttributeName != selectedAttribute?.name &&
			attributeNames.includes(selectedAttribute?.name!)
		)
			selectedAttributeName = selectedAttribute?.name!;

		// if attribute name is not in filtered attributes, set to first
		if (!attributeNames.includes(selectedAttributeName)) {
			selectedAttributeName = attributeNames[0];
		}
	});
</script>

<!-- <select bind:this={select} onchange={handleChange} class="bg-transparent" {disabled}>
	{#each filteredAttributes as attribute}
		<option value={attribute.name}>{attribute.name}</option>
	{/each}
</select> -->
<CustomSelect
	selected={selectedAttributeName}
	values={filteredAttributes.map((attribute) => attribute.name)}
	width={150}
	onChange={handleChange}
	{alignRight}
	fontSize={12}
/>
<!-- TODO doesn't work now - doesn't select -->
