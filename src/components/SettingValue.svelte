<script lang="ts">
	import { colord } from 'colord';
	import {
		type ColorSetting,
		type DecoratorSetting,
		type NumericalSetting,
		type SelectSetting
	} from '../utils/graphSettings.svelte';
	import type { Rule } from '../utils/rules.svelte';
	import { hoverPopup } from './GUI/hoverPopup.svelte';

	let {
		setting,
		rule = null,
		collapsed = $bindable(true)
	}: {
		setting: SelectSetting<any> | NumericalSetting | ColorSetting | DecoratorSetting;
		rule: Rule | null;
		collapsed: boolean;
	} = $props();

	let hovered = $state(false);
	let valueDisplayWidth = $state(0);
	let expandedWidth = $derived(`${valueDisplayWidth + 40}px`);
	let valueString = $derived.by(() => {
		if (settingTypes[setting.name] === 'color') {
			return colord(setting.value[0][0]).toRgbString();
		}
		return setting.value;
	});

	const settingIcons = {
		size: 'open_in_full',
		color: 'palette',
		strokeWidth: 'line_weight',
		strokeColor: 'format_color_fill',
		labels: 'label',
		width: 'line_weight',
		partialStart: 'step_into',
		partialEnd: 'step_out',
		decorators: 'interests'
	};

	const settingTypes = {
		size: 'number',
		color: 'color',
		strokeWidth: 'number',
		strokeColor: 'color',
		labels: 'label',
		width: 'number',
		partialStart: 'number',
		partialEnd: 'number',
		decorators: 'decorators'
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:hoverPopup={{
		text: setting.name,
		delay: 700,
		onShow: (explanation: string) => {
			console.log('showing explanation: ', explanation);
		},
		onHide: () => {
			console.log('hiding explanation: ');
		}
	}}
	class="settingDisplay"
	class:hovered={hovered || !collapsed}
	style="width: {hovered || !collapsed ? expandedWidth : '30px'};"
	onmouseenter={() => {
		if (collapsed) hovered = true;
	}}
	onmouseleave={() => {
		if (collapsed) hovered = false;
	}}
>
	<div class="iconWrapper">
		<span class="material-symbols-outlined">{settingIcons[setting.name]}</span>
	</div>
	<div class="valueDisplay" bind:clientWidth={valueDisplayWidth}>
		{#if settingTypes[setting.name] === 'number'}
			<div>{setting.value}</div>
		{/if}
		{#if settingTypes[setting.name] === 'label'}
			<div>{setting.value}</div>
		{/if}
		{#if settingTypes[setting.name] === 'color'}
			<div class="colorDisplay" style="background-color: {valueString};"></div>
		{/if}
		{#if settingTypes[setting.name] === 'decorators'}
			<div>{setting.value.length}</div>
		{/if}
		{#if rule != null}
			<div class="iconWrapper pl-2">
				<span class="material-symbols-outlined"> flaky </span>
			</div>
		{/if}
	</div>
</div>

<style>
	.settingDisplay {
		font-size: 10px;
		height: 30px;
		transition: width 0.3s ease;
		border-radius: 20px;
		padding: 2px;
		margin: 0px 2px;
		background-color: #f0f0f0;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		overflow: hidden;
	}

	.iconWrapper {
		width: 26px;
		height: 26px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.material-symbols-outlined {
		font-size: 18px;
	}

	.valueDisplay {
		opacity: 0;
		transition: opacity 0.3s ease 0.3s;
		margin: 0px 5px;
		padding-right: 5px;
		white-space: nowrap;
		display: flex;
		align-items: center;
	}

	.settingDisplay.hovered .valueDisplay {
		opacity: 1;
	}

	.colorDisplay {
		margin-right: -5px;
		width: 15px;
		height: 15px;
		border-radius: 10px;
	}
</style>
