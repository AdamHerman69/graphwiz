<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	/** min value of the slider */
	export let min: string | number = 0;
	$: _min = typeof min === 'string' ? parseFloat(min) : min;

	/** max value of the slider */
	export let max: string | number = 100;
	$: _max = typeof max === 'string' ? parseFloat(max) : max;

	/** step value of the slider */
	export let step: string | number = 1;
	$: _step = typeof step === 'string' ? parseFloat(step) : step;

	/** value of the slider */
	export let value: number = 50;

	/**
	 * method to convert the current value to a string representation of the value for the `aria-valuetext` attribute.
	 * For example, a battery meter value might be conveyed as aria-valuetext="8% (34 minutes) remaining".
	 * See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext)
	 */
	export let ariaValueText: (current: number) => string = (current) => current.toString();

	/** input name of the slider */
	export let name: string | undefined = undefined;

	/** direction of the slider */
	export let direction: 'horizontal' | 'vertical' = 'horizontal';

	/** if true, the min and max values will be reversed */
	export let reverse: boolean = false;

	/** disables mouse events */
	export let keyboardOnly: boolean = false;

	/** div element representing the slider */
	export let slider: HTMLDivElement | undefined = undefined;

	/** aria-label props */
	export let ariaLabel: string | undefined = undefined;

	/** aria-labelledby props */
	export let ariaLabelledBy: string | undefined = undefined;

	/** aria-controls props */
	export let ariaControls: string | undefined = undefined;

	/** indicate if the slider is being dragged */
	export let isDragging: boolean = false;

	export let seeThrough: boolean = false;

	const dispatch = createEventDispatcher<{
		input: number;
	}>();

	function bound(value: number) {
		const ratio = 1 / _step;
		const rounded = Math.round(value * ratio) / ratio;
		return Math.max(_min, Math.min(_max, rounded));
	}

	function keyHandler(e: KeyboardEvent) {
		const inc = e.shiftKey ? _step * 10 : _step;
		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			value += inc;
			e.preventDefault();
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			value -= inc;
			e.preventDefault();
		} else if (e.key === 'Home') {
			value = _min;
			e.preventDefault();
		} else if (e.key === 'End') {
			value = _max;
			e.preventDefault();
		} else if (e.key === 'PageUp') {
			value += _step * 10;
			e.preventDefault();
		} else if (e.key === 'PageDown') {
			value -= _step * 10;
			e.preventDefault();
		}
		value = bound(value);
		dispatch('input', value);
	}

	const config = {
		horizontal: {
			clientSize: 'clientWidth',
			offset: 'left',
			client: 'clientX'
		},
		vertical: {
			clientSize: 'clientHeight',
			offset: 'top',
			client: 'clientY'
		}
	} as const;

	function updateValue(e: { clientX: number; clientY: number }) {
		const clientWidth = slider?.[config[direction].clientSize] || 120;
		const sliderOffsetX = slider?.getBoundingClientRect()[config[direction].offset] || 0;

		let offsetX = e[config[direction].client] - sliderOffsetX;
		if (direction === 'vertical') offsetX = -1 * offsetX + clientWidth;

		if (reverse) {
			value = _max - (offsetX / clientWidth) * (_max - _min);
		} else {
			value = (offsetX / clientWidth) * (_max - _min) + _min;
		}

		value = bound(value);
		dispatch('input', value);
	}

	function jump(e: MouseEvent) {
		updateValue(e);
		isDragging = true;
	}

	function drag(e: MouseEvent) {
		if (isDragging) updateValue(e);
	}

	function endDrag() {
		isDragging = false;
	}

	function touch(e: TouchEvent) {
		updateValue({
			clientX: e.changedTouches[0].clientX,
			clientY: e.changedTouches[0].clientY
		});
	}

	$: position = (((value - _min) / (_max - _min)) * 1).toFixed(4);
</script>

<svelte:window on:mousemove={drag} on:mouseup={endDrag} />

<div
	class="slider"
	class:reverse
	role="slider"
	aria-orientation={direction}
	aria-valuemax={_max}
	aria-valuemin={_min}
	aria-valuenow={value}
	aria-valuetext={ariaValueText(value)}
	aria-label={ariaLabel}
	aria-labelledby={ariaLabelledBy}
	aria-controls={ariaControls}
	tabindex="0"
	bind:this={slider}
	style:--position={position}
	on:keydown={keyHandler}
	on:mousedown|self={keyboardOnly ? undefined : jump}
	on:touchstart|nonpassive|preventDefault={keyboardOnly ? undefined : touch}
	on:touchmove|nonpassive|preventDefault={keyboardOnly ? undefined : touch}
	on:touchend|nonpassive|preventDefault={keyboardOnly ? undefined : touch}
>
	<div class="track {seeThrough ? '' : 'trackShadow'}" />
	<div class="thumb {seeThrough ? '' : 'thumbShadow'}" />
</div>

{#if name}
	<input type="hidden" {name} {value} />
{/if}

<!-- @component

**Props**
@prop min: string | number = 0 — min value of the slider
@prop max: string | number = 100 — max value of the slider
@prop step: string | number = 1 — step value of the slider
@prop value: number = 50 — value of the slider
@prop ariaValueText: (current: number) =&gt; string = (current) => current.toString() — method to convert the current value to a string representation of the value for the `aria-valuetext` attribute. For example, a battery meter value might be conveyed as aria-valuetext="8% (34 minutes) remaining". See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext)
@prop name: string | undefined = undefined — input name of the slider
@prop direction: 'horizontal' | 'vertical' = 'horizontal' — direction of the slider
@prop reverse: boolean = false — if true, the min and max values will be reversed
@prop keyboardOnly: boolean = false — disables mouse events
@prop slider: HTMLDivElement | undefined = undefined — div element representing the slider
@prop ariaLabel: string | undefined = undefined — aria-label props
@prop ariaLabelledBy: string | undefined = undefined — aria-labelledby props
@prop isDragging: boolean = false — indicate if the slider is being dragged
-->

<style>
	.slider {
		---track-width: var(--track-width, unset);
		---track-height: var(--track-height, 6px);
		---track-background: var(--track-background, #949494);
		---track-border: var(--track-border, none);
		/* ---thumb-size: var(--thumb-size, 16px); */
		---thumb-size: 14px;
		---thumb-background: var(--thumb-background, #2d2d2d);
		/* ---thumb-border: var(--thumb-border, none); */
		---thumb-border: none;
		---position: var(--position, 0px);

		---margin-inline-thumb-bigger: max(var(---thumb-size) - var(---track-height), 0px);
		---margin-inline-thumb-smaller: max(var(---track-height) - var(---thumb-size), 0px);

		position: relative;
		margin: auto;
		user-select: none;
		-webkit-user-select: none;
	}

	[aria-orientation='horizontal'] {
		width: var(---track-width);
		max-width: calc(100% - 2 * var(---margin-inline-thumb-bigger));
		height: calc(max(var(---track-height), var(---thumb-size)) + 4px);
		height: max(var(---track-height), var(---thumb-size));
		margin-inline: var(---margin-inline-thumb-bigger);
		margin-block: var(--margin-block, 8px);
	}

	[aria-orientation='vertical'] {
		width: calc(max(var(---track-height), var(---thumb-size)) + 4px);
		width: max(var(---track-height), var(---thumb-size));
		height: var(---track-width);
		max-height: calc(100% - 2 * var(---margin-inline-thumb-bigger));
		margin-block: var(---margin-inline-thumb-bigger);
		margin-inline: var(--margin-block, 8px);
	}

	.track {
		position: absolute;
		pointer-events: none;
		background: var(---track-background);
		border: var(---track-border);
		border-radius: calc(var(---track-height) / 2);
		box-sizing: border-box;
	}

	[aria-orientation='horizontal'] .track {
		height: var(---track-height);
		top: 50%;
		transform: translateY(-50%);
		left: 0;
		right: 0;
	}

	[aria-orientation='vertical'] .track {
		width: var(---track-height);
		left: 50%;
		transform: translateX(-50%);
		top: 0;
		bottom: 0;
	}

	.thumb {
		pointer-events: none;
		position: absolute;
		height: var(---thumb-size);
		width: var(---thumb-size);
		border-radius: calc(var(---thumb-size) / 2);
		background: var(---thumb-background);
		border: var(---thumb-border);
		box-sizing: border-box;

		transform: translate(-50%, -50%);
		--margin-left: (
				2 * var(---track-height) - var(---thumb-size) - var(---margin-inline-thumb-smaller)
			) / 2;
		--left: calc(var(---position) * (100% - 2 * var(--margin-left)) + var(--margin-left));
	}

	.thumbShadow {
		box-shadow:
			0px 0px 10px 0px rgba(0, 0, 0, 0.7),
			inset 0px 0px 5px 0px rgba(0, 0, 0, 0.2);
	}

	.trackShadow {
		box-shadow: inset 0px 0px 10px 0px rgba(0, 0, 0, 0.5);
	}

	[aria-orientation='horizontal']:not(.reverse) .thumb {
		top: 50%;
		left: var(--left);
	}

	[aria-orientation='vertical']:not(.reverse) .thumb {
		left: 50%;
		bottom: calc(var(--left) - var(---thumb-size));
	}

	[aria-orientation='horizontal'].reverse .thumb {
		top: 50%;
		right: calc(var(--left) - var(---thumb-size));
	}

	[aria-orientation='vertical'].reverse .thumb {
		left: 50%;
		top: calc(var(--left));
	}

	.slider:focus-visible {
		outline: none;
	}

	.slider:focus-visible .track {
		outline: 2px solid var(--focus-color, red);
		outline-offset: 2px;
	}
</style>
