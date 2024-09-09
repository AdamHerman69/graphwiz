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

// Update NodeShape type to include 'triangle'
export type NodeShape = 'circle' | 'square' | 'triangle';

export interface IPNode {
	position: paper.Point;
	getFinalRadius(): number;
	updatePosition(newX: number, newY: number): void;
	updateStyle(style: NodeStyle): void;
	getConnectionPoint(direction: paper.Point): paper.Point;
}

export class PNode implements IPNode {
	position: paper.Point;
	shape: paper.Shape.Circle | paper.Shape.Rectangle | paper.Path;
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
	): paper.Shape.Circle | paper.Shape.Rectangle | paper.Path {
		switch (shape) {
			case 'circle':
				return new Paper.Shape.Circle(new Paper.Point(x, y), size);
			case 'square':
				return new Paper.Shape.Rectangle({
					point: new Paper.Point(x - size, y - size),
					size: new Paper.Size(size * 2, size * 2)
				});
			case 'triangle':
				const height = size * Math.sqrt(3);
				const path = new Paper.Path({
					segments: [
						[x, y - height / 2],
						[x - size, y + height / 2],
						[x + size, y + height / 2]
					],
					closed: true
				});
				path.position = new Paper.Point(x, y);
				return path;
		}
	}

	private lineIntersection(
		p1: paper.Point,
		p2: paper.Point,
		p3: paper.Point,
		p4: paper.Point
	): paper.Point | null {
		const dx1 = p2.x - p1.x;
		const dy1 = p2.y - p1.y;
		const dx2 = p4.x - p3.x;
		const dy2 = p4.y - p3.y;

		const denominator = dy2 * dx1 - dx2 * dy1;

		if (denominator === 0) {
			return null; // Lines are parallel
		}

		const ua = (dx2 * (p1.y - p3.y) - dy2 * (p1.x - p3.x)) / denominator;
		return new Paper.Point(p1.x + ua * dx1, p1.y + ua * dy1);
	}

	private nearestPointOnLine(
		lineStart: paper.Point,
		lineEnd: paper.Point,
		direction: paper.Point
	): paper.Point {
		const lineVector = lineEnd.subtract(lineStart);
		const t = direction.dot(lineVector) / lineVector.dot(lineVector);
		return lineStart.add(lineVector.multiply(Math.max(0, Math.min(1, t))));
	}

	getConnectionPoint(direction: paper.Point): paper.Point {
		const normalizedDirection = direction.normalize();
		const strokeOffset = this.style.strokeWidth / 2;

		switch (this.style.shape) {
			case 'circle':
				return this.position.add(normalizedDirection.multiply(this.getFinalRadius()));

			case 'square':
				const halfSize = this.style.size + strokeOffset;
				const dx = Math.abs(normalizedDirection.x);
				const dy = Math.abs(normalizedDirection.y);

				if (dx > dy) {
					return this.position.add(
						new Paper.Point(
							Math.sign(normalizedDirection.x) * halfSize,
							normalizedDirection.y * (halfSize / dx)
						)
					);
				} else {
					return this.position.add(
						new Paper.Point(
							normalizedDirection.x * (halfSize / dy),
							Math.sign(normalizedDirection.y) * halfSize
						)
					);
				}

			case 'triangle':
				const size = this.getFinalRadius();
				const height = size * Math.sqrt(3);

				// Calculate the three corners of the triangle
				const top = new Paper.Point(0, (-2 * height) / 3);
				const bottomLeft = new Paper.Point(-size, height / 3);
				const bottomRight = new Paper.Point(size, height / 3);

				// Rotate the direction vector to match the triangle's orientation
				const rotatedDirection = normalizedDirection.rotate(-this.shape.rotation);

				// Calculate intersection with each edge
				const intersections = [
					this.lineIntersection(new Paper.Point(0, 0), rotatedDirection, bottomLeft, bottomRight),
					this.lineIntersection(new Paper.Point(0, 0), rotatedDirection, top, bottomLeft),
					this.lineIntersection(new Paper.Point(0, 0), rotatedDirection, top, bottomRight)
				].filter(Boolean) as paper.Point[];

				// Find the intersection point in the correct direction and closest to the origin
				const intersectionPoint = intersections.reduce(
					(closest, current) => {
						return current.dot(rotatedDirection) > 0 &&
							(!closest || current.length < closest.length)
							? current
							: closest;
					},
					null as Paper.Point | null
				);

				if (intersectionPoint) {
					// Rotate back and adjust for the node's position
					return this.position.add(intersectionPoint.rotate(this.shape.rotation));
				}

				return this.position;
		}
	}

	getFinalRadius(): number {
		return this.style.size + this.style.strokeWidth / 2;
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
	): typeof Paper.Shape.Circle | typeof Paper.Shape.Rectangle | typeof Paper.Path {
		switch (shape) {
			case 'circle':
				return Paper.Shape.Circle;
			case 'square':
				return Paper.Shape.Rectangle;
			case 'triangle':
				return Paper.Path;
		}
	}

	private updateShapeSize(size: number) {
		if (this.shape instanceof Paper.Shape.Circle) {
			this.shape.radius = size;
		} else if (this.shape instanceof Paper.Shape.Rectangle) {
			this.shape.bounds.size = new Paper.Size(size * 2, size * 2);
			this.shape.position = this.position;
		} else if (this.shape instanceof Paper.Path) {
			const height = size * Math.sqrt(3);
			this.shape.segments = [
				new Paper.Segment(new Paper.Point(0, -height / 2)),
				new Paper.Segment(new Paper.Point(-size, height / 2)),
				new Paper.Segment(new Paper.Point(size, height / 2))
			];
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
				const pointText = new Paper.PointText({
					content: label.text,
					fontSize: label.size,
					fillColor: colord(label.color).toRgbString()
				});
				this.labels.push({
					pointText: pointText,
					verticalOffset: verticalOffset,
					offset: labelOffsets[label.position]
				});
				// Ensure the new label is on top
				pointText.bringToFront();
			} else {
				this.labels[index].pointText.content = label.text;
				this.labels[index].pointText.fontSize = label.size;
				this.labels[index].pointText.fillColor = new Paper.Color(colord(label.color).toRgbString());
				this.labels[index].offset = labelOffsets[label.position];
				this.labels[index].verticalOffset = verticalOffset;
				// Ensure existing label is on top
				this.labels[index].pointText.bringToFront();
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
			// Ensure label is always on top after repositioning
			labelObject.pointText.bringToFront();
		});
	}
}
