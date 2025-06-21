<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Canvas from '../components/Canvas.svelte';
	import { setContext } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { importGraphJSON } from '../utils/graph.svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import homepageGraph from '../assets/homepageGraph_noAttrs.json';
	import { loadCitationNetwork } from '../utils/graph.svelte';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

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

	// Pixelation effect state using a "shift register" approach
	const title = 'graphWHIZ';
	const pixelationCycle = [
		'regular',
		'10',
		'20',
		'35',
		'50',
		'70',
		'100',
		'70',
		'50',
		'35',
		'20',
		'10'
	];
	const cycleLength = pixelationCycle.length;

	// Each letter has an index into the pixelationCycle
	let letterLevelIndices = $state(Array(title.length).fill(0));
	let animationInterval: number | undefined = undefined;
	let pulseTriggerInterval: number;
	let isAnimating = $state(false);

	function triggerPulse() {
		if (isAnimating) return;
		isAnimating = true;

		let step = 0;
		// Total steps for the wave to be created and fully disappear off the end.
		const totalSteps = title.length + cycleLength;

		animationInterval = setInterval(() => {
			if (step >= totalSteps) {
				clearInterval(animationInterval);
				animationInterval = undefined;
				isAnimating = false;
				letterLevelIndices = Array(title.length).fill(0); // Ensure clean state
				return;
			}

			const newIndices = [...letterLevelIndices];

			// A "virtual" letter at index -1 acts as the wave's source.
			// It pulses once through the cycle, then stays at 0.
			let sourceLevelIndex;
			if (step < cycleLength) {
				sourceLevelIndex = step;
			} else {
				sourceLevelIndex = 0; // Source stops emitting the pulse.
			}

			newIndices[0] = sourceLevelIndex;

			// Each subsequent letter takes the *previous* state of the one before it.
			for (let i = 1; i < title.length; i++) {
				newIndices[i] = letterLevelIndices[i - 1];
			}

			letterLevelIndices = newIndices;
			step++;
		}, 60); // A fast interval for the pulse itself.
	}

	onMount(() => {
		canvasHandler.changeTransform(d3.zoomIdentity.translate(500, 50).scale(0.5));

		// Start the first pulse shortly after load, then repeat every 5 seconds.
		setTimeout(triggerPulse, 500);
		pulseTriggerInterval = setInterval(triggerPulse, 5000);

		return () => {
			// Cleanup intervals when the component is destroyed.
			if (animationInterval) clearInterval(animationInterval);
			clearInterval(pulseTriggerInterval);
		};
	});

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
</script>

<div class="canvas-bg" on:mousemove={handleRepulse}>
	<Canvas homepage={true} />
</div>

<div class="landing-root" in:fade>
	<!-- Main content anchored to bottom -->
	<div class="bottom-row">
		<div class="left-group">
			<div class="logo-block">
				<div class="logo">
					{#each title.split('') as letter, i}
						<span
							class="logo-letter"
							class:logo-graph={i < 5}
							class:pixelated={pixelationCycle[letterLevelIndices[i]] !== 'regular'}
							style="--pixelation-level: {pixelationCycle[letterLevelIndices[i]]}"
						>
							{letter}
						</span>
					{/each}
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
			<a
				href="https://github.com/adam-mcdaniel/graph-red-pill"
				target="_blank"
				rel="noopener noreferrer"
				class="github-link"
			>
				<img src="/src/assets/github.svg" alt="GitHub" class="github-logo" />
			</a>
			<!-- <button class="action-btn" on:click={() => goto('/app?mode=upload')}>load your data</button> -->
			<button class="action-btn" on:click={() => goto('/app?mode=sample')}>launch</button>
		</div>
	</div>
</div>

<style>
	@font-face {
		font-family: 'Redaction';
		src: url('/src/assets/font/Redaction-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-100';
		src: url('/src/assets/font/Redaction_100-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-70';
		src: url('/src/assets/font/Redaction_70-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-50';
		src: url('/src/assets/font/Redaction_50-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-35';
		src: url('/src/assets/font/Redaction_35-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-20';
		src: url('/src/assets/font/Redaction_20-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'Redaction-10';
		src: url('/src/assets/font/Redaction_10-Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
	}

	/* .canvas-bg {
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
	} */

	.canvas-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		background: radial-gradient(
			circle at 60% 40%,
			rgba(86, 0, 129, 0.2) 0%,
			rgba(232, 232, 232, 0) 70%
		);
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
		min-width: 22rem;
	}

	.logo {
		/* color: var(--default-bg-color); */
		font-family: serif;
		font-size: 4rem;
		font-weight: 400;
		line-height: 1;
	}

	.logo-letter {
		transition: font-family 0.1s ease;
	}

	.logo-letter[style='--pixelation-level: regular'] {
		font-family: 'Redaction';
	}

	.logo-letter[style='--pixelation-level: 100'] {
		font-family: 'Redaction-100';
	}

	.logo-letter[style='--pixelation-level: 70'] {
		font-family: 'Redaction-70';
	}

	.logo-letter[style='--pixelation-level: 50'] {
		font-family: 'Redaction-50';
	}

	.logo-letter[style='--pixelation-level: 35'] {
		font-family: 'Redaction-35';
	}

	.logo-letter[style='--pixelation-level: 20'] {
		font-family: 'Redaction-20';
	}

	.logo-letter[style='--pixelation-level: 10'] {
		font-family: 'Redaction-10';
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
		font-family: 'UncutSans';
		font-weight: 400;
		line-height: 1.1;
		margin-bottom: 0.5vw;
	}

	.github-link {
		width: 20px;
		height: 20px;
		display: block;
		color: #222;
		transition: color 0.2s;
	}

	.github-link:hover {
		color: #000;
	}

	.github-logo {
		width: 100%;
		height: 100%;
	}

	.right-group {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1.5em;
	}

	.action-btn {
		text-transform: uppercase;
		background: none;
		border: none;
		font-size: 14px;
		font-family: 'UncutSans';
		font-weight: 500;
		cursor: pointer;
		padding: 5px 40px;
		transition: all 0.2s;
		text-align: right;
		border-radius: 8px;
		background-color: #f0f0f0;
		color: #222;
		border: 1px solid #222;
		transition: all 0.2s;
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}

	.action-btn:hover {
		background-color: #222;
		color: #f0f0f0;
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.4);
	}
</style>
