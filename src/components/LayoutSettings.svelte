<script lang="ts">
	import type { GraphSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import { getContext } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import CustomSelect from './GUI/CustomSelect.svelte';
	import SettingsSelect from './SettingsSelect.svelte';

	let graphSettings: GraphSettings = getContext('graphSettings').graphSettings;

	let collapsed = $state(false);
</script>

<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing relative">
	<SettingsHeader title="layout" bind:collapsed />
	{#if !collapsed}
		<!-- <div use:autoAnimate={{ duration: 300 }} class="flex my-2 justify-between">
			<div class="flex items-center settingName">ALGORITHM</div>

			<CustomSelect
				bind:selected={graphSettings.layout.value}
				values={graphSettings.layout.values}
				alignRight={true}
				width={140}
			/>
		</div> -->
		<SettingsSelect selectSetting={graphSettings.layout} />
		<SettingsSelect selectSetting={graphSettings.edgeLayout} />
	{/if}
</div>

<style>
</style>
