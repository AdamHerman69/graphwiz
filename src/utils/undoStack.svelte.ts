//import { type GraphSettings, exportState, importState } from './graphSettings.svelte';

// let undoStack: GraphSettings[] = $state([]);
// let stateIndex = $state(-1);

// // todo delete
// export function getUndoStack() {
// 	return undoStack;
// }
// export function getStateIndex() {
// 	return stateIndex;
// }

// export function saveState() {
// 	if (shouldSkipSave()) {
// 		//console.log('skipped save');
// 		signalSkipSave(); // this changes again causing saveState again // TODO!!!! not this, it's the import state that changes..
// 	} else {
// 		actuallySaveState();
// 	}
// }

// function actuallySaveState() {
// 	console.log('saveState');
// 	let state = exportState();

// 	// Remove all states after the current state
// 	undoStack = [...undoStack.slice(0, stateIndex + 1), state];
// 	stateIndex++;
// }

// export function undo() {
// 	if (stateIndex > 0) {
// 		stateIndex--;
// 		importState($state.snapshot(undoStack[stateIndex]));
// 		skipSaveCounter = EFFECTS_TO_SKIP;
// 	} else {
// 		console.log('no more states');
// 	}
// }

// export function redo() {
// 	if (stateIndex < undoStack.length - 1) {
// 		stateIndex++;
// 		importState(undoStack[stateIndex]);
// 		skipSaveCounter = EFFECTS_TO_SKIP;
// 	} else {
// 		console.log('no more states');
// 	}
// }

// export function canUndo() {
// 	return stateIndex > 0;
// }

// export function canRedo() {
// 	return stateIndex < undoStack.length - 1;
// }

// hack to skip saveState when the change is caused by udoing.
// SkipSaveCounter is 2 when the change is caused by undoing
// - two reactive statements can cause state TODO change to three with layout

// const EFFECTS_TO_SKIP = 3;

// let skipSaveCounter = $state(0);
// export function shouldSkipSave(): boolean {
// 	if (skipSaveCounter > 0) return true;
// 	else return false;
// }
// export function signalSkipSave() {
// 	skipSaveCounter--;
// }

// export function clearUndoStack() {
// 	undoStack = [];
// 	stateIndex = -1;
// }
