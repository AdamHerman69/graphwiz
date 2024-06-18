import Paper from 'paper';
import type { NodeLabel, NodeStyle } from '../utils/graphSettings.svelte';
import { toStringGradient } from './Color';
import { colord } from 'colord';

const labelOffsets = {
	above: new Paper.Point(0, -4),
	below: new Paper.Point(0, 4),
	left: new Paper.Point(-4, 0),
	right: new Paper.Point(4, 0),
	center: new Paper.Point(0, 0)
};

export interface IPNode {
	position: paper.Point;
	getFinalRadius(): number;
	updatePosition(newX: number, newY: number): void;
	updateStyle(style: NodeStyle): void;
}

export class PNode implements IPNode {
	position: paper.Point;
	shape: paper.Shape;
	style: NodeStyle;
	labels: { pointText: paper.PointText; offset: paper.Point; verticalOffset: paper.Point }[];

	constructor(label: string, x: number, y: number, style: NodeStyle) {
		this.style = style;
		this.position = new Paper.Point(x, y);
		this.shape = new Paper.Shape.Circle(this.position, style.size);
		this.labels = [];

		// this.label = new Paper.PointText({
		// 	point: this.position,
		// 	content: label,
		// 	fontSize: 5
		// });
		// this.label.position = this.label.position.add(
		// 	new Paper.Point(-this.label.bounds.width / 2, this.label.bounds.height / 4)
		// );

		// todo updateLabels

		this.updateStyle(style);
		this.updateLabels2(style.labels);
	}

	getFinalRadius(): number {
		return (this.shape.radius as number) + this.shape.strokeWidth / 2;
	}

	updatePosition(newX: number, newY: number) {
		this.position.x = newX;
		this.position.y = newY;
		this.shape.position = this.position;
		this.updateLabelPositions2();
		// this.label.point = this.position.add(
		// 	new Paper.Point(-this.label.bounds.width / 2, this.label.bounds.height / 4)
		// );
	}

	updateLabelPosition() {
		for (const [key, label] of Object.entries(this.labels)) {
			if (label.pointText) {
				let offsetScaledToSize = label.offset.add(
					label.offset.normalize().multiply(this.getFinalRadius())
				);
				label.pointText.position = this.position.add(offsetScaledToSize);
			}
		}
	}

	// todo support different shapes and stuff
	updateStyle(style: NodeStyle) {
		// move labels on size change
		// if (this.style.size != style.size || this.style.strokeWidth != style.strokeWidth)
		// 	this.updateLabelPosition();

		this.style = style;

		// handle color
		let color: paper.Color;
		let stringGradient = toStringGradient(style.color);
		if (stringGradient.length === 1) color = new Paper.Color(stringGradient[0][0]);
		else {
			// gradient
			color = new Paper.Color({
				gradient: {
					stops: toStringGradient(style.color),
					radial: true
				},
				origin: this.position,
				destination: this.shape.bounds.rightCenter
			});
		}

		// apply style
		let strokeColorGradient = toStringGradient(style.strokeColor);
		this.shape.style = {
			fillColor: color,
			strokeColor: new Paper.Color(strokeColorGradient[0][0]),
			strokeWidth: style.strokeWidth
		};

		// apply shadow
		if (style.shadow) {
			this.shape.style.shadowColor = new Paper.Color(0, 0, 0, 0.7);
			this.shape.style.shadowBlur = 7;
		} else {
			this.shape.style.shadowColor = null;
			this.shape.style.shadowBlur = 0;
		}

		this.shape.radius = style.size;

		// todo optimize, when changing?
		this.updateLabels2(style.labels);
	}

	// updateLabels(nodeLabels: NodeLabel[]) {
	// 	let _labels: {
	// 		above: NodeLabel[];
	// 		below: NodeLabel[];
	// 		left: NodeLabel[];
	// 		right: NodeLabel[];
	// 		center: NodeLabel[];
	// 	} = { above: [], below: [], left: [], right: [], center: [] };
	// 	if (!nodeLabels) return;
	// 	nodeLabels.forEach((nodeLabel) => {
	// 		_labels[nodeLabel.position].push(nodeLabel);
	// 	});

	// 	for (const [key, nodeLabels] of Object.entries(_labels)) {
	// 		if (nodeLabels.length === 0) {
	// 			this.labels[key].pointText?.remove();
	// 		} else {
	// 			let text = '';
	// 			nodeLabels.forEach((nodeLabel, index) => {
	// 				text = text + nodeLabel.text;
	// 				if (index < nodeLabels.length - 1) text = text + '\n';
	// 			});

	// 			if (!Object.hasOwn(this.labels[key], 'pointText')) {
	// 				// position map or something
	// 				this.labels[key].pointText = new Paper.PointText({
	// 					content: text,
	// 					fontSize: nodeLabels[0].size,
	// 					fillColor: nodeLabels[0].color
	// 				});
	// 				console.log('creted label: ', this.labels[key]);
	// 			}
	// 			this.labels[key].pointText.content = text;
	// 		}
	// 	}
	// }

	calculateVerticalOffset(total: number, rank: number, position: string) {
		if (total === 1) return 0;
		const labelVertSpace = 3;
		let totalVertSpace = total * labelVertSpace;
		switch (position) {
			case 'above':
				return totalVertSpace - rank * labelVertSpace;
			case 'below':
				return -rank * labelVertSpace;
			default: // left, right, center
				return totalVertSpace / 2 - rank * labelVertSpace;
		}
	}

	updateLabels2(nodeLabels: NodeLabel[]) {
		if (!nodeLabels) return;
		let labelPositions = {
			above: { total: nodeLabels.filter((label) => label.position === 'above').length, rank: 0 },
			below: { total: nodeLabels.filter((label) => label.position === 'below').length, rank: 0 },
			left: { total: nodeLabels.filter((label) => label.position === 'left').length, rank: 0 },
			right: { total: nodeLabels.filter((label) => label.position === 'right').length, rank: 0 },
			center: { total: nodeLabels.filter((label) => label.position === 'center').length, rank: 0 }
		};

		// update labels
		nodeLabels.forEach((label, index) => {
			let verticalOffset = new Paper.Point(
				0,
				this.calculateVerticalOffset(
					labelPositions[label.position].total,
					labelPositions[label.position].rank,
					label.position
				)
			);

			if (index >= this.labels.length) {
				this.labels.push({
					pointText: new Paper.PointText({
						content: label.text,
						fontSize: label.size,
						fillColor: colord(label.color).toRgbString()
					}),
					verticalOffset: verticalOffset,
					offset: labelOffsets[label.position]
				});
			} else {
				this.labels[index].pointText.content = label.text;
				this.labels[index].pointText.fontSize = label.size;
				this.labels[index].pointText.fillColor = new Paper.Color(colord(label.color).toRgbString());
				this.labels[index].offset = labelOffsets[label.position];
				this.labels[index].verticalOffset = verticalOffset;
			}

			labelPositions[label.position].rank++;
		});

		// delete extra labels
		let deletedLabels = this.labels.splice(nodeLabels.length);
		deletedLabels.forEach((label) => label.pointText.remove());

		this.updateLabelPositions2();
	}

	updateLabelPositions2() {
		this.labels.forEach((labelObject) => {
			let offsetScaledToSize = labelObject.offset.add(
				labelObject.offset.normalize().multiply(this.getFinalRadius())
			);
			let finalOffset = offsetScaledToSize.add(labelObject.verticalOffset);
			labelObject.pointText.position = this.position.add(finalOffset);
		});
	}
}
