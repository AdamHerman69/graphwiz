<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Canvas from '../components/Canvas.svelte';
	import { setContext, untrack, onMount } from 'svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { WebWorkerCanvasHandler } from '../utils/canvas.svelte';
	import { importGraphJSON } from '../utils/graph.svelte';
	import { loadCitationNetwork } from '../utils/graph.svelte';
	import * as d3 from 'd3';
	import NodeSettings from '../components/NodeSettings.svelte';
	import GuidelineCard from '../components/GuidelineCard.svelte';
	import type { Guideline } from '../utils/guideline.svelte';
	import homepageGraph from '../assets/homepageGraph.json';

	let guideline: Guideline = $state({
		name: 'Avoid node-edge crossings',
		description:
			'Minimize visual clutter by reducing the number of edges that cross over nodes. This improves readability and makes the graph structure easier to understand.',
		literature: ['10.1145/1518701.1519054'],
		rootCondition: {
			weight: 1,
			condition: {
				type: 'composite',
				conditions: [
					{
						weight: 1,
						condition: {
							type: 'numeric',
							property: 'nodeCount',
							min: 10,
							max: 500,
							ideal: 100,
							tolerance: 200
						},
						weightNormalized: 1,
						score: 0,
						scoreWeighted: 0
					}
				]
			}
		},
		recommendations: {
			layout: {
				type: {
					name: 'layout',
					values: ['force-graph', 'stress', 'disco'],
					value: 'force-graph',
					source: null,
					loading: false
				},
				edgeType: {
					name: 'edgeLayout',
					values: ['straight', 'orthogonal', 'bundled'],
					value: 'straight',
					source: null,
					loading: false
				}
			},
			nodeSettings: [
				{
					shape: {
						name: 'shape',
						values: ['circle', 'square', 'triangle'],
						value: 'circle',
						source: null
					},
					size: {
						name: 'size',
						value: 8,
						min: 2,
						max: 20,
						increment: 1,
						source: null
					},
					id: 1,
					priority: 0,
					source: null
				}
			]
		},
		id: 1,
		score: 0.85,
		status: {
			applied: 'notApplied',
			conflicts: []
		},
		expanded: false,
		parentDiv: undefined,
		editedGuideline: undefined
	});
	const expand = () => {}; // No-op for the homepage

	let additionalContentEl: HTMLDivElement;
	let ticking = false;

	// Detect if we're on mobile
	let isMobile = $state(false);

	// Desktop keyframes
	const scrollKeyframesDesktop = [
		{ progress: 0, x: -200, y: -240, scale: 0.7 },
		{ progress: 0.2, x: 180, y: 350, scale: 0.3 },
		{ progress: 0.38, x: 180, y: 280, scale: 0.3 },
		{ progress: 0.55, x: 800, y: 350, scale: 0.3 },
		{ progress: 0.75, x: 800, y: 280, scale: 0.3 },
		{ progress: 1, x: 50, y: -400, scale: 0.7 }
	];

	// Mobile keyframes - more conservative movements
	const scrollKeyframesMobile = [{ progress: 0, x: -50, y: -300, scale: 0.6 }];

	// Tablet keyframes - intermediate between desktop and mobile
	const scrollKeyframesTablet = [
		{ progress: 0, x: -100, y: -150, scale: 0.65 },
		{ progress: 0.2, x: 100, y: 350, scale: 0.25 },
		{ progress: 0.4, x: 100, y: 280, scale: 0.25 },
		{ progress: 0.6, x: 400, y: 350, scale: 0.25 },
		{ progress: 0.8, x: 400, y: 280, scale: 0.25 },
		{ progress: 1, x: 100, y: -300, scale: 0.65 }
	];

	function getScrollKeyframes() {
		const width = window.innerWidth;
		if (width < 451) {
			return scrollKeyframesMobile;
		} else if (width < 1024) {
			return scrollKeyframesTablet;
		} else {
			return scrollKeyframesDesktop;
		}
	}

	function checkMobile() {
		isMobile = window.innerWidth < 451;
	}

	function handleScroll() {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				updateTransform();
				ticking = false;
			});
			ticking = true;
		}
	}

	function updateTransform() {
		// Get the content-container element
		const contentContainer = document.querySelector('.content-container') as HTMLElement;
		if (!contentContainer) return;

		const rect = contentContainer.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const contentHeight = contentContainer.scrollHeight;

		// Calculate progress from 0 (content top at viewport top) to 1 (content bottom at viewport bottom)
		// When content top is at viewport top: rect.top = 0, progress = 0
		// When content bottom is at viewport bottom: rect.bottom = viewportHeight, progress = 1
		let progress = -rect.top / (contentHeight - viewportHeight);
		progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

		const scrollKeyframes = getScrollKeyframes();

		// Find the two keyframes to interpolate between
		const endKeyframeIndex = scrollKeyframes.findIndex((k) => k.progress >= progress);
		const startKeyframeIndex = Math.max(0, endKeyframeIndex - 1);
		const start = scrollKeyframes[startKeyframeIndex];
		const end = scrollKeyframes[endKeyframeIndex] || start;

		// Calculate the progress between the current keyframes
		const keyframeProgress =
			end.progress === start.progress
				? 1
				: (progress - start.progress) / (end.progress - start.progress);

		// Linear interpolation
		const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
		const x = lerp(start.x, end.x, keyframeProgress);
		const y = lerp(start.y, end.y, keyframeProgress);
		const scale = lerp(start.scale, end.scale, keyframeProgress);

		const transform = d3.zoomIdentity.translate(x, y).scale(scale);
		canvasHandler.changeTransform(transform);
	}

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
	const title = 'graphwhiz';
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

		// Set initial transform based on screen size
		const keyframes = getScrollKeyframes();
		const initialTransform = d3.zoomIdentity
			.translate(keyframes[0].x, keyframes[0].y)
			.scale(keyframes[0].scale);
		canvasHandler.changeTransform(initialTransform);

		// Check mobile on mount
		checkMobile();

		// Add the global mousemove listener
		window.addEventListener('mousemove', handleRepulse);
		window.addEventListener('touchmove', handleTouchRepulse);
		window.addEventListener('touchstart', handleTouchRepulse);
		document.body.addEventListener('scroll', handleScroll);
		window.addEventListener('resize', checkMobile);

		return () => {
			// Cleanup intervals when the component is destroyed.
			if (animationInterval) clearInterval(animationInterval);
			clearInterval(pulseTriggerInterval);

			// Remove the global mousemove listener
			window.removeEventListener('mousemove', handleRepulse);
			window.removeEventListener('touchmove', handleTouchRepulse);
			window.removeEventListener('touchstart', handleTouchRepulse);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', checkMobile);
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

	function handleTouchRepulse(event: TouchEvent) {
		// Only repulse if using force-graph layout
		if (graphSettings.graphSettings.layout?.type?.value === 'force-graph') {
			// Get the first touch point
			const touch = event.touches[0];
			if (!touch) return;

			const rect = canvasHandler.canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left;
			const y = touch.clientY - rect.top;
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
		<button class="action-btn" on:click={() => goto('/app?mode=sample')} disabled={isMobile}>
			{isMobile ? 'desktop only' : 'launch'}
		</button>
	</div>
</div>

<!-- Scrollable content -->
<div class="content-container" in:fade>
	<!-- First section (100vh) -->

	<div class="section first-section">
		<div class="about">
			Research-based graph visualization tool for creating clear, readable node-link diagrams.
		</div>
	</div>

	<!-- Second section (100vh) -->
	<div class="section second-section">
		<div class="additional-content" bind:this={additionalContentEl}>
			<div class="nodeSettingsPart">
				<p class="content-paragraph first">
					Full manual control over the visualization settings, with property bindings and
					conditional rules.
				</p>

				<div class="settings-panel-wrapper">
					<NodeSettings side="right" />
				</div>
			</div>

			<div class="guidelinesPart">
				<p class="content-paragraph second">
					Literature-based visualization guidelines based on graph properties. All editable.
				</p>

				<div class="guideline-card-wrapper">
					<GuidelineCard {guideline} {expand} first={true} demo={true} />
				</div>
			</div>

			<p class="content-paragraph third">
				This project was developed as a master's thesis at the University of Zurich.
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

	/* Global scroll fix
	:global(body) {
		overflow-y: auto;
		height: 200vh;
	} */

	.canvas-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		background: radial-gradient(
			circle at 40% 50%,
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
		text-align: left;
		position: absolute;
		bottom: 20px;
		left: 20px;
		pointer-events: auto;
		margin-right: 3vw;
	}

	.logo {
		font-family: serif;
		font-size: 2rem;
		font-weight: 600;
		line-height: 1;
		font-style: italic;
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
		/* font-style: italic; */
		font-weight: 400;
	}

	.right-group {
		position: absolute;
		bottom: 20px;
		right: 20px;
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
		height: 300vh;
		z-index: 1;
	}

	.section {
		width: 100%;
		display: flex;
		align-items: flex-end;
		padding: 0 3vw 2vw 3vw;
		box-sizing: border-box;
		flex-direction: column;
	}

	.first-section {
		justify-content: flex-end;
		height: 80vh;
	}

	.second-section {
		justify-content: flex-start;
		align-items: flex-end;
		flex-direction: column;
		gap: 2rem;
		height: 200vh;
	}

	.about {
		font-size: 2rem;
		max-width: 400px;
		color: #222;
		font-family: 'UncutSans';
		font-weight: 400;
		text-align: right;
		line-height: 1.1;
		text-transform: uppercase;
	}

	.additional-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2rem;
		padding: 0 150px 0vw 200px;
	}

	.content-paragraph {
		max-width: 28vw;
		font-size: 1.5rem;
		color: #222;
		font-family: 'UncutSans';
		font-weight: 400;
		line-height: 1.1;
		text-align: left;
	}

	.content-paragraph.first {
		margin-top: 200px;
		max-width: 250px;
		text-align: right;
	}

	.nodeSettingsPart {
		display: flex;
		flex-direction: column;
		align-self: flex-end;
		align-items: flex-end;
	}

	.guidelinesPart {
		align-self: flex-start;
	}

	.content-paragraph.second {
		margin-top: 200px;
		max-width: 290px;
		text-align: left;
		align-self: flex-start;
	}

	.content-paragraph.third {
		max-width: 250px;
		margin-top: 700px;
		align-self: flex-end;
		margin-bottom: 300px;
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

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: #ccc;
		color: #666;
		border-color: #999;
	}

	.action-btn:disabled:hover {
		background-color: #ccc;
		color: #666;
		box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
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

	.settings-panel-wrapper {
		top: 30px;
		margin-top: 30px;
		width: 310px;
		align-self: flex-end;
	}

	.guideline-card-wrapper {
		max-width: 340px;
		margin-top: 70px;
	}

	/* Desktop styles - ensure full width */
	@media (min-width: 451px) {
		.additional-content {
			width: 100%;
		}

		.content-paragraph.first {
			margin-bottom: 100px;
		}
	}

	/* Mobile responsive styles */
	@media (max-width: 450px) {
		.logo {
			font-size: 1.5rem;
		}

		.logo-block {
			bottom: 15px;
			left: 15px;
		}

		.right-group {
			bottom: 15px;
			right: 15px;
			gap: 1em;
		}

		.action-btn {
			font-size: 12px;
			padding: 4px 20px;
		}

		.section {
			padding: 0 20px 20px 20px;
		}

		.about {
			font-size: 1.2rem;
			max-width: 100%;
			text-align: right;
		}

		.additional-content {
			padding: 0 20px;
			gap: 1rem;
		}

		.content-paragraph {
			max-width: 100%;
			font-size: 1.1rem;
			text-align: right;
		}

		.content-paragraph.first {
			margin-top: 100px;
			max-width: 100%;
			text-align: right;
		}

		.content-paragraph.second {
			margin-top: 100px;
			max-width: 100%;
			text-align: right;
		}

		.content-paragraph.third {
			max-width: 100%;
			margin-top: 300px;
			text-align: right;
			margin-bottom: 150px;
		}

		.nodeSettingsPart {
			align-self: center;
			align-items: center;
		}

		.guidelinesPart {
			align-self: center;
		}

		.settings-panel-wrapper {
			width: 100%;
			max-width: 280px;
			align-self: center;
		}

		.guideline-card-wrapper {
			max-width: 100%;
			margin-top: 40px;
		}

		.first-section {
			height: 60vh;
		}

		.second-section {
			height: 150vh;
		}

		.content-container {
			height: 200vh;
		}
	}

	@media (min-width: 451px) and (max-width: 1023px) {
		.additional-content {
			padding: 0 20px 0vw 20px;
		}
	}

	/* Tablet responsive styles */
	/* @media (min-width: 768px) and (max-width: 1023px) {
		.logo {
			font-size: 1.8rem;
		}

		.logo-block {
			bottom: 18px;
			left: 18px;
		}

		.right-group {
			bottom: 18px;
			right: 18px;
		}

		.section {
			padding: 0 40px 30px 40px;
		}

		.about {
			font-size: 1.3rem;
			max-width: 300px;
		}

		.additional-content {
			width: 100vw;
			padding: 0 80px;
		}

		.content-paragraph {
			max-width: 40vw;
			font-size: 1.3rem;
		}

		.content-paragraph.first {
			max-width: 200px;
		}

		.content-paragraph.second {
			max-width: 250px;
		}

		.content-paragraph.third {
			max-width: 200px;
			margin-top: 500px;
		}

		.settings-panel-wrapper {
			width: 280px;
		}

		.guideline-card-wrapper {
			max-width: 300px;
		}

		.first-section {
			height: 70vh;
		}

		.second-section {
			height: 180vh;
		}

		.content-container {
			height: 250vh;
			padding: 0 10px 0 40px;
		}
	} */
</style>
