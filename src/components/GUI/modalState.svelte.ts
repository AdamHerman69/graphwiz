export type ModalProps = {
	text: string;
	values?: string[];
};

let modalContent = $state<ModalProps | null>(null);
let modalResolver: ((value: string) => void) | null = $state(null);

export function openModal(modalProps: ModalProps): Promise<string> {
	return new Promise((resolve) => {
		modalContent = modalProps;
		modalResolver = resolve;
	});
}

export function getModalContent() {
	return modalContent;
}

export function closeModal(value?: string) {
	if (value && modalResolver) {
		modalResolver(value);
	}
	modalContent = null;
	modalResolver = null;
}
