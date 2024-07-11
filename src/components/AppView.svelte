<script lang="ts">
	import Canvas from './Canvas.svelte';
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { onMount, setContext } from 'svelte';
	import { blur } from 'svelte/transition';
	import Guidelines from './Guidelines.svelte';
	import { newGuidelineSet, sortGuidelines, type Guideline } from '../utils/guideline.svelte';
	import { getGraph } from '../utils/graph.svelte';

	const graphSettings = new GraphSettingsClass();
	console.log('created GS', graphSettings.stateIndex);
	setContext<GraphSettingsClass>('graphSettings', graphSettings);

	const guidelines = $state(newGuidelineSet(graphSettings));
	sortGuidelines(guidelines, getGraph());
	setContext<Guideline[]>('guidelines', guidelines);

	let { side }: { side: 'left' | 'right' } = $props();

	let showGuidelines = $state(false);

	onMount(() => {
		console.log('mounted AppView');
		// clear saves triggered by initializing
		graphSettings.clearUndoStack();
		graphSettings.saveState();
	});
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

{#if showGuidelines}
	<div
		transition:blur
		class="absolute {side === 'right'
			? 'left-1'
			: 'right-1'} 1 top-0 settingsPanel z-10 text-sm h-full"
	>
		<Guidelines />

		<!-- <button onclick={() => console.log($state.snapshot(graphSettings.graphSettings))}>log</button> -->
		<!-- todo delete -->
	</div>
{/if}

<button
	class="absolute top-0 text-sm z-20 {side === 'right' ? 'left-1' : 'right-1'}"
	onclick={() => (showGuidelines = !showGuidelines)}
>
	toggle guidelines
</button>
