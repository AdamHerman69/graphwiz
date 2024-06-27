<script lang="ts">
	import Canvas from './Canvas.svelte';
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';
	import { graphSettings } from '../utils/graphSettings.svelte';
</script>

<Canvas />
<div class="absolute right-1 top-0 settingsPanel z-10 text-sm h-full">
	<GraphSettingsPanel />
	<button onclick={() => console.log($state.snapshot(graphSettings))}>log</button>
	<!-- todo delete -->
</div>
