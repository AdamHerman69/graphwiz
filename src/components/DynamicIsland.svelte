<script lang="ts">
	import { spring } from 'svelte/motion';
	import { exportState } from '../utils/graphSettings.svelte';
	import { exportGraph } from '../utils/graph.svelte';
	import FileImport from './FileImport.svelte';
	import { blur } from 'svelte/transition';
	import { undo, redo } from '../utils/undoStack.svelte';

	export let exportSVG: () => string;
	export let sticky: boolean;

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

	let importMenuOpen = false;
	let exportMenuOpen = false;

	// Dimmentions
	const svgWidthCollapsed = 220;
	const svgHeightCollapsed = 50;
	const svgWidthExpanded = 520;
	const svgHeightExpanded = 220;

	const buttonWidth = 24;
	const buttonSpacing = 10;
	let buttonCount = 5;

	const menuBarSideMargin = 17;
	const menuBarHeight = 32;

	let menuBarWidth =
		buttonWidth * buttonCount + buttonSpacing * (buttonCount - 1) + menuBarSideMargin * 2;
	let menuBarX = (svgWidthExpanded - menuBarWidth) / 2;
	let menuBarY = 10;

	let stickyRectWidth = 45;
	let stickyTrueMargin = 10;

	$: stickyRectMiddle = $stickyRectStyles.x + $stickyRectStyles.width / 2;
	let expandedWidth = 400;
	const expandedHeight = 200;
	let expandedX = (svgWidthExpanded - expandedWidth) / 2;

	const blurParamsIn = {
		delay: 300
	};

	const menuBarStyles = spring({ x: 0, opacity: 1 }, { stiffness: 0.1 });
	const stickyStyles = spring({ x: 0, opacity: 1 }, { stiffness: 0.1 });
	const islandStyles = spring({ scale: 1 }, { stiffness: 0.1 });

	const menuRectStyles = spring(
		{
			x: menuBarX,
			y: menuBarY,
			width: menuBarWidth,
			height: menuBarHeight
		},
		{ stiffness: 0.1 }
	);
	const stickyRectStyles = spring(
		{
			x:
				menuBarX +
				menuBarSideMargin +
				(buttonCount - 1) * buttonWidth +
				(buttonCount - 1) * buttonSpacing -
				(stickyRectWidth / 2 - buttonWidth / 2),
			y: menuBarY,
			width: stickyRectWidth,
			height: menuBarHeight
		},
		{ stiffness: 0.1 }
	);

	$: {
		if (sticky) {
			// sticky true styles
			menuBarWidth =
				buttonWidth * (buttonCount - 1) + buttonSpacing * (buttonCount - 2) + menuBarSideMargin * 2;
			stickyStyles.set({ x: 50, opacity: 1 });
			stickyRectStyles.set({
				x: menuBarX + menuBarWidth + stickyTrueMargin,
				y: 10,
				width: 45,
				height: 32
			});
		} else {
			// sticky false styles
			stickyStyles.set({ x: 50, opacity: 1 });
			menuBarWidth =
				buttonWidth * buttonCount + buttonSpacing * (buttonCount - 1) + menuBarSideMargin * 2;
			stickyRectStyles.set({
				x:
					menuBarX +
					menuBarSideMargin +
					(buttonCount - 1) * buttonWidth +
					(buttonCount - 1) * buttonSpacing -
					(stickyRectWidth / 2 - buttonWidth / 2),
				y: menuBarY,
				width: stickyRectWidth,
				height: menuBarHeight
			});
		}
	}

	$: {
		if (importMenuOpen || exportMenuOpen) {
			// expanded styles
			// menuBarStyles.set({ x: 0, opacity: 1 });
			// menuRectStyles.set({ x: 10, y: 10, width: menuBarWidth + 100, height: 150 });

			menuBarStyles.set({ x: 0, opacity: 1 });
			menuRectStyles.set({
				x: expandedX,
				y: menuBarY,
				width: expandedWidth,
				height: expandedHeight
			});
			if (sticky) {
				stickyRectStyles.set({
					x: expandedX + expandedWidth + stickyTrueMargin,
					y: 10,
					width: 45,
					height: 32
				});
			}
		} else {
			// collapsed styles
			menuBarStyles.set({ x: 0, opacity: 1 });
			menuRectStyles.set({ x: menuBarX, y: menuBarY, width: menuBarWidth, height: menuBarHeight });
			if (sticky) {
				stickyRectStyles.set({
					x: menuBarX + menuBarWidth + stickyTrueMargin,
					y: 10,
					width: 45,
					height: 32
				});
			}
		}
	}
</script>

<div class="menuBar relative">
	<svg width={svgWidthExpanded} height={svgHeightExpanded}>
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
					x={$menuRectStyles.x}
					y={$menuRectStyles.y}
					width={$menuRectStyles.width}
					height={$menuRectStyles.height}
					rx="16"
					fill="black"
				/>
				<rect
					x={$stickyRectStyles.x}
					y={$stickyRectStyles.y}
					width={$stickyRectStyles.width}
					height={$stickyRectStyles.height}
					rx="16"
					fill="black"
				/>
			</g>
		</g>
	</svg>
	<div class="menuBarButtons">
		{#if !importMenuOpen && !exportMenuOpen}
			<!-- Upload -->
			<button
				out:blur
				in:blur={blurParamsIn}
				on:click={() => (importMenuOpen = !importMenuOpen)}
				style={`left: ${menuBarX + menuBarSideMargin + 0 * buttonWidth + 0 * buttonSpacing}px`}
			>
				<span class="material-symbols-outlined">upload_file</span>
			</button>

			<!-- Download -->
			<button
				out:blur
				in:blur={blurParamsIn}
				on:click={() => (exportMenuOpen = !exportMenuOpen)}
				style={`left: ${menuBarX + menuBarSideMargin + 1 * buttonWidth + 1 * buttonSpacing}px`}
			>
				<span class="material-symbols-outlined">download</span>
			</button>

			<!-- Undo -->
			<button
				out:blur
				in:blur={blurParamsIn}
				on:click={undo}
				style={`left: ${menuBarX + menuBarSideMargin + 2 * buttonWidth + 2 * buttonSpacing}px`}
			>
				<span class="material-symbols-outlined">undo</span>
			</button>

			<!-- Redo -->
			<button
				out:blur
				in:blur={blurParamsIn}
				on:click={redo}
				style={`left: ${menuBarX + menuBarSideMargin + 3 * buttonWidth + 3 * buttonSpacing}px`}
			>
				<span class="material-symbols-outlined">redo</span>
			</button>
		{/if}

		<!-- Sticky -->
		{#if sticky || (!importMenuOpen && !exportMenuOpen)}
			<button
				out:blur
				in:blur={blurParamsIn}
				on:click={() => (sticky = !sticky)}
				style={`left: ${stickyRectMiddle - buttonWidth / 2}px;`}
			>
				<span class="material-symbols-outlined"> {sticky ? 'keep_off' : 'keep'}</span>
			</button>
		{/if}
	</div>

	<!-- Import Menu -->
	{#if importMenuOpen}
		<div
			in:blur={blurParamsIn}
			out:blur={{ delay: 0, duration: 100 }}
			class="importDiv"
			style={`width: ${expandedWidth - 2 * menuBarSideMargin}px; height: ${
				expandedHeight - 2 * menuBarSideMargin
			}px; left: ${expandedX + menuBarSideMargin}px; top: ${menuBarY + menuBarSideMargin}px`}
		>
			<FileImport closeMenu={() => (importMenuOpen = false)} />

			<button class="closeExpanded" on:click={() => (importMenuOpen = false)}>
				<span class="material-symbols-outlined">close</span>
			</button>
		</div>
	{/if}
	{#if exportMenuOpen}
		<div
			in:blur={blurParamsIn}
			out:blur={{ delay: 0, duration: 100 }}
			class="exportDiv"
			style={`width: ${expandedWidth - 2 * menuBarSideMargin}px; height: ${
				expandedHeight - 2 * menuBarSideMargin
			}px; left: ${expandedX + menuBarSideMargin}px; top: ${menuBarY + menuBarSideMargin}px`}
		>
			<div class="optionContainer">
				<div class="heading">svg</div>
				<div class="description">Export the visualization as a scalable vector graphic file.</div>
				<button
					on:click={async () => {
						downloadFile(exportSVG(), 'graph', 'image/svg+xml');
						exportMenuOpen = false;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>
			<div class="optionContainer">
				<div class="heading">settings</div>
				<div class="description">Export the visualization settings alone.</div>
				<button
					on:click={() => {
						let objectToExport = { settings: exportState() };
						let json = JSON.stringify(objectToExport, null, 2);
						console.log(json);
						downloadFile(json, 'graphwiz_settings', 'application/json');
						exportMenuOpen = false;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>
			<div class="optionContainer">
				<div class="heading">full state</div>
				<div class="description">Export the complete state of your session.</div>
				<button
					on:click={() => {
						let objectToExport = { settings: exportState(), graph: exportGraph() };
						let json = JSON.stringify(objectToExport, null, 2);
						downloadFile(json, 'graphwiz_state', 'application/json');
						exportMenuOpen = false;
					}}
				>
					<span class="material-symbols-outlined">download</span>
				</button>
			</div>

			<button class="closeExpanded" on:click={() => (exportMenuOpen = false)}>
				<span class="material-symbols-outlined">close</span>
			</button>
		</div>
	{/if}
</div>

<!-- {#if exportMenuOpen}
		<button on:click={exportSVG}>export SVG</button>
		<button on:click={saveStateString}>export JSON</button>
	{/if} -->

<div class="island" style="transform: scale({$islandStyles.scale});">
	<div class="minimized-mode-item-wrapper minimized-mode-left-item-wrapper">
		<div
			class="minimized-mode-left-item"
			style="transform: translateX({$menuBarStyles.x}px); opacity: {$menuBarStyles.opacity};"
		>
			<!-- <img class="photo" src="/lyft.png" /> -->
		</div>
	</div>
	<div class="minimized-mode-item-wrapper minimized-mode-right-item-wrapper">
		<div
			class="minimized-mode-right-item"
			style="transform: translateX({$stickyStyles.x}px); opacity: {$stickyStyles.opacity};"
		/>
	</div>
</div>

<style>
	.island {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: transform 0.3s;
	}
	.minimized-mode-item-wrapper {
		position: absolute;
	}
	.minimized-mode-left-item,
	.minimized-mode-right-item {
		transition:
			transform 0.3s,
			opacity 0.3s;
	}
	.controls {
		margin-top: 20px;
	}

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
