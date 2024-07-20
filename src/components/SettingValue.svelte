<script lang="ts">
	import { colord } from 'colord';
	import {
		type ColorSetting,
		type DecoratorSetting,
		type NumericalSetting,
		type SelectSetting
	} from '../utils/graphSettings.svelte';

	let {
		setting
	}: { setting: SelectSetting<any> | NumericalSetting | ColorSetting | DecoratorSetting } =
		$props();

	const settingIcons = {
		size: 'open_in_full',
		color: 'palette',
		strokeWidth: 'line_weight',
		strokeColor: 'format_color_fill',
		label: 'label'
	};

	const settingTypes = {
		size: 'number',
		color: 'color',
		strokeWidth: 'number',
		strokeColor: 'color',
		label: 'label'
	};
</script>

<div class="settingDisplay" style="background-color: {settingTypes[setting.name] === 'color' ? colord(setting.value[0][0]).toRgbString() : 'white' };">
	<span class="material-symbols-outlined">{settingIcons[setting.name]}</span>
	{#if settingTypes[setting.name] === 'number'}
		<div>{setting.value}</div>
	{/if}
	{#if settingTypes[setting.name] === 'label'}
		<div>{setting.value}</div>
	{/if}
</div>


<style>
.settingDisplay {
	font-size: x-small;
	height: 30px;
    width: 50px;

	border-radius: 10px;
	padding: 2px;
	margin: 0px 2px;
    background-color: #f0f0f0;

	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
