<script lang="ts">
	import { type Guideline, isComposite, applyGuideline } from '../utils/guideline.svelte';
	import { type GraphSettingsClass } from '../utils/graphSettings.svelte';
	import { getContext, onMount } from 'svelte';
	import Score from './Score.svelte';
	import ScoreBar from './GUI/ScoreBar.svelte';
	import WeightedCondition from './WeightedCondition.svelte';
	import GuidelineHeader from './GuidelineHeader.svelte';
	import GuidelineSettings from './GuidelineSettings.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { blur } from 'svelte/transition';
	import { hoverPopup } from './GUI/hoverPopup.svelte';
	import { type Citation, getCitationInfo } from '../utils/citation.svelte';
	import Literature from './Literature.svelte';
	import GuidelineEditor from './GuidelineEditor.svelte';
	import { calculateApplicability } from '../utils/guideline.svelte';
	import { downloadFile } from '../utils/helperFunctions';
	import { toStaticGuideline } from '../utils/guideline.svelte';

	let {
		guideline = $bindable(),
		expand,
		first = false
	}: {
		guideline: Guideline;
		expand: (guideline: Guideline, div: HTMLDivElement) => void;
		first: boolean;
	} = $props();

	let graphSettings = getContext('graphSettings') as GraphSettingsClass;
	let neighborGraphSettings = getContext('neighborGraphSettings') as GraphSettingsClass;
	let cardParentDiv: HTMLDivElement;

	let applyHovered: boolean = $state(false);

	let side = getContext('side');

	let toggleSplitView: (left: boolean, right: boolean) => void = getContext('toggleSplitView');

	function applyInSplitView() {
		toggleSplitView(true, true);
		applyGuideline(guideline, neighborGraphSettings);
	}

	function downloadGuideline() {
		downloadFile(
			JSON.stringify({ guidelines: [toStaticGuideline($state.snapshot(guideline))] }, null, 2),
			'guideline_' + guideline.name,
			'application/json'
		);
	}

	let citationsPromise: Promise<Citation[]> = Promise.all(
		guideline.literature.map(getCitationInfo)
	);

	function isNewGuideline(guideline: Guideline) {
		return (
			guideline.name === 'Guideline name' && Object.keys(guideline.recommendations).length === 0
		);
	}

	function edit() {
		guideline.editedGuideline = $state.snapshot(guideline);
		if (!guideline.expanded) {
			console.log('expanding', guideline, cardParentDiv);
			expand(guideline, cardParentDiv);
		}
	}

	if (isNewGuideline(guideline)) edit();

	function saveEditedGuideline() {
		// guideline = $state.snapshot(editedGuideline)!;
		guideline.name = $state.snapshot(guideline.editedGuideline!.name);
		guideline.description = $state.snapshot(guideline.editedGuideline!.description);
		guideline.literature = $state.snapshot(guideline.editedGuideline!.literature);
		guideline.recommendations = $state.snapshot(guideline.editedGuideline!.recommendations);
		guideline.rootCondition = $state.snapshot(guideline.editedGuideline!.rootCondition);

		guideline.editedGuideline = null;
		calculateApplicability(guideline);
	}

	onMount(() => {
		guideline.parentDiv = cardParentDiv;
		console.log('onMount', guideline, cardParentDiv);
	});
</script>

<div
	bind:this={cardParentDiv}
	class="card cardSpacing"
	class:expanded={guideline.expanded}
	class:first={first === true}
>
	{#if guideline.editedGuideline}
		<GuidelineEditor
			bind:guideline={guideline.editedGuideline!}
			saveFunction={saveEditedGuideline}
		/>
	{:else}
		<GuidelineHeader {guideline} />
		<div class="description">{guideline.description}</div>

		<GuidelineSettings
			recommendations={guideline.recommendations}
			conflicts={guideline.status?.conflicts}
		/>

		<Literature literature={guideline.literature} />

		<!-- <button class="buttonGeneral" onclick={() => console.log($state.snapshot(guideline))}
			>log</button
		> -->

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bottomRow" onmouseleave={() => (applyHovered = false)}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div onmouseenter={() => (applyHovered = true)} class="flex">
				<!-- {#if applyHovered && guideline.status?.applied != 'fully'}
					
				{/if} -->

				<button
					onclick={() => applyGuideline(guideline, graphSettings)}
					class={guideline.status?.applied}
				>
					{#if guideline.status?.applied === 'fully'}
						applied
					{:else if guideline.status?.applied === 'partially'}
						reapply
					{:else}
						apply
					{/if}
				</button>
			</div>

			<div class="flex">
				<button
					onclick={applyInSplitView}
					class="splitButton buttonGeneral"
					transition:blur={{ duration: 100 }}
					use:hoverPopup={{
						text: 'open in split view',
						delay: 300,
						position: side === 'left' ? 'right' : 'left'
					}}
				>
					<span class="material-symbols-outlined"> splitscreen_right </span>
				</button>

				<button
					class="buttonGeneral"
					use:hoverPopup={{
						text: 'expand guideline',
						delay: 300,
						position: side === 'left' ? 'right' : 'left'
					}}
					onclick={() => {guideline.parentDiv = cardParentDiv; expand(guideline, cardParentDiv!)}}
					><span class="material-symbols-outlined"> open_in_full </span></button
				>
				<button
					class="buttonGeneral"
					use:hoverPopup={{
						text: 'download guideline',
						delay: 300,
						position: side === 'left' ? 'right' : 'left'
					}}
					onclick={downloadGuideline}
					><span class="material-symbols-outlined"> download </span></button
				>

				<button
					class="buttonGeneral"
					use:hoverPopup={{
						text: 'edit guideline',
						delay: 300,
						position: side === 'left' ? 'right' : 'left'
					}}
					onclick={edit}><span class="material-symbols-outlined"> edit </span></button
				>

				<!-- {#if guideline.status?.conflicts.length > 0}
				<button class="conflictButton">
					<span class="material-symbols-outlined"> error </span>
				</button>
			{/if} -->
			</div>
		</div>
	{/if}
</div>

<style>
	.first {
		margin-top: 10px;
	}

	.expanded {
		height: 100%;
		width: 100%;
	}

	.bottomRow {
		display: flex;
		justify-content: space-between;
		align-self: flex-end;
	}

	.bottomRow button {
		padding: 5px 3px;
		border-radius: 10px;
		text-transform: uppercase;
		font-weight: bold;
		margin-top: 5px;
	}

	.conflictButton {
		display: flex;
		justify-items: center;
		align-items: center;
		padding: 5px 5px;
	}

	.conflictButton span {
		font-size: 20px;
	}

	.conflictButton::before {
		content: 'overrides conflicts';
		padding: 5px;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		font-size: 12px;
	}

	.conflictButton:hover::before {
		opacity: 1;
	}

	.splitButton {
		margin: 0px 5px;
	}

	.splitButton span {
		font-size: 18px;
	}

	.description {
		margin: 8px 0px;
		font-style: italic;
	}

	button.partially,
	button.notApplied,
	button.fully {
		padding: 5px 20px;
		background-color: black;
		color: white;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	button.fully {
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		background-color: transparent;
		color: black;
	}

	/* 

	.partially {
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		background-color: black;
		color: white;
	}

	.notApplied {
		box-shadow:
			inset 0 0 5px rgba(255, 255, 255, 0.7),
			0 0 10px rgba(255, 255, 255, 0.5);
		transition: all 0.2s ease;
	} */

	.notApplied:hover {
		box-shadow:
			inset 0 0 5px rgba(0, 0, 0, 0.1),
			0 0 15px rgba(0, 0, 0, 0.3);
		transform: scale(1.05);
	}
</style>
