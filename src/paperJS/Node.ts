import Paper from 'paper';
import type { NodeLabel, NodeStyle, NodeShape } from '../utils/graphSettings.svelte';
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
	shape: paper.Shape.Circle | paper.Shape.Rectangle;
	style: NodeStyle;
	labels: { pointText: paper.PointText; offset: paper.Point; verticalOffset: paper.Point }[];

	constructor(label: string, x: number, y: number, style: NodeStyle) {
		this.style = style;
		this.position = new Paper.Point(x, y);
		this.shape = this.createShape(style.shape, x, y, style.size);
		this.labels = [];

		this.updateStyle(style);
		this.updateLabels2(style.labels);
	}

	private createShape(
		shape: NodeShape,
		x: number,
		y: number,
		size: number
	): paper.Shape.Circle | paper.Shape.Rectangle {
		if (shape === 'circle') {
			return new Paper.Shape.Circle(new Paper.Point(x, y), size);
		} else {
			return new Paper.Shape.Rectangle({
				point: new Paper.Point(x - size, y - size),
				size: new Paper.Size(size * 2, size * 2)
			});
		}
	}

	getFinalRadius(): number {
		if (this.shape instanceof Paper.Shape.Circle) {
			return this.shape.radius + this.shape.strokeWidth / 2;
		} else {
			return this.shape.bounds.width / 2 + this.shape.strokeWidth / 2;
		}
	}

	updatePosition(newX: number, newY: number) {
		this.position.x = newX;
		this.position.y = newY;
		this.shape.position = this.position;
		this.updateLabelPositions2();
	}

	updateStyle(style: NodeStyle) {
		this.style = style;

		// Handle color
		let color: paper.Color;
		let stringGradient = toStringGradient(style.color);
		if (stringGradient.length === 1) {
			color = new Paper.Color(stringGradient[0][0]);
		} else {
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

		// Apply style
		let strokeColorGradient = toStringGradient(style.strokeColor);
		this.shape.style = {
			fillColor: color,
			strokeColor: new Paper.Color(strokeColorGradient[0][0]),
			strokeWidth: style.strokeWidth
		};

		// Apply shadow
		if (style.shadow) {
			this.shape.style.shadowColor = new Paper.Color(0, 0, 0, 0.7);
			this.shape.style.shadowBlur = 7;
		} else {
			this.shape.style.shadowColor = null;
			this.shape.style.shadowBlur = 0;
		}

		// Update shape and size
		if (this.shape.constructor !== this.getShapeConstructor(style.shape)) {
			const newShape = this.createShape(style.shape, this.position.x, this.position.y, style.size);
			newShape.style = this.shape.style;
			this.shape.remove();
			this.shape = newShape;
		} else {
			this.updateShapeSize(style.size);
		}

		this.updateLabels2(style.labels);
	}

	private getShapeConstructor(
		shape: NodeShape
	): typeof Paper.Shape.Circle | typeof Paper.Shape.Rectangle {
		return shape === 'circle' ? Paper.Shape.Circle : Paper.Shape.Rectangle;
	}

	private updateShapeSize(size: number) {
		if (this.shape instanceof Paper.Shape.Circle) {
			this.shape.radius = size;
		} else {
			this.shape.bounds.size = new Paper.Size(size * 2, size * 2);
			this.shape.position = this.position;
		}
	}

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
