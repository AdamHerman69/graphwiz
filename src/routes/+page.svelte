<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Canvas from '../components/Canvas.svelte';
	import { setContext } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { importGraphJSON } from '../utils/graph.svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import homepageGraph from '../assets/homepageGraph.json';

	// Minimal context for Canvas
	const graphSettings = new GraphSettingsClass();
	const canvasHandler = new WebWorkerCanvasHandler();
	canvasHandler.disablePanZoom = true;
	const guidelines: Guideline[] = [];

	setContext('graphSettings', graphSettings);
	setContext('canvasHandler', canvasHandler);
	setContext('guidelines', guidelines);

	// load homepage graph
	importGraphJSON(homepageGraph.graph);
	graphSettings.importState(homepageGraph.settings);

	function handleRepulse(event: MouseEvent) {
		// Only repulse if using force-graph layout
		if (graphSettings.graphSettings.layout?.type?.value === 'force-graph') {
			const rect = canvasHandler.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			canvasHandler.simulationWorker?.postMessage({
				type: 'setCursorForce',
				x,
				y
			});
		}
	}

	function handleMouseLeave() {
		if (graphSettings.graphSettings.layout?.type?.value === 'force-graph') {
			canvasHandler.simulationWorker?.postMessage({
				type: 'clearCursorForce'
			});
		}
	}
</script>

<div class="canvas-bg" on:mousemove={handleRepulse} on:mouseleave={handleMouseLeave}>
	<Canvas homepage={true} />
</div>

<div class="landing-root" in:fade>
	<!-- Main content anchored to bottom -->
	<div class="bottom-row">
		<div class="left-group">
			<div class="logo-block">
				<div class="logo">
					<span class="logo-graph">graph</span><span class="logo-whiz">WHIZ</span>
				</div>
			</div>
			<div class="about">
				Visualize graphs with intelligent layout optimization. This tool automatically applies
				research-backed visualization guidelines to generate clear, readable node-link diagrams.
				Simply upload your graph data and let the system select optimal layout algorithms and visual
				settings based on your graph's properties—no manual tweaking required.
			</div>
		</div>
		<div class="right-group">
			<!-- <button class="action-btn" on:click={() => goto('/app?mode=upload')}>load your data</button> -->
			<button class="action-btn" on:click={() => goto('/app?mode=sample')}>launch</button>
		</div>
	</div>
</div>

<style>
	.canvas-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
	}

	.landing-root {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: transparent;
		z-index: 1;
		pointer-events: none;
	}

	.bottom-row {
		pointer-events: auto;
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		padding: 3vw 3vw 2vw 3vw;
		box-sizing: border-box;
	}

	.left-group {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		gap: 2vw;
		max-width: 60vw;
	}

	.logo-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-end;
		height: 100%;
		min-height: 200px;
	}

	.logo {
		font-family: serif;
		font-size: 4rem;
		font-weight: 400;
		line-height: 1;
	}
	.logo-graph {
		font-style: italic;
	}
	.logo-whiz {
		font-weight: bold;
		margin-left: 0.1em;
	}

	.about {
		font-size: 1rem;
		max-width: 28vw;
		color: #222;
		font-family: serif;
		font-weight: 500;
		line-height: 1.4;
		margin-bottom: 0.5vw;
	}

	.right-group {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1.2em;
	}

	.action-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: white;
		background-color: black;
		border-radius: 10px;
		font-family: 'Inter', Arial, sans-serif;
		font-weight: 500;
		cursor: pointer;
		padding: 20px 40px;
		transition: color 0.2s;
		text-align: right;
	}
	.action-btn:hover {
		color: #4caf50;
		text-decoration: underline;
	}
</style>
