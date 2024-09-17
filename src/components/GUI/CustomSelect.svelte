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
	let dropdownWidth = $state(0);

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
	let dropdownElement: HTMLUListElement;
	let measureElement: HTMLSpanElement;

	function handleClickOutside(event: MouseEvent) {
		if (!selectContainer.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		calculateDropdownWidth();
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	function handleKeydown(event: KeyboardEvent) {
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

	function calculateDropdownWidth() {
		if (measureElement) {
			let maxWidth = 0;
			values.forEach((value) => {
				measureElement.textContent = String(value);
				const width = measureElement.offsetWidth;
				maxWidth = Math.max(maxWidth, width);
			});
			dropdownWidth = maxWidth + 40; // Add padding for the dropdown
		}
	}

	$effect(() => {
		selectedIndex = values.indexOf(selected);
	});

	$effect(() => {
		if (!isOpen) selectedIndexByKeyboard = false;
	});

	$effect(() => {
		if (isOpen) {
			calculateDropdownWidth();
			if (selectedIndex !== null) {
				tick().then(() => {
					const options = dropdownElement.querySelectorAll('.select-option');
					options[selectedIndex]?.scrollIntoView({ block: 'nearest' });
				});
			}
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
		<ul
			class="select-dropdown"
			role="listbox"
			tabindex="-1"
			onkeydown={handleKeydown}
			onmouseover={() => (selectedIndexByKeyboard = false)}
			style="top: {openUp ? 'auto' : '100%'}; bottom: {openUp
				? '100%'
				: 'auto'}; width: {dropdownWidth}px; right: {alignRight ? '0' : 'auto'}; left: {alignRight
				? 'auto'
				: '0'};"
			class:alignRight
			bind:this={dropdownElement}
		>
			{#each values as value, index}
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

	<span bind:this={measureElement} class="measure-element"></span>
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
		background-color: var(--card-bg-color);
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
		border-radius: 10px 10px 10px 10px;
	}

	.select-dropdown {
		position: absolute;
		left: -10px;
		background-color: var(--card-bg-color);
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
		white-space: nowrap;
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

	.measure-element {
		position: absolute;
		visibility: hidden;
		height: auto;
		width: auto;
		white-space: nowrap;
		font-family: inherit;
		font-size: inherit;
		font-style: inherit;
		font-weight: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
	}
</style>
