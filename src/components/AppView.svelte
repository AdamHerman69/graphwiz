<script lang="ts">
	import Canvas from './Canvas.svelte';
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { setContext } from 'svelte';
	import { blur } from 'svelte/transition';

	const graphSettings = new GraphSettingsClass();
	console.log('created GS', graphSettings.stateIndex);
	setContext<GraphSettingsClass>('graphSettings', graphSettings);

	let { side }: { side: 'left' | 'right' } = $props();
</script>

<Canvas />
<div
	transition:blur
	class="absolute {side === 'right'
		? 'right-1'
		: 'left-1'} 1 top-0 settingsPanel z-10 text-sm h-full"
>
	<GraphSettingsPanel />
	<!-- <button onclick={() => console.log($state.snapshot(graphSettings.graphSettings))}>log</button> -->
	<!-- todo delete -->
</div>
