<script lang="ts">
	import Dropzone from '$lib/fileDropZone/src/lib/components/Dropzone.svelte';
	import { isValidSettings, importSettings } from '../utils/graphSettings.svelte';
	import { isValidGraph, importGraphJSON, importGraphOther } from '../utils/graph.svelte';
	import { parse } from 'svelte/compiler';

	let { closeMenu }: { closeMenu: () => void } = $props();

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
				importSettings(parsed.settings);
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

<Dropzone on:drop={handleFile} accept=".graphml, .gexf, .json" multiple={false} />
