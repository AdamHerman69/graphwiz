<script lang="ts">
	import { spring } from 'svelte/motion';
	import { exportState } from '../utils/graphSettings.svelte';
	import { exportGraph } from '../utils/graph.svelte';
	import FileImport from './FileImport.svelte';
	import { blur } from 'svelte/transition';
	import { undo, redo } from '../utils/undoStack.svelte';

	let { sticky = $bindable(), exportSVG }: { sticky: boolean; exportSVG: () => string } = $props();

	let menuOpen: 'import' | 'export' | null = $state(null);

	const blurParamsOut = {
		delay: 0,
		duration: 100
	};

	const SVG_WIDTH = 520;
	const SVG_HEIGHT = 220;

	// ISLAND DIMS
	const BUTTON_WIDTH = 24;
	const BUTTON_SPACING = 10;
	const BUTTON_COUNT = 5;
	const ISLAND_X_MARGIN = 17;
	const ISLAND_EXPANDED_WIDTH = 400;
	const ISLAND_EXPANDED_HEIGHT = 200;
	let island_width = $derived.by(() => {
		if (menuOpen) {
			return ISLAND_EXPANDED_WIDTH;
		} else if (sticky) {
			return (
				BUTTON_WIDTH * (BUTTON_COUNT - 1) +
				BUTTON_SPACING * (BUTTON_COUNT - 2) +
				2 * ISLAND_X_MARGIN
			);
		} else {
			return (
				BUTTON_WIDTH * BUTTON_COUNT + BUTTON_SPACING * (BUTTON_COUNT - 1) + 2 * ISLAND_X_MARGIN
			);
		}
	});
	const HEIGHT = 32;

	// ISLAND POSITION
	const Y = 10;
	let island_x = $derived(
		menuOpen
			? (SVG_WIDTH - ISLAND_EXPANDED_WIDTH) / 2
			: (SVG_WIDTH -
					(BUTTON_WIDTH * BUTTON_COUNT +
						BUTTON_SPACING * (BUTTON_COUNT - 1) +
						2 * ISLAND_X_MARGIN)) /
					2
	);

	// STICKY BUTTON
	const STICKY_WIDTH = 45;
	const STICKY_GAP = 10;
	const STICKY_INSIDE_X =
		island_x +
		ISLAND_X_MARGIN +
		(BUTTON_COUNT - 1) * (BUTTON_WIDTH + BUTTON_SPACING) -
		(STICKY_WIDTH - BUTTON_WIDTH) / 2;

	// SPRINGS
	const islandStyles = spring(
		{ x: island_x, y: Y, width: island_width, height: HEIGHT },
		{
			stiffness: 0.1,
			damping: 0.5
		}
	);
	const stickyStyles = spring(
		{
			x: STICKY_INSIDE_X,
			y: Y,
			width: STICKY_WIDTH,
			height: HEIGHT
		},
		{
			stiffness: 0.1,
			damping: 0.5
		}
	);

	let STICKY_X_MIDDLE = $derived($stickyStyles.x + $stickyStyles.width / 2);

	$effect(() => {
		if (sticky) {
			stickyStyles.set({
				x: island_x + island_width + STICKY_GAP,
				y: Y,
				width: STICKY_WIDTH,
				height: HEIGHT
			});
		} else {
			stickyStyles.set({
				x: STICKY_INSIDE_X,
				y: Y,
				width: STICKY_WIDTH,
				height: HEIGHT
			});
		}
	});

	$effect(() => {
		if (menuOpen) {
			islandStyles.set({
				x: island_x,
				y: Y,
				width: island_width,
				height: ISLAND_EXPANDED_HEIGHT
			});
		} else {
			islandStyles.set({
				x: island_x,
				y: Y,
				width: island_width,
				height: HEIGHT
			});
		}
	});

	function downloadFile(contents: string, fileName: string, fileType: string) {
		// Create a Blob from the string
		const blob = new Blob([contents], { type: fileType });

		// Create a URL for the Blob
		const url = URL.createObjectURL(blob);

		const fileExtension = fileType === 'application/json' ? '.json' : '.svg';

		// Create an anchor element and trigger the download
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName + fileExtension;
		document.body.appendChild(a);
		a.click();

		// Remove the anchor element
		document.body.removeChild(a);

		// Release the object URL
		URL.revokeObjectURL(url);
	}
</script>

<div class="menuBar relative">
	<svg width={SVG_WIDTH} height={SVG_HEIGHT}>
		<defs>
			<filter id="split-effect" width="400%" x="-150%" height="400%" y="-150%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
				<feColorMatrix
					in="blur"
					type="matrix"
					values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 25 -10"
					result="matrix"
				/>
			</filter>
			<filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="rgba(0,0,0,0.5)" />
			</filter>
		</defs>
		<g filter="url(#drop-shadow)">
			<g filter="url(#split-effect)">
				<rect
					x={$islandStyles.x}
					y={$islandStyles.y}
					width={$islandStyles.width}
					height={$islandStyles.height}
					rx="16"
					fill="black"
				/>
				<rect
					x={$stickyStyles.x}
					y={$stickyStyles.y}
					width={$stickyStyles.width}
					height={$stickyStyles.height}
					rx="16"
					fill="black"
				/>
			</g>
		</g>
	</svg>
	<div class="menuBarButtons">
		{#if !menuOpen}
			<!-- Upload -->
			<button
				transition:blur
				onclick={() => (menuOpen = 'import')}
				style={`left: ${island_x + ISLAND_X_MARGIN + 0 * BUTTON_WIDTH + 0 * BUTTON_SPACING}px`}
			>
				<span class="material-symbols-outlined">upload_file</span>
			</button>

			<!-- Download -->
			<button
				transition:blur
				onclick={() => (menuOpen = 'export')}
				style={`left: ${island_x + ISLAND_X_MARGIN + 1 * BUTTON_WIDTH + 1 * BUTTON_SPACING}px`}
			>
				<span class="material-symbols-outlined">download</span>
			</button>

			<!-- Undo -->
			<button
				transition:blur
				onclick={undo}
				style={`left: ${island_x + ISLAND_X_MARGIN + 2 * BUTTON_WIDTH + 2 * BUTTON_SPACING}px`}
			>
				<span class="material-symbols-outlined">undo</span>
			</button>

			<!-- Redo -->
			<button
				transition:blur
				onclick={redo}
				style={`left: ${island_x + ISLAND_X_MARGIN + 3 * BUTTON_WIDTH + 3 * BUTTON_SPACING}px`}
			>
				<span class="material-symbols-outlined">redo</span>
			</button>
		{/if}

		<!-- Sticky -->
		{#if sticky || !menuOpen}
			<button
				transition:blur
				onclick={() => (sticky = !sticky)}
				style={`left: ${STICKY_X_MIDDLE - BUTTON_WIDTH / 2}px;`}
			>
				<span class="material-symbols-outlined"> {sticky ? 'keep_off' : 'keep'}</span>
			</button>
		{/if}
	</div>

	<!-- Import Menu -->
	{#if menuOpen === 'import'}
		<div
			transition:blur
			class="importDiv"
			style={`width: ${ISLAND_EXPANDED_WIDTH - 2 * ISLAND_X_MARGIN}px; height: ${
				ISLAND_EXPANDED_HEIGHT - 2 * ISLAND_X_MARGIN
			}px; left: ${island_x + ISLAND_X_MARGIN}px; top: ${Y + ISLAND_X_MARGIN}px`}
		>
			<FileImport closeMenu={() => (menuOpen = null)} />

			<button class="closeExpanded" onclick={() => (menuOpen = null)}>
				<span class="material-symbols-outlined">close</span>
			</button>
		</div>
	{/if}
	{#if menuOpen === 'export'}
		<div
			transition:blur
			class="exportDiv"
			style={`width: ${ISLAND_EXPANDED_WIDTH - 2 * ISLAND_X_MARGIN}px; height: ${
				ISLAND_EXPANDED_HEIGHT - 2 * ISLAND_X_MARGIN
			}px; left: ${island_x + ISLAND_X_MARGIN}px; top: ${Y + ISLAND_X_MARGIN}px`}
		>
			<div class="optionContainer">
				<div class="heading">svg</div>
				<div class="description">Export the visualization as a scalable vector graphic file.</div>
				<button
					onclick={async () => {
						downloadFile(exportSVG(), 'graph', 'image/svg+xml');
						menuOpen = null;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>
			<div class="optionContainer">
				<div class="heading">settings</div>
				<div class="description">Export the visualization settings alone.</div>
				<button
					onclick={() => {
						let objectToExport = { settings: exportState() };
						let json = JSON.stringify(objectToExport, null, 2);
						console.log(json);
						downloadFile(json, 'graphwiz_settings', 'application/json');
						menuOpen = null;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>
			<div class="optionContainer">
				<div class="heading">full state</div>
				<div class="description">Export the complete state of your session.</div>
				<button
					onclick={() => {
						let objectToExport = { settings: exportState(), graph: exportGraph() };
						let json = JSON.stringify(objectToExport, null, 2);
						downloadFile(json, 'graphwiz_state', 'application/json');
						menuOpen = null;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>

			<button class="closeExpanded" onclick={() => (menuOpen = null)}>
				<span class="material-symbols-outlined">close</span>
			</button>
		</div>
	{/if}
</div>

<style>
	button {
		color: white;
	}

	.menuBarButtons button {
		position: absolute;
		top: 14px;
	}
	.importDiv,
	.exportDiv {
		position: absolute;
	}

	.menuBarButtons,
	.importDiv,
	.exportDiv {
		pointer-events: auto;
	}

	.exportDiv {
		display: flex;
	}

	.exportDiv .optionContainer {
		flex: 1;
		/* border: 1px solid lime; */
		margin: 0 5px;
		color: white;
		display: flex;
		flex-direction: column;
		align-items: start;
	}

	.exportDiv .description {
		font-size: 11px;
		text-transform: uppercase;
		line-height: 1.3;
	}

	.exportDiv .heading {
		font-size: 18px;
		text-transform: uppercase;
		margin-bottom: 30px;
		font-weight: bold;
	}

	.optionContainer button {
		margin-left: -5px;
		margin-bottom: -15px;
		margin-top: auto;
	}

	.closeExpanded {
		position: absolute;
		z-index: 100;
		bottom: -10px;
		right: -10px;
		height: 24px;
	}
</style>
