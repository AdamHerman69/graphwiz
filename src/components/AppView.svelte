<script lang="ts">
	import Canvas from './Canvas.svelte';
	import GraphSettingsPanel from './GraphSettingsPanel.svelte';
	import { GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { onMount, setContext } from 'svelte';
	import { blur } from 'svelte/transition';
	import Guidelines from './Guidelines.svelte';
	import { newGuidelineSet, sortGuidelines, type Guideline } from '../utils/guideline.svelte';
	import { getGraph } from '../utils/graph.svelte';
	import LayoutSettings from './LayoutSettings.svelte';
	import NodeSettings from './NodeSettings.svelte';
	import EdgeSettings from './EdgeSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import SideBarSwitch from './GUI/SideBarSwitch.svelte';
	import { hoverPopup } from './GUI/hoverPopup.svelte';

	const graphSettings = new GraphSettingsClass();
	console.log('created GS', graphSettings.stateIndex);
	setContext<GraphSettingsClass>('graphSettings', graphSettings);

	const guidelines = $state(newGuidelineSet(graphSettings));
	sortGuidelines(guidelines, getGraph());
	setContext<Guideline[]>('guidelines', guidelines);

	let { side }: { side: 'left' | 'right' | 'full' } = $props();

	type PanelState = {
		left: 'guidelines' | 'settings';
		right: 'guidelines' | 'settings';
	};

	let panelState = $state({
		left: 'guidelines',
		right: 'settings'
	} as PanelState);

	let hidden = $state({ left: false, right: false });

	type SettingsState = {
		layout: boolean;
		node: boolean;
		edge: boolean;
	};

	let settingsState = $state({
		left: { layout: true, node: true, edge: true },
		right: { layout: true, node: true, edge: true }
	});

	onMount(() => {
		console.log('mounted AppView');
		// clear saves triggered by initializing
		graphSettings.clearUndoStack();
		graphSettings.saveState();
	});

	function toggleHidden(side: 'left' | 'right') {
		hidden[side] = !hidden[side];
	}

	function togglePanel(side: 'left' | 'right') {
		panelState[side] = panelState[side] === 'guidelines' ? 'settings' : 'guidelines';
	}

	function toggleSetting(setting: keyof SettingsState, side: 'left' | 'right') {
		settingsState[side][setting] = !settingsState[side][setting];
	}

	let hintSlideLeft = $state(false);
	let hintSlideRight = $state(false);
</script>

<Canvas />

{#if side === 'full' || side === 'left'}
	<!-- Left panel -->
	<div class="sideContainer leftContainer">
		<div class="panelContent">
			<div class="cardStackContainer" class:hintSlideLeft use:autoAnimate>
				{#if !hidden.left && panelState.left === 'guidelines'}
					<div class="cardStack">
						<Guidelines />
					</div>
				{:else if !hidden.left && panelState.left === 'settings'}
					<div class="cardStack" use:autoAnimate>
						{#if settingsState.left.layout}
							<LayoutSettings />
						{/if}
						{#if settingsState.left.node}
							<NodeSettings side="left" />
						{/if}
						{#if settingsState.left.edge}
							<EdgeSettings side="left" />
						{/if}
					</div>
				{/if}
			</div>

			<div class="buttonContainer" class:stackHidden={hidden['left']} use:autoAnimate>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					onclick={() => toggleHidden('left')}
					onmouseover={() => (hintSlideLeft = true)}
					onmouseout={() => (hintSlideLeft = false)}
				>
					<span class="material-symbols-outlined"
						>{hidden.left ? 'chevron_right' : 'chevron_left'}</span
					>
				</button>
				{#if !hidden.left}
					<SideBarSwitch bind:selected={panelState.left} />
					{#if panelState.left === 'settings'}
						<div class="settingToggleButtons">
							<button
								onclick={() => toggleSetting('layout', 'left')}
								class:on={settingsState.left.layout}
							>
								<span class="material-symbols-outlined"> linked_services </span>
							</button>
							<button
								onclick={() => toggleSetting('node', 'left')}
								class:on={settingsState.left.node}
							>
								<span class="material-symbols-outlined"> masked_transitions </span>
							</button>
							<button
								onclick={() => toggleSetting('edge', 'left')}
								class:on={settingsState.left.edge}
							>
								<span class="material-symbols-outlined"> diagonal_line </span>
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Right panel -->
{#if side === 'full' || side === 'right'}
	<div class="sideContainer rightContainer">
		<div class="panelContent">
			<div class="cardStackContainer" class:hintSlideRight use:autoAnimate>
				{#if !hidden.right && panelState.right === 'guidelines'}
					<div class="cardStack">
						<Guidelines />
					</div>
				{:else if !hidden.right && panelState.right === 'settings'}
					<div class="cardStack" use:autoAnimate>
						{#if settingsState.right.layout}
							<LayoutSettings />
						{/if}
						{#if settingsState.right.node}
							<NodeSettings side="right" />
						{/if}
						{#if settingsState.right.edge}
							<EdgeSettings side="right" />
						{/if}
					</div>
				{/if}
			</div>

			<div class="buttonContainer" class:stackHidden={hidden['right']} use:autoAnimate>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					onclick={() => toggleHidden('right')}
					onmouseover={() => (hintSlideRight = true)}
					onmouseout={() => (hintSlideRight = false)}
				>
					<span class="material-symbols-outlined"
						>{hidden.right ? 'chevron_left' : 'chevron_right'}</span
					>
				</button>
				{#if !hidden.right}
					<SideBarSwitch bind:selected={panelState.right} />

					{#if panelState.right === 'settings'}
						<div class="settingToggleButtons">
							<button
								onclick={() => toggleSetting('layout', 'right')}
								class:on={settingsState.right.layout}
							>
								<span class="material-symbols-outlined"> linked_services </span>
							</button>
							<button
								onclick={() => toggleSetting('node', 'right')}
								class:on={settingsState.right.node}
							>
								<span class="material-symbols-outlined"> masked_transitions </span>
							</button>
							<button
								onclick={() => toggleSetting('edge', 'right')}
								class:on={settingsState.right.edge}
							>
								<span class="material-symbols-outlined"> diagonal_line </span>
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.sideContainer {
		position: absolute;
		top: 0;
		height: 100%;
		font-size: 0.875rem;
		line-height: 1.25rem;
		z-index: 10;
		/* width: 450px; */
		pointer-events: none;
	}

	.leftContainer {
		left: 0px;
	}

	.rightContainer {
		right: 0px;
	}

	.panelContent {
		display: flex;
		height: 100%;
	}

	.cardStackContainer {
		flex-grow: 1;
		overflow-y: auto;

		/* Hide scrollbar for IE, Edge, and Firefox */
		-ms-overflow-style: none;
		scrollbar-width: none;

		/* Hide scrollbar for Chrome, Safari, and Opera */
		&::-webkit-scrollbar {
			display: none;
		}

		transition: transform 0.3s ease;
	}

	.cardStackContainer.hintSlideLeft {
		transform: translateX(-20px);
	}

	.cardStackContainer.hintSlideRight {
		transform: translateX(20px);
	}

	.cardStack {
		width: 380px;
		scroll-behavior: smooth;

		/* Hide scrollbar for IE, Edge, and Firefox */
		-ms-overflow-style: none;
		scrollbar-width: none;

		/* Hide scrollbar for Chrome, Safari, and Opera */
		&::-webkit-scrollbar {
			display: none;
		}
	}

	.leftContainer .cardStack {
		padding: 0 60px 0 10px;
	}

	.rightContainer .cardStack {
		padding: 0 10px 0 60px;
	}

	.leftContainer .buttonContainer {
		margin-left: -35px;
	}

	.rightContainer .buttonContainer {
		margin-right: -35px;
	}

	.leftContainer .buttonContainer.stackHidden {
		margin-left: 10px;
	}

	.rightContainer .buttonContainer.stackHidden {
		margin-right: 10px;
	}

	.buttonContainer {
		display: flex;
		flex-direction: column;
		margin-top: 20px;
		/* pointer-events: none; */
		transition: margin-left 0.3s ease;
	}

	.buttonContainer button {
		margin-bottom: 5px;
		pointer-events: auto;
	}

	.settingToggleButtons {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.settingToggleButtons button {
		border: none;
		cursor: pointer;
		border-radius: 50%;
		color: #676767;
	}

	.settingToggleButtons span {
		font-size: 17px;
	}

	.settingToggleButtons button.on {
		text-shadow: 0 0 3px #616161;
		color: #000000;
	}

	/* Adjust the layout for the right container */
	.rightContainer .panelContent {
		flex-direction: row-reverse;
	}
</style>
