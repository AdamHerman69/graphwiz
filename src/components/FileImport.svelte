<script lang="ts">
	import Dropzone from '$lib/fileDropZone/src/lib/components/Dropzone.svelte';
	import { isValidSettings, type GraphSettings } from '../utils/graphSettings.svelte';
	import { isValidGraph, importGraphJSON, importGraphOther } from '../utils/graph.svelte';
	import { parse } from 'svelte/compiler';
	import { getContext } from 'svelte';
	import { type Guideline, importGuidelines } from '../utils/guideline.svelte';
	import { generateGraph } from '../utils/graph.svelte';

	let {
		importState,
		closeMenu
	}: { importState: (graphSettings: GraphSettings) => void; closeMenu: () => void } = $props();

	let newGUIID = getContext('arbitraryGUIDI') as () => number;

	// generate graph options
	let order = $state(100);
	let size = $state(300);
	let clusters = $state(5);
	let clusterDensity = $state(0.8);

	// TODO: fix flow and error handeling
	async function handleFile(e: Event) {
		const file: File = e.detail.acceptedFiles[0];
		console.log('file: ', file);
		if (!file) {
			// TODO handle file upload fail
			console.log('file upload failed');
			return;
		}
		if (file.type === 'application/json') {
			try {
				const jsonString = await file.text();
				handleJSON(jsonString);
				closeMenu();
				// todo toast
			} catch (error) {
				console.log('JSON import failed:', error);
			}
		} else {
			// other formats
			try {
				const graphString = await file.text();
				importGraphOther(graphString);
				closeMenu();
				console.log('Graph Import successful');
				// todo toast
			} catch (error) {
				// todo toast
				console.log('Graph Import failed: ', error);
			}
		}
	}

	function handleJSON(json: string): void {
		try {
			const parsed = JSON.parse(json);
			let imported = false;
			// order important
			if (parsed.hasOwnProperty('graph') && isValidGraph(parsed.graph)) {
				importGraphJSON(parsed.graph);
				imported = true;
			}
			if (parsed.hasOwnProperty('settings') && isValidSettings(parsed.settings)) {
				// todo full state import binding gone on import
				importState(parsed.settings);
				imported = true;
			}
			if (parsed.hasOwnProperty('guidelines')) {
				importGuidelines(parsed.guidelines, newGUIID);
				imported = true;
			}

			if (!imported) {
				console.log('JSON import failed: invalid format');
			}
		} catch (error) {
			console.log('JSON import failed:', error);
		}
	}
</script>

<div class="flex flex-col w-full h-full">
	<div class="flex-grow">
		<Dropzone on:drop={handleFile} accept=".graphml, .gexf, .json" multiple={false} />
	</div>
	<div class="graphGenerator flex">
		<input type="number" bind:value={order} placeholder="Order" />
		<input type="number" bind:value={size} placeholder="Size" />
		<input type="number" bind:value={clusters} placeholder="Clusters" />
		<input type="number" bind:value={clusterDensity} placeholder="Cluster Density" />
		<button
			onclick={() => {
				generateGraph(order, size, clusters, clusterDensity);
				closeMenu();
			}}>generate</button
		>
	</div>
</div>

<style>
	.graphGenerator {
		color: white;
	}

	.graphGenerator input {
		width: 80px;
	}
</style>
