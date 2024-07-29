<script lang="ts">
	import { spring } from 'svelte/motion';
	import { exportGraph } from '../utils/graph.svelte';
	import FileImport from './FileImport.svelte';
	import { blur } from 'svelte/transition';
	import { getContext } from 'svelte';
	import type { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import type { ICanvasHandler } from '../utils/canvas.svelte';

	let {
		stickyLeft = $bindable(),
		stickyRight = $bindable(),
		exportSVGLeft = $bindable(),
		exportSVGRight = $bindable(),
		graphSettingsLeft = $bindable(),
		graphSettingsRight = $bindable()
	}: {
		stickyLeft: boolean;
		stickyRight: boolean | undefined;
		exportSVGLeft: () => string;
		exportSVGRight: () => string;
		graphSettingsLeft: GraphSettingsClass;
		graphSettingsRight: GraphSettingsClass;
	} = $props();

	let double = $state(false);

	let menuOpen: 'import' | 'export' | null = $state(null);

	const toggleSplitView: (left: boolean, right: boolean) => void = getContext('toggleSplitView');

	const blurParamsOut = {
		delay: 0,
		duration: 100
	};

	const SVG_WIDTH = 520;
	const SVG_HEIGHT = 220;

	const singleViewButtons = [
		{
			icon: 'keep',
			action: () => (stickyLeft = !stickyLeft),
			label: 'Sticky Right'
		},
		{ icon: 'undo', action: graphSettingsLeft.undo, label: 'Right Undo' },
		{ icon: 'redo', action: graphSettingsLeft.redo, label: 'Right Redo' },
		{
			icon: 'splitscreen_vertical_add',
			action: () => {
				double = true;
				toggleSplitView(true, true);
			},
			label: 'Split View'
		},
		{ icon: 'upload_file', action: () => (menuOpen = 'import'), label: 'Import' },
		{ icon: 'download', action: () => (menuOpen = 'export'), label: 'Export' }
	];

	const splitViewButtons = [
		{
			icon: 'keep',
			action: () => (stickyLeft = !stickyLeft),
			label: 'Sticky Left'
		},
		{ icon: 'undo', action: graphSettingsLeft.undo, label: 'Left Undo' },
		{ icon: 'redo', action: graphSettingsLeft.redo, label: 'Left Redo' },
		{ icon: 'upload_file', action: () => (menuOpen = 'import'), label: 'Import' },
		{ icon: 'download', action: () => (menuOpen = 'export'), label: 'Export' },
		{ icon: 'undo', action: graphSettingsRight.undo, label: 'Right Undo' },
		{ icon: 'redo', action: graphSettingsRight.redo, label: 'Right Redo' },
		{
			icon: 'keep',
			action: () => (stickyRight = !stickyRight),
			label: 'Sticky Right'
		}
	];

	let buttons = $derived(double ? splitViewButtons : singleViewButtons);

	function getButtonPosition(index: number) {
		const stickyLeftCompensation = stickyLeft ? 1 : 0;
		return (
			island_x +
			ISLAND_X_MARGIN +
			(index - stickyLeftCompensation) * BUTTON_WIDTH +
			(index - stickyLeftCompensation) * BUTTON_SPACING
		);
	}

	// ISLAND DIMS
	const BUTTON_WIDTH = 24;
	const BUTTON_SPACING = 10;
	const BUTTON_COUNT = $derived(buttons.length);
	const ISLAND_X_MARGIN = 17;
	const ISLAND_EXPANDED_WIDTH = 400;
	const ISLAND_EXPANDED_HEIGHT = 200;

	let island_width = $derived.by(() => {
		if (menuOpen) {
			return ISLAND_EXPANDED_WIDTH;
		}
		let buttonCountWithoutSticky = BUTTON_COUNT - Number(stickyLeft) - Number(stickyRight);

		return (
			BUTTON_WIDTH * buttonCountWithoutSticky +
			BUTTON_SPACING * (buttonCountWithoutSticky - 1) +
			2 * ISLAND_X_MARGIN
		);
		// else if (!double) {
		// 	if (stickyRight) {
		// 		return (
		// 			BUTTON_WIDTH * (BUTTON_COUNT - 1) +
		// 			BUTTON_SPACING * (BUTTON_COUNT - 2) +
		// 			2 * ISLAND_X_MARGIN
		// 		);
		// 	} else {
		// 		return (
		// 			BUTTON_WIDTH * BUTTON_COUNT + BUTTON_SPACING * (BUTTON_COUNT - 1) + 2 * ISLAND_X_MARGIN
		// 		);
		// 	}
		// } else {
		// 	// double true
		// 	if (!stickyLeft && !stickyRight) {
		// 		return (
		// 			BUTTON_WIDTH * BUTTON_COUNT + BUTTON_SPACING * (BUTTON_COUNT - 1) + 2 * ISLAND_X_MARGIN
		// 		);
		// 	} else if ()
		// }
	});
	const HEIGHT = 32;

	// ISLAND POSITION
	const Y = 10;
	let island_x = $derived.by(() => {
		if (menuOpen) return (SVG_WIDTH - ISLAND_EXPANDED_WIDTH) / 2;
		if (!stickyLeft)
			return (
				(SVG_WIDTH -
					(BUTTON_WIDTH * BUTTON_COUNT +
						BUTTON_SPACING * (BUTTON_COUNT - 1) +
						2 * ISLAND_X_MARGIN)) /
				2
			);
		if (stickyLeft)
			return (
				(SVG_WIDTH -
					(BUTTON_WIDTH * BUTTON_COUNT +
						BUTTON_SPACING * (BUTTON_COUNT - 1) +
						2 * ISLAND_X_MARGIN)) /
					2 +
				BUTTON_SPACING +
				BUTTON_WIDTH
			);
	});

	// STICKY BUTTON
	const STICKY_WIDTH = 45;
	const STICKY_GAP = 10;
	let STICKY_RIGHT_INSIDE_X = $derived.by(() => {
		const buttonCountWithoutLeftSticky = stickyLeft ? BUTTON_COUNT - 1 : BUTTON_COUNT;

		return (
			island_x +
			ISLAND_X_MARGIN +
			(buttonCountWithoutLeftSticky - 1) * (BUTTON_WIDTH + BUTTON_SPACING) -
			(STICKY_WIDTH - BUTTON_WIDTH) / 2
		);
	});

	let STICKY_LEFT_INSIDE_X = $derived(island_x + 7);
	// SPRINGS
	const islandStyles = spring(
		{ x: island_x, y: Y, width: island_width, height: HEIGHT },
		{
			stiffness: 0.1,
			damping: 0.5
		}
	);
	const rightStickyStyles = spring(
		{
			x: STICKY_RIGHT_INSIDE_X,
			y: Y,
			width: STICKY_WIDTH,
			height: HEIGHT
		},
		{
			stiffness: 0.1,
			damping: 0.5
		}
	);
	const leftStickyStyles = spring(
		{
			x: STICKY_LEFT_INSIDE_X,
			y: Y,
			width: STICKY_WIDTH,
			height: HEIGHT
		},
		{
			stiffness: 0.1,
			damping: 0.5
		}
	);

	let RIGHT_STICKY_X_MIDDLE = $derived($rightStickyStyles.x + $rightStickyStyles.width / 2);
	let LEFT_STICKY_X_MIDDLE = $derived($leftStickyStyles.x + $leftStickyStyles.width / 2);

	$effect(() => {
		if (stickyRight) {
			rightStickyStyles.set({
				x: island_x + island_width + STICKY_GAP,
				y: Y,
				width: STICKY_WIDTH,
				height: HEIGHT
			});
		} else {
			rightStickyStyles.set({
				x: STICKY_RIGHT_INSIDE_X,
				y: Y,
				width: STICKY_WIDTH,
				height: HEIGHT
			});
		}
	});

	$effect(() => {
		if (stickyLeft) {
			leftStickyStyles.set({
				x: island_x - STICKY_GAP - STICKY_WIDTH,
				y: Y,
				width: STICKY_WIDTH,
				height: HEIGHT
			});
		} else {
			leftStickyStyles.set({
				x: STICKY_LEFT_INSIDE_X,
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
		<!-- DEBUG -->
		<!-- <rect x={island_x} y={Y + 50} width={3} height={3} fill="red" />
		<rect x={STICKY_LEFT_INSIDE_X} y={Y + 50} width={3} height={3} fill="green" />
		<rect x={STICKY_RIGHT_INSIDE_X} y={Y + 50} width={3} height={3} fill="blue" /> -->

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
					x={$leftStickyStyles.x}
					y={$leftStickyStyles.y}
					width={$leftStickyStyles.width}
					height={$leftStickyStyles.height}
					rx="16"
					fill="black"
				/>
				{#if double}
					<rect
						x={$rightStickyStyles.x}
						y={$rightStickyStyles.y}
						width={$rightStickyStyles.width}
						height={$rightStickyStyles.height}
						rx="16"
						fill="black"
					/>
				{/if}
			</g>
		</g>
	</svg>
	<div class="menuBarButtons">
		{#if !menuOpen}
			{#if !double}
				{#each buttons as button, index}
					{#if index != 0}
						<button
							transition:blur
							onclick={button.action}
							style={`left: ${getButtonPosition(index)}px`}
						>
							<span class="material-symbols-outlined">{button.icon}</span>
						</button>
					{/if}
				{/each}
			{/if}
			{#if double}
				{#each buttons as button, index}
					{#if index != buttons.length - 1 && (!double || index != 0)}
						<button
							transition:blur
							onclick={button.action}
							style={`left: ${getButtonPosition(index)}px`}
						>
							<span class="material-symbols-outlined">{button.icon}</span>
						</button>
					{/if}
				{/each}
			{/if}
		{/if}

		<!-- Sticky Right -->
		{#if double && (stickyRight || !menuOpen)}
			<button
				transition:blur
				onclick={() => (stickyRight = !stickyRight)}
				style={`left: ${RIGHT_STICKY_X_MIDDLE - BUTTON_WIDTH / 2}px;`}
			>
				<span class="material-symbols-outlined"> {stickyRight ? 'keep_off' : 'keep'}</span>
			</button>
		{/if}
		<!-- Sticky Left -->
		{#if stickyLeft || !menuOpen}
			<button
				transition:blur
				onclick={() => (stickyLeft = !stickyLeft)}
				style={`left: ${LEFT_STICKY_X_MIDDLE - BUTTON_WIDTH / 2}px;`}
			>
				<span class="material-symbols-outlined"> {stickyLeft ? 'keep_off' : 'keep'}</span>
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
						let objectToExport = { settings: graphSettings.exportState() };
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
						let objectToExport = { settings: graphSettings.exportState(), graph: exportGraph() };
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
