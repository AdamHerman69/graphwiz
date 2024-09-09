<script lang="ts">
	import { graphCharacteristics } from '../utils/graph.svelte';
</script>

<div>
	<div class="flex justify-between items-center">
		{#each Object.keys(graphCharacteristics) as key}
			<div class="text-sm">{key} : {graphCharacteristics[key].value}</div>
		{/each}
	</div>
</div>
