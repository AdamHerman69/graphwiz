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
		console.log('handle change', selectedAttribute);
	}

	// todo make work with states - replace with a separate component
	// maybe just don't have anything selected by default

	$effect(() => {
		if (select.value) console.log('value: ', select.value, selectedAttribute);
	});
</script>

<select bind:this={select} onchange={handleChange} class="bg-transparent">
	{#each filteredAttributes as attribute}
		<option value={attribute}>{attribute.name}</option>
	{/each}
</select>
