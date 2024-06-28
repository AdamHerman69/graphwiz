<script lang="ts">
	import type { GraphSettings } from '../utils/graphSettings.svelte';
	import SettingsHeader from './SettingsHeader.svelte';
	import { getContext } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';

	let graphSettings: GraphSettings = getContext('graphSettings').graphSettings;

	let collapsed = $state(false);
</script>

<div use:autoAnimate={{ duration: 300 }} class="card cardSpacing mt-10">
	<SettingsHeader title="layout" bind:collapsed />
	{#if !collapsed}
		<div use:autoAnimate={{ duration: 300 }} class="flex mx-2 my-2">
			<div>ALGORITHM</div>
			<select bind:value={graphSettings.layout.value} class="bg-transparent ml-auto">
				{#each graphSettings.layout.values as val}
					<option value={val}>{val}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
