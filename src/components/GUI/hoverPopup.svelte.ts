export function hoverPopup(
	node: HTMLElement,
	options: {
		text: string;
		delay?: number;
		position?: 'top' | 'bottom' | 'left' | 'right';
		onShow?: (text: string) => void;
		onHide?: () => void;
	}
) {
	let timer: number;
	let popup: HTMLElement | null = null;

	function showPopup() {
		if (popup) return;

		popup = document.createElement('div');
		popup.className = `hover-popup hover-popup-${options.position || 'bottom'}`;
		popup.textContent = options.text;

		const rect = node.getBoundingClientRect();
		popup.style.position = 'absolute';
		popup.style.zIndex = '1000';

		// Position the popup based on the specified position
		switch (options.position) {
			case 'top':
				popup.style.left = `${rect.left + rect.width / 2}px`;
				popup.style.bottom = `${window.innerHeight - rect.top}px`;
				break;
			case 'left':
				popup.style.right = `${window.innerWidth - rect.left}px`;
				popup.style.top = `${rect.top + rect.height / 2}px`;
				break;
			case 'right':
				popup.style.left = `${rect.right}px`;
				popup.style.top = `${rect.top + rect.height / 2}px`;
				break;
			case 'bottom':
			default:
				popup.style.left = `${rect.left + rect.width / 2}px`;
				popup.style.top = `${rect.bottom}px`;
				break;
		}

		document.body.appendChild(popup);
		if (options.onShow) {
			options.onShow(options.text);
		}
	}

	function hidePopup() {
		if (popup) {
			document.body.removeChild(popup);
			popup = null;
			if (options.onHide) {
				options.onHide();
			}
		}
	}

	function handleMouseEnter() {
		timer = setTimeout(showPopup, options.delay || 500);
	}

	function handleMouseLeave() {
		clearTimeout(timer);
		hidePopup();
	}

	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseLeave);

	return {
		destroy() {
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseLeave);
			hidePopup();
		},
		update(newOptions: {
			text: string;
			delay?: number;
			position?: 'top' | 'bottom' | 'left' | 'right';
			onShow?: (explanation: string) => void;
			onHide?: () => void;
		}) {
			options = newOptions;
			if (popup) {
				popup.textContent = newOptions.text;
				popup.className = `hover-popup hover-popup-${newOptions.position || 'bottom'}`;
				hidePopup();
				showPopup();
			}
		}
	};
}
