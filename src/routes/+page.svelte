<script lang="ts">
	import GraphSettingsPanel from '../components/GraphSettingsPanel.svelte';
	import { graphSettings } from '../utils/graphSettings.svelte';
	import { loadSampleGraph, computeAttributes } from '../utils/graph.svelte';
	import DynamicIsland from '../components/DynamicIsland.svelte';
	import Canvas from '../components/Canvas.svelte';
</script>

<div class="h-full w-full flex justify-center items-center">
	<div class="absolute inset-0 z-0"><Canvas /></div>
	<div class="h-full w-full flex flex-col mx-2">
		<div class="grow flex justify-between">
			<div class="w-1/5 z-10 p-8 overflow-y-auto h-screen">gp</div>
			<div class="absolute top-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
				<DynamicIsland exportSVG={() => console.log('export svg')} sticky={false} />
			</div>
			<div class="settingsPanel z-10 text-sm h-screen">
				<GraphSettingsPanel />
			</div>
		</div>
	</div>
</div>
