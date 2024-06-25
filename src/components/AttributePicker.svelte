<script lang="ts">
	import { onMount } from 'svelte';
	import { type Attribute, availableAttributes } from '../utils/graph.svelte';

	let {
		selectedAttribute = $bindable(),
		filter
	}: { selectedAttribute: Attribute | undefined; filter: (attribute: Attribute) => boolean } =
		$props();

	let filteredAttributes = $derived(availableAttributes.filter(filter));

	let select: HTMLSelectElement;
	function handleChange() {
		selectedAttribute = filteredAttributes[select.selectedIndex];
		//console.log('handle change', selectedAttribute);
	}

	// todo bug attributes shown which don't have values for all nodes

	// for state changes not coming from this component
	$effect(() => {
		if (select.value != selectedAttribute?.name) {
			select.value = selectedAttribute?.name!;
			//console.log('effect actually did something');
		}
		//console.log('effect ran');
	});
</script>

<select bind:this={select} onchange={handleChange} class="bg-transparent">
	{#each filteredAttributes as attribute}
		<option value={attribute.name}>{attribute.name}</option>
	{/each}
</select>
