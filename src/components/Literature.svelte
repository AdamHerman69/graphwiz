<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import type { Citation } from '../utils/citation.svelte';
	import Collapser from './GUI/Collapser.svelte';
	import { getCitationInfo } from '../utils/citation.svelte';

	let { literature = $bindable(), editable = false }: { literature: string[]; editable: boolean } =
		$props();

	let expanded = $state(false);

	//let citationPromises: Promise<Citation>[] = $state(Promise.all(literature.map(getCitationInfo)));

	function deleteCitation(DOI: string) {
		literature = literature.filter((doi) => DOI !== doi);
	}

	let newCitationDoi = $state('');
	function newCitation() {
		if (newCitationDoi === '') return;
		literature = [...literature, newCitationDoi];
		newCitationDoi = '';
	}
</script>

{#snippet citationMini(DOI: string, last: boolean = false)}
	{#await getCitationInfo(DOI)}
		{DOI}
	{:then citation}
		{citation.authors ? citation.authors[0].family : 'unknown'} ({citation.created.getFullYear()})
	{:catch}
		{DOI}
	{/await}
	{last ? '' : ', '}
{/snippet}

{#snippet citationExpanded(DOI: string, last: boolean)}
	{#await getCitationInfo(DOI)}
		<div class="p-2 flex items-center">loading {DOI}...</div>
	{:then citation}
		<div class={last && !editable ? 'px-2 pt-2' : 'p-2'}>
			<div class="header">
				<div class="title">
					{citation.title} ({citation.created.getFullYear()})
					{#if citation.subtitle}
						<span class="subtitle"> : {citation.subtitle}</span>
					{/if}
				</div>

				<div class="link">
					<button onclick={() => window.open(citation.URL)}
						><span class="material-symbols-outlined"> open_in_new </span></button
					>
				</div>
			</div>
			<div class="flex">
				<div class="authors flex-1">
					{#each citation.authors as author, index}
						{author.given} {author.family}{index < citation.authors.length - 1 ? ', ' : ''}
					{/each}
				</div>
				{#if editable}
					<button class="deleteButton" onclick={() => deleteCitation(citation.DOI)}>
						<span class="material-symbols-outlined">close</span>
					</button>
				{/if}
			</div>
			<div class="abstract">{citation.abstract}</div>
		</div>
	{:catch}
		<div class="p-2">
			<div class="font-bold w-full">{DOI}</div>
			<div>failed to load</div>
		</div>
	{/await}
	<div class={`mx-3 ${last && !editable ? '' : 'border-b border-gray-200'}`}></div>
{/snippet}

<div class="literature" use:autoAnimate>
	{#if literature.length > 0}
		{#if !expanded && !editable}
			<div class="minimized text-xs" onclick={() => (expanded = true)}>
				<span class="material-symbols-outlined"> book_5 </span>
				<div class="papers">
					{#each literature as DOI, index}
						{@render citationMini(DOI, index === literature.length - 1)}
					{/each}
				</div>
				<Collapser bind:collapsed={expanded} />
			</div>
		{:else}
			<div class="expanded labelContainer w-full" use:autoAnimate>
				{#each literature as DOI, index (DOI)}
					{@render citationExpanded(DOI, index === literature.length - 1)}
				{/each}

				{#if editable}
					<form class="p-2 flex inputDoi">
						<input bind:value={newCitationDoi} placeholder="DOI" class="flex-1" />
						<button class="text-xs" onclick={newCitation}
							><span class="material-symbols-outlined"> add </span></button
						>
					</form>
				{/if}

				{#if !editable}
					<div class="closeDiv flex justify-end">
						<button class="text-xs" onclick={() => (expanded = false)}>
							<span class="material-symbols-outlined">close</span>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.literature {
		font-size: 12px;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		overflow: hidden;
	}

	.minimized {
		height: 30px;
		padding: 2px;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: 100%;
	}

	.minimized span {
		display: flex;
		font-size: 18px;
		margin-right: 5px;
		margin-left: -5px;
	}

	.minimized .papers {
		flex: 1;
		overflow: hidden;
		flex-wrap: nowrap;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.expanded {
	}

	.title {
		font-size: 12px;
		font-weight: bold;
		line-height: 120%;
		margin-bottom: 3px;
		flex: 1;
	}

	.subtitle {
		font-weight: bold;
		font-style: italic;
	}

	.authors {
		font-size: 10px;
		line-height: 120%;
	}

	.header {
		display: flex;
		flex-direction: row;
	}

	.link button span {
		font-size: 15px;
	}

	.closeDiv {
		margin-right: 8px;
		margin-bottom: 8px;
	}

	.closeDiv span,
	.deleteButton span {
		font-size: 16px;
	}

	.closeDiv button,
	.inputDoi button {
		display: flex;
		align-items: center;
	}

	.deleteButton {
		display: flex;
		align-items: end;
	}

	.inputDoi {
	}

	.inputDoi input {
		border: none;
		border-radius: 0;
		/* border-bottom: 1px solid #e2e8f0; */
		padding: 2px;
		margin-right: 5px;
		background-color: transparent;
		user-select: none; /* Disable text selection */
		outline: none; /* Remove outline on focus */
	}

	.inputDoi span {
		font-size: 17px;
	}
</style>
