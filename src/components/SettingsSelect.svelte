<script lang="ts">
	import type { SelectSetting } from '../utils/graphSettings.svelte';
	import CustomSelect from './GUI/CustomSelect.svelte';
	import GuidelineSource from './GUI/GuidelineSource.svelte';

	let { selectSetting, onChange }: { selectSetting: SelectSetting; onChange?: () => void } =
		$props();
</script>

<div class="flex justify-between items-center">
	<div class="settingName">
		{selectSetting.name}

		{#if selectSetting.source != null}
			<GuidelineSource guidelineName={selectSetting.source} />
		{/if}
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
			onChange={() => {
				selectSetting.source = null;
				onChange?.();
			}}
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
