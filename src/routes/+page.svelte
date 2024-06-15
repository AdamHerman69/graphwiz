<script lang="ts">
	import GraphSettingsPanel from '../components/GraphSettingsPanel.svelte';
	import { nodeSettings, edgeSettings, layoutSettings } from '../utils/graphSettings.svelte';
</script>

<div class="h-full w-full flex justify-center items-center">
	<!-- <div class="absolute inset-0 z-0"><NodeLinkCanvas /></div> -->
	<div class="h-full w-full flex flex-col mx-2">
		<div class="grow flex justify-between">
			<div class="w-1/5 z-10 p-8 overflow-y-auto h-screen">gp</div>
			<div>
				<!-- {JSON.stringify(layoutSettings, null, 2)} -->
				{JSON.stringify(nodeSettings[0])}
				<br />
				<br />
				<br />
				{JSON.stringify(edgeSettings[0])}
				<!-- {edgeSettings} -->
			</div>
			<div class="settingsPanel z-10 text-sm h-screen">
				<GraphSettingsPanel />
			</div>
		</div>
	</div>
</div>
