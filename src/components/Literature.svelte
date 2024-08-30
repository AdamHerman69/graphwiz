<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import type { Citation } from '../utils/citation.svelte';
	import Collapser from './GUI/Collapser.svelte';
	import { bin } from 'd3';

	let { citations }: { citations: Citation[] } = $props();

	let expanded = $state(false);
</script>

<div class="literature" use:autoAnimate>
	{#if !expanded}
		<div class="minimized text-xs" onclick={() => (expanded = true)}>
			<span class="material-symbols-outlined"> book_5 </span>
			<div class="papers">
				{#each citations as citation, index}
					{citation.authors ? citation.authors[0].family : 'unknown'} ({citation.created.getFullYear()}){index <
					citations.length - 1
						? ', '
						: ''}
				{/each}
			</div>
			<Collapser bind:collapsed={expanded} />
		</div>
	{:else}
		<div class="expanded labelContainer w-full">
			{#each citations as citation, index}
				<div class={index < citations.length - 1 ? 'p-2' : 'px-2 pt-2'}>
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
					<div class="authors">
						{#each citation.authors as author, index}
							{author.given} {author.family}{index < citation.authors.length - 1 ? ', ' : ''}
						{/each}
					</div>
					<div class="abstract">{citation.abstract}</div>
				</div>
				<div class={`mx-3 ${index < citations.length - 1 ? 'border-b border-gray-200' : ''}`} />
			{/each}

			<div class="closeDiv flex justify-end">
				<button class="text-xs" onclick={() => (expanded = false)}
					><span class="material-symbols-outlined">close</span></button
				>
			</div>
		</div>
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

	.expanded .title {
		font-size: 12px;
		font-weight: bold;
		line-height: 120%;
		margin-bottom: 3px;
		flex: 1;
	}

	.expanded .subtitle {
		font-weight: bold;
		font-style: italic;
	}

	.expanded .authors {
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

	.closeDiv span {
		font-size: 16px;
	}

	.closeDiv button {
		display: flex;
		align-items: center;
	}
</style>
