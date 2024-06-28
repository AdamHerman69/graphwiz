// A debounce function that takes a function and a delay as parameters
export function debounce<T>(func: (...args: any[]) => any, delay: number) {
	// A timer variable to track the delay period
	let timer: number;
	// Return a function that takes arguments
	return function (this: ThisParameterType<T>, ...args: any[]) {
		// Clear the previous timer if any
		clearTimeout(timer);
		// Set a new timer that will execute the function after the delay period
		timer = setTimeout(() => {
			// Apply the function with arguments
			func.apply(this, args);
		}, delay);
	};
}

// A throttle function that takes a function and an interval as parameters
export function throttle<T>(func: (...args: any[]) => any, interval: number) {
	// A flag variable to track whether the function is running or not
	let isRunning = false;
	// Return a function that takes arguments
	return function (this: ThisParameterType<T>, ...args: []) {
		// If the function is not running
		if (!isRunning) {
			// Set the flag to true
			isRunning = true;
			// Apply the function with arguments
			func.apply(this, args);
			// Set a timer that will reset the flag after the interval
			setTimeout(() => {
				// Set the flag to false
				isRunning = false;
			}, interval);
		}
	};
}
