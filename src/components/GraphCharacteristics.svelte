<script lang="ts">
	import { graphCharacteristics } from '../utils/graph.svelte';
	import { formatDecimal } from '../utils/helperFunctions';
</script>

<div>
	<div class="flex justify-between items-center">
		{#each Object.keys(graphCharacteristics) as key}
			{#if key != 'task'}
				<div class="p-4">
					<div class="value">
						{#if graphCharacteristics[key].type === 'string'}
							{graphCharacteristics[key].value}
						{:else if graphCharacteristics[key].type === 'number'}
							{formatDecimal(graphCharacteristics[key].value as number, 2)}
						{:else if graphCharacteristics[key].type === 'boolean'}
							<span class="material-symbols-outlined"
								>{graphCharacteristics[key].value ? 'check' : 'close'}</span
							>
						{/if}
					</div>
					<div class="heading">{key}</div>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.heading {
		text-transform: uppercase;
		font-size: 8px;
		max-width: 150px;
		line-height: 1.3;
	}
	.value {
		font-size: 12px;
		font-weight: bold;
		display: flex;
	}

	span.material-symbols-outlined {
		font-size: 18px;
		margin-left: -4px;
	}
</style>
