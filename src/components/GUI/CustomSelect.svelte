<script lang="ts">
	import { tick } from 'svelte';
	import autoAnimate from '@formkit/auto-animate';
	import { onDestroy, onMount } from 'svelte';

	let {
		selected = $bindable(),
		values,
		width,
		maxHeight = 200,
		openUp = false,
		onChange = () => {},
		alignRight = false,
		fontSize = 14
	}: {
		selected: string | boolean;
		values: string[] | boolean[];
		width?: number;
		maxHeight?: number;
		openUp?: boolean;
		onChange?: (index: number) => void;
		alignRight?: boolean;
		fontSize?: number;
	} = $props();

	let isOpen = $state(false);
	let selectedIndex = $state(0);
	let selectedIndexByKeyboard = $state(false);

	function toggleSelect() {
		isOpen = !isOpen;
	}

	function selectOption(value: string, index: number) {
		selected = value;
		selectedIndex = index;
		isOpen = false;
		onChange(index);
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
				selectedIndexByKeyboard = true;
				selectedIndex = (selectedIndex - 1 + values.length) % values.length;
				break;
			case 'ArrowDown':
				event.preventDefault();
				selectedIndexByKeyboard = true;
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
		if (!isOpen) selectedIndexByKeyboard = false;
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

<div
	class="custom-select"
	use:autoAnimate
	bind:this={selectContainer}
	style="width: {width ? '{width}px' : '100%'}; font-size: {fontSize}px;"
>
	<button
		class="select-button"
		onclick={toggleSelect}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		onkeydown={handleKeydown}
		class:alignRight
	>
		{selected}
		<span class="arrow material-symbols-outlined" aria-hidden="true">keyboard_arrow_down</span>
	</button>

	{#if isOpen}
		<!-- svelte-ignore a11y_mouse_events_have_key_events -->
		<ul
			class="select-dropdown"
			role="listbox"
			tabindex="-1"
			onkeydown={handleKeydown}
			onmouseover={() => (selectedIndexByKeyboard = false)}
			style="top: {openUp ? 'auto' : '100%'}; bottom: {openUp ? '100%' : 'auto'};"
			class:alignRight
		>
			{#each values as value, index}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					class="select-option"
					role="option"
					aria-selected={value === selected}
					onclick={() => selectOption(value, index)}
					class:highlight={index === selectedIndex && selectedIndexByKeyboard}
				>
					{value}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.custom-select {
		position: relative;
		font-family: 'UncutSans';
	}

	.select-button {
		text-transform: uppercase;
		font-style: italic;
		width: 100%;
		padding: 0px;
		background-color: --card-bg-color;
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		transition: all 0.3s ease;
		z-index: 100000;
		display: flex;
		align-items: center;
	}

	.select-button:hover .arrow {
		transform: translateY(2px);
	}

	.arrow {
		transition: transform 0.3s ease;
		padding: 0 5px;
		font-size: 16px;
	}

	.select-button[aria-expanded='true'] .arrow {
		transform: rotate(180deg);
	}

	.select-button[aria-expanded='true'] {
		/* background-color: rgba(0, 0, 0, 1); */
		/* color: white; */
		border-radius: 10px 10px 10px 10px;
	}

	.select-dropdown {
		position: absolute;
		/* top: 110%; */
		/* bottom: 0; */
		left: -10px;
		right: 0;
		/* border: 1px solid #ddd; */
		background-color: --card-bg-color;
		border-top: none;
		border-radius: 11px;
		max-height: 200px;
		overflow-y: auto;
		list-style: none;
		padding: 0;
		margin: 0;
		background-color: rgba(0, 0, 0, 1);
		box-shadow: 0 0px 8px 0cap rgba(0, 0, 0, 0.2);
		color: white;
		padding: 5px;
		z-index: 100001;
	}

	.select-option {
		padding: 1px 5px;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		background-color: transparent;
		text-transform: uppercase;
		transition: all 0.3s ease;
		text-overflow: clip;
	}

	.select-option:hover,
	.highlight {
		transform: translateX(10px);
	}

	.alignRight .select-option:hover,
	.alignRight .highlight {
		transform: translateX(-10px);
	}

	.select-option[aria-selected='true'] {
		font-weight: bold;
	}

	.alignRight {
		text-align: right;
		flex-direction: row-reverse;
	}
</style>
