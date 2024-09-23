<script lang="ts">
	import type { GraphSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import { getContext } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import CustomSelect from './GUI/CustomSelect.svelte';

	let graphSettings: GraphSettings = getContext('graphSettings').graphSettings;

	let collapsed = $state(false);
</script>

<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing relative">
	<SettingsHeader title="layout" bind:collapsed />
	{#if !collapsed}
		<div use:autoAnimate={{ duration: 300 }} class="flex my-2 justify-between">
			<div class="flex items-center settingName">ALGORITHM</div>
			<!-- <select bind:value={graphSettings.layout.value} class="bg-transparent ml-auto">
				{#each graphSettings.layout.values as val}
					<option value={val}>{val}</option>
				{/each}
			</select> -->

			<CustomSelect
				bind:selected={graphSettings.layout.value}
				values={graphSettings.layout.values}
				alignRight={true}
				width={140}
			/>
		</div>
	{/if}
</div>

<style>
</style>
