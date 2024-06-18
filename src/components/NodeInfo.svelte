<script lang="ts">
	import { fileAccepted } from '$lib/fileDropZone/src/lib/utils';
	import { filter } from 'd3';
	import { getAttributeValue, availableAttributes } from '../utils/graph.svelte';
	import { blur } from 'svelte/transition';

	let { nodeID }: { nodeID: string } = $props();
</script>

{#snippet attributeDisplay({ name, value }: { name: string, value: string })}
	<div class="m-2">
		<div class="text-xl">{value ? value : '-'}</div>
		<div class="text-xs text-gray-700">{name}</div>
	</div>
{/snippet}

<div class="card p-4" transition:blur>
	<p>Node detail</p>
	<div class="flex">
		{#each availableAttributes.filter((attribute) => attribute.owner === 'node') as attribute}
			{@render attributeDisplay({
				name: attribute.name,
				value: getAttributeValue(nodeID, attribute)?.toString()
			})}
		{/each}
	</div>
</div>

<style>
	p {
		text-transform: uppercase;
		text-align: center;
	}
</style>
