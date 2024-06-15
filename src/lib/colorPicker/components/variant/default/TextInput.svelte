<script lang="ts">
	import type { Texts } from '$lib/colorPicker/utils/texts';
	import type { RgbaColor, HsvaColor } from 'colord';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		input: { hsv?: HsvaColor; rgb?: RgbaColor; hex?: string };
	}>();

	/** if set to false, disables the alpha channel */
	export let isAlpha: boolean;

	/** rgb color */
	export let rgb: RgbaColor;

	/** hsv color */
	export let hsv: HsvaColor;

	/** hex color */
	export let hex: string;

	/** configure which hex, rgb and hsv inputs will be visible and in which order. If overridden, it is necessary to provide at least one value */
	export let textInputModes: Array<'hex' | 'rgb' | 'hsv'>;

	/** all translation tokens used in the library; can be partially overridden; see [full object type](https://github.com/Ennoriel/svelte-awesome-color-picker/blob/master/src/lib/texts.ts) */
	export let texts: Texts;

	export let closeFunction: () => void;

	const HEX_COLOR_REGEX = /^#?([A-F0-9]{6}|[A-F0-9]{8})$/i;

	let mode = 0;

	$: h = Math.round(hsv.h);
	$: s = Math.round(hsv.s);
	$: v = Math.round(hsv.v);
	$: a = hsv.a === undefined ? 1 : Math.round(hsv.a * 100) / 100;

	type InputEvent = Event & { currentTarget: EventTarget & HTMLInputElement };

	function updateHex(e: InputEvent) {
		const target = e.target as HTMLInputElement;
		if (HEX_COLOR_REGEX.test(target.value)) {
			hex = target.value;
			dispatch('input', { hex });
		}
	}

	function updateRgb(property: string) {
		return function (e: InputEvent) {
			rgb = { ...rgb, [property]: parseFloat((e.target as HTMLInputElement).value) };
			dispatch('input', { rgb });
		};
	}

	function updateHsv(property: string) {
		return function (e: InputEvent) {
			hsv = { ...hsv, [property]: parseFloat((e.target as HTMLInputElement).value) };
			dispatch('input', { hsv });
		};
	}
</script>

<div class="text-input">
	<div class="input-container">
		<div class="underColor">
			{#if mode === 0}
				<input class="hex-input" aria-label={texts.label.hex} value={hex} on:input={updateHex} />
			{:else if mode === 1}
				<input
					class="rgb-input"
					aria-label={texts.label.r}
					value={rgb.r}
					type="number"
					min="0"
					max="255"
					style="color: #df2f2f;"
					on:input={updateRgb('r')}
				/>
				<input
					class="rgb-input"
					aria-label={texts.label.g}
					value={rgb.g}
					type="number"
					min="0"
					max="255"
					style="color: #12bb2e;"
					on:input={updateRgb('g')}
				/>
				<input
					class="rgb-input"
					aria-label={texts.label.b}
					value={rgb.b}
					type="number"
					min="0"
					max="255"
					style="color: #1979b4;"
					on:input={updateRgb('b')}
				/>
			{:else}
				<input
					class="hsv-input"
					aria-label={texts.label.h}
					value={h}
					type="number"
					min="0"
					max="360"
					on:input={updateHsv('h')}
				/>
				<input
					class="hsv-input"
					aria-label={texts.label.s}
					value={s}
					type="number"
					min="0"
					max="100"
					on:input={updateHsv('s')}
				/>
				<input
					class="hsv-input"
					aria-label={texts.label.v}
					value={v}
					type="number"
					min="0"
					max="100"
					on:input={updateHsv('v')}
				/>
			{/if}
			{#if isAlpha}
				<input
					class="alpha-input"
					aria-label={texts.label.a}
					value={a}
					type="number"
					min="0"
					max="1"
					step="0.01"
					on:input={mode <= 1 ? updateRgb('a') : updateHsv('a')}
				/>
			{/if}
		</div>
		<button class="cycleButton" on:click={() => (mode = (mode + 1) % 3)}>
			<span class="material-symbols-outlined"> cycle </span>
		</button>
	</div>

	<!-- <div class="flex gap-3">
		{#if textInputModes.length > 1}
			<button on:click={() => (mode = (mode + 1) % 3)}>
				<span class="disappear" aria-hidden="true">{texts.color[textInputModes[mode]]}</span>
				<span class="appear">{texts.changeTo} {texts.color[textInputModes[(mode + 1) % 3]]}</span>
			</button>
		{/if} 
		{#if closeFunction}
			<button on:click={closeFunction}>close</button>
		{/if}
	</div> -->
</div>

<!-- 
@component text inputs for the hex, rgb and hsv colors. This component cannot be imported
directly but can be overridden.

**Import**
_N.A._

**Use**
_N.A._

**Props**
@prop isAlpha: boolean — if set to false, disables the alpha channel
@prop rgb: RgbaColor — rgb color
@prop hsv: HsvaColor — hsv color
@prop hex: string — hex color
@prop textInputModes: Array&lt;'hex' | 'rgb' | 'hsv'&gt; — configure which hex, rgb and hsv inputs will be visible and in which order. If overridden, it is necessary to provide at least one value
@prop texts: Texts — all translation tokens used in the library; can be partially overridden; see [full object type](https://github.com/Ennoriel/svelte-awesome-color-picker/blob/master/src/lib/texts.ts)
-->
<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
	}

	.text-input {
		margin: var(--text-input-margin, 5px 0 0);
	}
	.input-container {
		display: flex;
		flex: 1;
	}
	.underColor {
		display: flex;
		width: 200px;
		/* justify-content: center; */
		padding: 0 10px;
	}
	input,
	button {
		/* flex: 1; */
		/* border: none; */
		background-color: transparent;
		color: var(--cp-border-color);
		padding: 0;
		/* height: 20px;
		line-height: 30px; */
		text-align: center;
		font-weight: 400;
		font-size: 14px;
	}

	.hex-input {
		width: 70px;
		flex: 3;
		border-right: grey 1px solid;
		margin-right: -1px;
	}

	.rgb-input,
	.hsv-input {
		flex: 1;
		border-right: grey 1px solid;
		border-radius: 0;
		margin-right: -1px;
	}

	.alpha-input {
		/* border-left: grey 1px solid; */
		border-radius: 0;
		margin-left: auto;
		text-align: center;
		flex: 1;
	}
	/* input {
		width: 200px;
	} */

	.cycleButton {
		width: 24px;
		height: 24px;
		flex: 1;
		justify-content: center;
		align-items: center;
		display: flex;
	}

	.cycleButton span {
		font-size: 16px;
	}

	/* button {
		position: relative;
		flex: 1;
		margin: 8px 0 0;
		height: 30px;
		width: 100%;
		transition: background-color 0.2s;
		cursor: pointer;
	} */

	.appear,
	.disappear {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		transition: all 0.5s;
	}
	button:hover .disappear,
	.appear {
		opacity: 0;
	}

	.disappear,
	button:hover .appear {
		opacity: 1;
	}

	/* button:hover {
		background-color: var(--cp-button-hover-color, #ccc);
	} */

	input:focus,
	button:focus {
		outline: none;
	}

	/* input:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--focus-color, red);
		outline-offset: 2px;
	} */
</style>
