<script lang="ts">
	import { tick } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { onDestroy, onMount } from 'svelte';

	let { selected = $bindable(), values }: { selected: string; values: string[] } = $props();

	let isOpen = $state(false);
	let selectedIndex = $state(0);

	function toggleSelect() {
		isOpen = !isOpen;
	}

	function selectOption(value: string, index: number) {
		selected = value;
		selectedIndex = index;
		isOpen = false;
	}

	let selectContainer: HTMLElement;
	function handleClickOutside(event: MouseEvent) {
		if (!selectContainer.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	function handleKeydown(event: KeyboardEvent) {
		console.log('handleKeydown', isOpen, event.key);
		if (!isOpen) return;

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = (selectedIndex - 1 + values.length) % values.length;
				break;
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % values.length;
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				selectOption(values[selectedIndex], selectedIndex);
				break;
			case 'Escape':
				isOpen = false;
				break;
		}
	}

	$effect(() => {
		selectedIndex = values.indexOf(selected);
	});

	$effect(() => {
		if (isOpen && selectedIndex) {
			tick().then(() => {
				console.log('scrolled');
				const options = document.querySelectorAll('.select-option');
				options[selectedIndex]?.scrollIntoView({ block: 'nearest' });
			});
		}
	});
</script>

<div class="custom-select" use:autoAnimate bind:this={selectContainer}>
	<button
		class="select-button"
		onclick={toggleSelect}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		onkeydown={handleKeydown}
	>
		{selected}
		<span class="arrow" aria-hidden="true">▼</span>
	</button>

	{#if isOpen}
		<ul class="select-dropdown" role="listbox" tabindex="-1" onkeydown={handleKeydown}>
			{#each values as value, index}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					class="select-option"
					role="option"
					aria-selected={value === selected}
					onclick={() => selectOption(value, index)}
					class:highlight={index === selectedIndex}
				>
					/ {value}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.custom-select {
		position: relative;
		width: 200px;
		z-index: 100000;
	}

	.select-button {
		width: 100%;
		padding: 10px;
		background-color: --card-bg-color;
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		font-size: 16px;
		transition: all 0.3s ease;
	}

	.select-button:hover {
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.arrow {
		float: right;
		transition: transform 0.3s ease;
	}

	.select-button[aria-expanded='true'] .arrow {
		transform: rotate(180deg);
	}

	.select-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		/* border: 1px solid #ddd; */
		background-color: --card-bg-color;
		border-top: none;
		border-radius: 10px 10px 10px 10px;
		max-height: 200px;
		overflow-y: auto;
		list-style: none;
		padding: 0;
		margin: 0;
		background-color: rgba(0, 0, 0, 1);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		color: white;
		padding: 5px;
	}

	.select-option {
		padding: 1px 5px;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		background-color: transparent;
		text-transform: uppercase;
		transition: all 0.3s ease;
	}

	.select-option:hover {
		padding-left: 15px;
	}

	.highlight {
		/* background-color: #f0f0f0; */
	}

	.select-option[aria-selected='true'] {
		font-weight: bold;
	}
</style>
