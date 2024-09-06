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

	let {
		guideline,
		expand,
		first = false
	}: {
		guideline: Guideline;
		expand: (guideline: Guideline, div: HTMLDivElement) => void;
		first: boolean;
	} = $props();

	let graphSettings = getContext('graphSettings') as GraphSettingsClass;
	let neighborGraphSettings = getContext('neighborGraphSettings') as GraphSettingsClass;
	// let parentDiv: HTMLDivElement;

	let applyHovered: boolean = $state(false);

	let toggleSplitView: (left: boolean, right: boolean) => void = getContext('toggleSplitView');

	function applyInSplitView() {
		toggleSplitView(true, true);
		applyGuideline(guideline, neighborGraphSettings);
	}

	let citationsPromise: Promise<Citation[]> = Promise.all(
		guideline.literature.map(getCitationInfo)
	);

	let editing = $state(false);
	let editedGuideline: Guideline | null = $state(null);

	function edit() {
		editedGuideline = $state.snapshot(guideline);
		editing = true;
	}

	function saveEditedGuideline() {
		console.log('save');
		console.log(editedGuideline);
		console.log(guideline);
		guideline = editedGuideline!;
		editing = false;
		calculateApplicability(guideline);
	}
</script>

<div
	bind:this={guideline.parentDiv}
	class="card cardSpacing"
	class:expanded={guideline.expanded}
	class:first={first === true}
>
	{#if editing}
		<GuidelineEditor bind:guideline={editedGuideline!} saveFunction={saveEditedGuideline} />
	{:else}
		<GuidelineHeader {guideline} />
		<div class="text-sm my-2">{guideline.description}</div>

		<Literature literature={guideline.literature} />

		<GuidelineSettings
			recommendations={guideline.recommendations}
			conflicts={guideline.status?.conflicts}
		/>

		<button class="text-sm" onclick={() => expand(guideline, guideline.parentDiv!)}>expand</button>
		<button class="text-sm" onclick={edit}>edit</button>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bottomRow" onmouseleave={() => (applyHovered = false)}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div onmouseenter={() => (applyHovered = true)} class="flex">
				{#if applyHovered && guideline.status?.applied != 'fully'}
					<button
						onclick={applyInSplitView}
						class="card splitButton"
						transition:blur={{ duration: 100 }}
						use:hoverPopup={{ text: 'open in split view', delay: 400, position: 'left' }}
					>
						<span class="material-symbols-outlined"> splitscreen_right </span>
					</button>
				{/if}

				<button
					onclick={() => applyGuideline(guideline, graphSettings)}
					class={guideline.status?.applied === 'fully' ? 'cardInset' : 'card'}
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

			{#if guideline.status?.conflicts.length > 0}
				<button class="conflictButton">
					<span class="material-symbols-outlined"> error </span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.first {
		margin-top: 10px;
	}

	.expanded {
		height: 100%;
	}

	.bottomRow {
		display: flex;
		flex-direction: row-reverse;
	}

	.bottomRow button {
		padding: 5px 10px;
		border-radius: 10px;
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
		display: flex;
		align-items: center;
		margin: 0px 5px;
	}

	.splitButton span {
		font-size: 18px;
	}
</style>
