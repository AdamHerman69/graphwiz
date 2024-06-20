import { untrack } from 'svelte';
import { type GraphSettings, exportState, importState } from './graphSettings.svelte';

let undoStack: GraphSettings[] = $state([]);
let stateIndex = $state(-1);

export function saveState() {
	console.log('saveState');
	let state = exportState();
	// If we are not at the end of the undo stack, remove all states after the current state
	undoStack = [...undoStack.slice(0, stateIndex + 1), state];
	stateIndex++;
}

export function undo() {
	if (stateIndex > 0) {
		stateIndex--;
		importState(undoStack[stateIndex], true);
	} else {
		console.log('no more states');
	}
}

export function redo() {
	if (stateIndex < undoStack.length - 1) {
		stateIndex++;
		importState(undoStack[stateIndex], true);
	} else {
		console.log('no more states');
	}
}
