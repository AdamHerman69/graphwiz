<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Canvas from '../components/Canvas.svelte';
	import { setContext, untrack, onMount } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { importGraphJSON } from '../utils/graph.svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import homepageGraph from '../assets/homepageGraph_noAttrs.json';
	import { loadCitationNetwork } from '../utils/graph.svelte';
	import * as d3 from 'd3';

	let additionalContentEl: HTMLDivElement;

	// Transform state for the form
	// let x = $state(500);
	// let y = $state(-100);
	// let scale = $state(0.7);

	// $effect(() => {
	// 	const transform = d3.zoomIdentity.translate(x, y).scale(scale);
	// 	untrack(() => {
	// 		canvasHandler.changeTransform(transform);
	// 	});
	// });

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
		// Start the first pulse shortly after load, then repeat every 5 seconds.
		setTimeout(triggerPulse, 500);
		pulseTriggerInterval = setInterval(triggerPulse, 5000);

		// Add the global mousemove listener
		window.addEventListener('mousemove', handleRepulse);

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						console.log('intersecting');
						const transform = d3.zoomIdentity.translate(100, 300).scale(0.2);
						canvasHandler.tweenTransform(transform, 0.4);
					} else {
						console.log('not intersecting');
						const transform = d3.zoomIdentity.translate(500, -240).scale(0.7);
						canvasHandler.tweenTransform(transform, 0.4);
					}
				});
			},
			{
				threshold: 0.5 // When 50% of the element is visible
			}
		);

		observer.observe(additionalContentEl);

		return () => {
			// Cleanup intervals when the component is destroyed.
			if (animationInterval) clearInterval(animationInterval);
			clearInterval(pulseTriggerInterval);

			// Remove the global mousemove listener
			window.removeEventListener('mousemove', handleRepulse);

			// Cleanup the observer
			observer.unobserve(additionalContentEl);
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

<div class="canvas-bg">
	<Canvas homepage={true} />
</div>

<!-- <div class="transform-form">
	<label>
		X:
		<input type="number" step="10" bind:value={x} />
	</label>
	<label>
		Y:
		<input type="number" step="10" bind:value={y} />
	</label>
	<label>
		Zoom:
		<input type="number" step="0.1" min="0.1" max="5" bind:value={scale} />
	</label>
</div> -->

<!-- Fixed logo and right group -->
<div class="fixed-elements">
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

	<div class="right-group">
		<a
			href="https://github.com/adam-mcdaniel/graph-red-pill"
			target="_blank"
			rel="noopener noreferrer"
			class="github-link"
		>
			<img src="/src/assets/github.svg" alt="GitHub" class="github-logo" />
		</a>
		<button class="action-btn" on:click={() => goto('/app?mode=sample')}>launch</button>
	</div>
</div>

<!-- Scrollable content -->
<div class="content-container" in:fade>
	<!-- First section (100vh) -->
	<div class="section first-section">
		<div class="about">
			Visualize graphs with intelligent layout optimization. This tool automatically applies
			research-backed visualization guidelines to generate clear, readable node-link diagrams.
			Simply upload your graph data and let the system select optimal layout algorithms and visual
			settings based on your graph's properties—no manual tweaking required.
		</div>
	</div>

	<!-- Second section (100vh) -->
	<div class="section second-section">
		<div class="additional-content" bind:this={additionalContentEl}>
			<p class="content-paragraph">
				Our intelligent system analyzes your graph's structure, density, and node relationships to
				automatically select the most appropriate layout algorithm. Whether you're working with
				hierarchical data, social networks, or complex knowledge graphs, the system adapts to
				provide optimal visual clarity.
			</p>
			<p class="content-paragraph">
				Built on decades of graph visualization research, graphWHIZ incorporates proven design
				principles and best practices. The result is professional-quality visualizations that
				effectively communicate your data's structure and relationships without requiring
				specialized design expertise.
			</p>
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

	/* Global scroll fix */
	:global(body) {
		overflow-y: auto;
		height: 200vh;
	}

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

	/* Fixed elements (logo and right group) */
	.fixed-elements {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 2;
		pointer-events: none;
	}

	.logo-block {
		position: absolute;
		bottom: 3vw;
		left: 3vw;
		pointer-events: auto;
	}

	.logo {
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

	.right-group {
		position: absolute;
		bottom: 3vw;
		right: 3vw;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1.5em;
		pointer-events: auto;
	}

	/* Scrollable content */
	.content-container {
		position: relative;
		width: 100vw;
		height: 200vh;
		z-index: 1;
	}

	.section {
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: flex-end;
		padding: 0 3vw 2vw 3vw;
		box-sizing: border-box;
	}

	.first-section {
		justify-content: flex-start;
	}

	.second-section {
		justify-content: flex-start;
		align-items: flex-start;
		flex-direction: column;
		gap: 2rem;
	}

	.about {
		font-size: 1rem;
		max-width: 28vw;
		color: #222;
		font-family: 'UncutSans';
		font-weight: 400;
		line-height: 1.1;
		margin-left: 400px; /* Align with logo width + gap */
	}

	.additional-content {
		max-width: 60vw;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-left: 400px; /* Align with logo width + gap */
	}

	.content-paragraph {
		max-width: 28vw;

		font-size: 1rem;
		color: #222;
		font-family: 'UncutSans';
		font-weight: 400;
		line-height: 1.1;
		margin: 0;
		margin-top: 40vh;
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

	.transform-form {
		position: fixed;
		top: 20px;
		left: 20px;
		background-color: rgba(255, 255, 255, 0.8);
		padding: 10px;
		border-radius: 8px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 5px;
		backdrop-filter: blur(5px);
	}

	.transform-form label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'UncutSans';
		font-size: 14px;
	}

	.transform-form input {
		width: 80px;
		margin-left: 10px;
		border-radius: 4px;
		border: 1px solid #ccc;
		padding: 2px 5px;
	}
</style>
