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
	import type { Conflict, Guideline } from '../utils/guideline.svelte';
	import { getContext } from 'svelte';
	import RuleDisplay from './RuleDisplay.svelte';
	import autoAnimate from '@formkit/auto-animate';
	import type { EdgeLabel, NodeLabel } from '../utils/graphSettings.svelte';
	import { onMount } from 'svelte';
	import { formatDecimal } from '../utils/helperFunctions';

	let {
		setting,
		rule = null,
		collapsed = $bindable(true),
		conflict = undefined
	}: {
		setting:
			| SelectSetting<any>
			| NumericalSetting
			| ColorSetting
			| DecoratorSetting
			| Array<EdgeLabel | NodeLabel>;
		rule: Rule | null;
		collapsed: boolean;
		conflict?: Conflict;
	} = $props();

	if (Array.isArray(setting))
		setting = {
			name: 'labels',
			value: setting
				.reduce((labelsList, label) => {
					return labelsList + (label.attribute?.name ? label.attribute.name + ' ' : '');
				}, '')
				.trim() // Use trim() to remove the trailing space
		};

	let guidelines = getContext('guidelines') as Guideline[];

	// const conflictingGuidelineName = $derived(
	// 	guidelines.find((g) => g.id === conflict?.conflictingGuidelineId)?.name
	// );

	let hovered = $state(false);
	let valueDisplayWidth = $state(0);
	let expandedWidth = $derived(`${valueDisplayWidth + 40}px`);
	let valueString = $derived.by(() => {
		if (settingTypes[setting.name] === 'color') {
			return colord(setting.value[0][0]).toRgbString();
		}
		return setting.value;
	});

	let showRule = $state(false);

	const settingIcons = {
		size: 'open_in_full',
		color: 'palette',
		strokeWidth: 'line_weight',
		strokeColor: 'format_color_fill',
		labels: 'label',
		width: 'line_weight',
		partialStart: 'step_into',
		partialEnd: 'step_out',
		decorators: 'interests',
		shape: 'shapes',
		type: 'style',
		edgeType: 'automation',
		edgeLayout: 'automation',
		layout: 'linked_services'
	};

	const settingTypes = {
		shape: 'string',
		size: 'number',
		color: 'color',
		strokeWidth: 'number',
		strokeColor: 'color',
		labels: 'label',
		width: 'number',
		partialStart: 'number',
		partialEnd: 'number',
		decorators: 'decorators',
		type: 'string',
		edgeType: 'string',
		edgeLayout: 'string',
		layout: 'string'
	};

	let containerRef: HTMLElement;
	let maxExpandedWidth = $state(0);

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				if (entry.target === containerRef.parentElement) {
					updateMaxExpandedWidth();
				}
			}
		});

		resizeObserver.observe(containerRef.parentElement);

		return () => {
			resizeObserver.disconnect();
		};
	});

	function updateMaxExpandedWidth() {
		const containerWidth = containerRef.parentElement.clientWidth;

		if (!collapsed) {
			maxExpandedWidth = Math.min(valueDisplayWidth + 40, containerWidth);
			return;
		}

		// Get all siblings and find the index of the current element
		let allSiblings = Array.from(containerRef.parentElement.children);
		let currentIndex = allSiblings.indexOf(containerRef);

		// Count preceding siblings with class 'settingDisplay'
		let precedingSettingDisplays = allSiblings
			.slice(0, currentIndex)
			.filter((el) => el.classList.contains('settingDisplay'));
		const numPrecedingSettingDisplays = precedingSettingDisplays.length;

		const totalPrecedingSiblingsWidth = numPrecedingSettingDisplays * 38;

		const availableWidth = containerWidth - totalPrecedingSiblingsWidth;
		maxExpandedWidth = Math.min(availableWidth, valueDisplayWidth + 40);
	}

	$effect(() => {
		updateMaxExpandedWidth();
		// console.log('max expanded width: ', maxExpandedWidth);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={containerRef}
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
	style="width: {hovered || !collapsed ? `${maxExpandedWidth}px` : '30px'}; {conflict
		? 'background-color: rgba(250, 10, 10, 0.2);'
		: ''}"
	onmouseenter={() => {
		if (collapsed) hovered = true;
	}}
	onmouseleave={() => {
		if (collapsed) {
			hovered = false;
			containerRef.scrollLeft = 0;
		}
	}}
>
	<div class="iconWrapper">
		<span class="material-symbols-outlined">{settingIcons[setting.name]}</span>
	</div>
	<div class="valueDisplay" bind:clientWidth={valueDisplayWidth}>
		{#if settingTypes[setting.name] === 'number'}
			<div>{formatDecimal(setting.value, 2)}</div>
		{/if}
		{#if settingTypes[setting.name] === 'string'}
			<div>{setting.value}</div>
		{/if}
		{#if settingTypes[setting.name] === 'color'}
			<div class="colorDisplay" style="background-color: {valueString};"></div>
		{/if}
		{#if settingTypes[setting.name] === 'decorators' || settingTypes[setting.name] === 'label'}
			<div>{setting.value.length}</div>
		{/if}

		{#if rule != null}
			<div class="iconWrapper pl-2" use:hoverPopup={{ text: 'show rule', position: 'top' }}>
				<button onclick={() => (showRule = !showRule)} class="flex items-center justify-center">
					<span class="material-symbols-outlined"> flaky </span>
				</button>
			</div>
		{/if}
		{#if conflict}
			<div class="iconWrapper {settingTypes[setting.name] === 'color' ? 'pl-2' : ''}">
				<span class="material-symbols-outlined"> priority_high </span>
			</div>
			<div>{conflict.conflictingGuidelineName}</div>
		{/if}
	</div>
</div>
<div use:autoAnimate>
	{#if rule != null && showRule}
		<RuleDisplay {rule} type="node" />
	{/if}
</div>

<style>
	.settingDisplay {
		font-size: 10px;
		height: 30px;
		transition: width 0.3s ease;
		border-radius: 20px;
		padding: 2px;
		margin: 2px 2px;
		/* background-color: rgba(0, 0, 0, 0.03); */
		box-shadow: inset 0 0 12px 2px rgba(0, 0, 0, 0.05);
		display: flex;
		justify-content: flex-start;
		align-items: center;
		overflow: scroll;
		/* max-width: 100%; */
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

	.settingDisplay.hovered {
	}

	.colorDisplay {
		margin-right: -5px;
		width: 15px;
		height: 15px;
		border-radius: 10px;
	}
</style>
