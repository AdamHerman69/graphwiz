<script lang="ts">
	import { type Attribute, availableAttributes } from '../utils/graph.svelte';

	let {
		selectedAttribute = $bindable(),
		filter
	}: { selectedAttribute: Attribute | undefined; filter: (attribute: Attribute) => boolean } =
		$props();

	let filteredAttributes = $derived(availableAttributes.filter(filter));
</script>

<select bind:value={selectedAttribute} class="bg-transparent">
	{#each filteredAttributes as attribute}
		<option value={attribute}>{attribute.name}</option>
	{/each}
</select>
