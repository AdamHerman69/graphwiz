<script lang="ts">
	import type { SelectSetting } from '../utils/graphSettings.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let { selectSetting }: { selectSetting: SelectSetting } = $props();
</script>

<div class="flex justify-between items-center">
	<div class="settingName">
		{selectSetting.name}

		<!-- {numSettings.source} -->
	</div>
	<div class="flex justify-end items-center">
		<!-- <select bind:value={selectSetting.value} class="bg-transparent">
			{#each selectSetting.values as value}
				<option {value}>{value}</option>
			{/each}
		</select> -->
		{#if selectSetting.loading}
			<span class="loading material-symbols-outlined"> autorenew </span>
		{/if}
		<CustomSelect
			bind:selected={selectSetting.value}
			values={selectSetting.values}
			alignRight={true}
		/>
	</div>
</div>

<style>
	.loading {
		animation: spin 1s linear infinite;
		font-size: 15px;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
