import Paper from 'paper';
import type { IPNode } from './Node';
import type {
	DecoratorData,
	EdgeStyle,
	EdgeType,
	EdgeLabel,
	Gradient,
	EdgeLayoutType
} from '../utils/graphSettings.svelte';
import {
	type Decorator,
	createIsoscelesTriangle,
	getIsoscelesTrianglePoints,
	createIsoscelesTriangleEdge,
	getIsoscelesTrianglePointsEdge,
	TriangleDecorator,
	CircleDecorator,
	SquareDecorator
} from './Triangle';
import { toStringGradient } from './Color';
import { colord } from 'colord';

interface EdgeShape {
	updatePosition(
		source: paper.Point,
		target: paper.Point,
		bendPoints?: paper.Point[],
		delta?: { x: number; y: number }
	): void;
	updateStyle(style: paper.Style): void;
	delete(): void;
}

class OrthogonalShape implements EdgeShape {
	line: paper.Path;

	constructor(source: paper.Point, target: paper.Point, bendPoints: paper.Point[]) {
		this.line = new Paper.Path();
		bendPoints.forEach((point) => this.line.add(point));
	}

	updatePosition(source: paper.Point, target: paper.Point, bendPoints: paper.Point[]): void {
		if (!bendPoints) return;

		console.log('bendPoints happening');

		this.line.removeSegments();
		bendPoints.forEach((point) => this.line.add(point));

		//update gradient todo?
		if (this.line.strokeColor?.gradient) {
			this.line.strokeColor.origin = source;
			this.line.strokeColor.destination = target;
		}
	}

	updateStyle(style: paper.Style) {
		this.line.style = style;
	}

	delete(): void {
		this.line.remove();
	}
}

class LineShape implements EdgeShape {
	line: paper.Path;

	constructor(source: paper.Point, target: paper.Point) {
		this.line = new Paper.Path.Line(source, target);
	}

	updatePosition(source: paper.Point, target: paper.Point): void {
		this.line.firstSegment.point = source;
		this.line.lastSegment.point = target;

		//update gradient
		if (this.line.strokeColor?.gradient) {
			this.line.strokeColor.origin = source;
			this.line.strokeColor.destination = target;
		}
	}

	updateStyle(style: paper.Style) {
		this.line.style = style;
	}

	delete(): void {
		this.line.remove();
	}
}

class TriangleShape implements EdgeShape {
	triangle: paper.Path;
	width: number;

	constructor(source: paper.Point, target: paper.Point) {
		this.width = 3; // todo compute from nodeSize, store in global stores
		this.triangle = createIsoscelesTriangleEdge(target, source, this.width);
	}

	updatePosition(source: paper.Point, target: paper.Point): void {
		[
			this.triangle.segments[0].point,
			this.triangle.segments[1].point,
			this.triangle.segments[2].point
		] = getIsoscelesTrianglePointsEdge(target, source, this.width);

		//update gradient
		if (this.triangle.fillColor?.gradient) {
			this.triangle.fillColor.origin = source;
			this.triangle.fillColor.destination = target;
		}
	}

	updateStyle(style: paper.Style) {
		this.triangle.style.fillColor = style.strokeColor;
	}

	delete(): void {
		this.triangle.remove();
	}
}

class Label {
	pointText: paper.PointText;
	datum: EdgeLabel;

	constructor(labelDatum: EdgeLabel) {
		this.datum = labelDatum;
		this.pointText = new Paper.PointText({
			content: labelDatum.text,
			fontSize: labelDatum.size,
			fillColor: new Paper.Color(colord(labelDatum.color).toRgbString())
		});
	}

	updateStyle(labelDatum: EdgeLabel) {
		this.pointText.content = labelDatum.text;
		this.pointText.fontSize = labelDatum.size;
		if (this.datum.color != labelDatum.color) {
			this.pointText.fillColor = new Paper.Color(colord(labelDatum.color).toRgbString());
		}

		this.datum = labelDatum;
	}

	updatePosition(source: paper.Point, target: paper.Point) {
		this.pointText.position = getRelativeEdgePoint(source, target, this.datum.relativePosition);

		// Calculate the vector from this.source.position to this.target.position
		let vector = target.subtract(source);

		// Rotate this vector by 90 degrees to get a vector that is perpendicular to the line
		let perpendicularVector = vector.rotate(90);

		// Normalize this vector and multiply it by 3 to get a vector that is perpendicular to the line and has a length of 3
		let offsetVector = perpendicularVector.normalize().multiply(3);

		if (this.datum.position === 'above')
			this.pointText.position = this.pointText.position.add(offsetVector);
		if (this.datum.position === 'below')
			this.pointText.position = this.pointText.position.subtract(offsetVector);

		// rotation
		if (this.datum.rotate) {
			// Calculate the angle between this.source.position and this.target.position
			let angle = source.subtract(target).angle;

			// Rotate the pointText object to this angle
			this.pointText.rotation = angle;
		} else {
			this.pointText.rotation = 0;
		}
	}

	delete() {
		this.pointText.remove();
	}
}

export interface IPEdge {
	source: IPNode;
	target: IPNode;
	lineShape: EdgeShape;

	updatePosition(): void;
	updateStyle(style: EdgeStyle, edgeLayout: EdgeLayoutType): void;
}

export class PEdge {
	source: IPNode;
	target: IPNode;
	sourceConnectionPoint: paper.Point;
	targetConnectionPoint: paper.Point;
	decorators: [Decorator, number][]; // number is a relative position on edge 0 - start, 1 - end
	lineShape: EdgeShape;
	partialStart: number;
	partialEnd: number;
	type: 'segmented' | 'straight' | 'conical' | 'none';
	labels: Label[];
	constructor(source: IPNode, target: IPNode, style: EdgeStyle, edgeLayout: EdgeLayoutType) {
		this.source = source;
		this.target = target;
		this.partialStart = style.partialStart;
		this.partialEnd = style.partialEnd;
		// line
		// vvvvv doesn't work but doesn't really matter
		[this.sourceConnectionPoint, this.targetConnectionPoint] = this.getConnectionPoints();

		this.type = 'none';
		// switch (style.type) {
		// 	case 'conical':
		// 		this.lineShape = new TriangleShape(this.sourceConnectionPoint, this.targetConnectionPoint);
		// 		break;
		// 	case 'straight':
		// 		this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
		// 		break;
		// 	case 'orthogonal':
		// 	case 'bundled':
		// 		if (!style.bendPoints) {
		// 			console.log('no bend points yet');
		// 			this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
		// 		}
		// 		this.lineShape = new OrthogonalShape(
		// 			this.sourceConnectionPoint,
		// 			this.targetConnectionPoint,
		// 			style.bendPoints.map((point) => new Paper.Point(point.x, point.y))
		// 		);
		// 		break;
		// 	default:
		// 		throw new Error('Invalid edge type');
		// }

		this.decorators = [];
		this.labels = [];

		this.updateStyle(style, edgeLayout);
	}

	addRemoveDecorators(decoratorData: DecoratorData[]) {
		// remove missing
		function isPresent(decTuple: [Decorator, number]): boolean {
			return decoratorData.some((decoratorDatum) => {
				decoratorDatum.type === decTuple[0].type && decoratorDatum.position === decTuple[1];
			});
		}

		const filtered = this.decorators.reduce(
			(filtered: { present: [Decorator, number][]; deleted: [Decorator, number][] }, decTuple) => {
				filtered[isPresent(decTuple) ? 'present' : 'deleted'].push(decTuple);
				return filtered;
			},
			{ present: [], deleted: [] }
		);

		filtered.deleted.forEach((decTuple) => decTuple[0].delete());
		this.decorators = filtered.present;

		// add new
		let isNew: boolean;
		decoratorData.forEach((decoratorDatum) => {
			isNew = !this.decorators.some((decorator) => {
				return (
					decorator[0].type === decoratorDatum.type && decorator[1] === decoratorDatum.position
				);
			});
			if (isNew) {
				if (decoratorDatum.type === 'triangle') {
					this.decorators.push([new TriangleDecorator(3, 3), decoratorDatum.position]);
				} else if (decoratorDatum.type === 'circle') {
					this.decorators.push([new CircleDecorator(1.5), decoratorDatum.position]);
				} else if (decoratorDatum.type === 'square') {
					this.decorators.push([new SquareDecorator(3), decoratorDatum.position]);
				}
			}
		});
	}

	updateLabels(labels: EdgeLabel[]) {
		if (!labels) return;

		labels.forEach((labelDatum, index) => {
			if (this.labels[index]) {
				// update existing labels
				this.labels[index].updateStyle(labelDatum);
				this.labels[index].updatePosition(this.source.position, this.target.position);
			} else {
				// create new labels
				this.labels.push(new Label(labelDatum));
			}
		});

		// delete extra labels
		if (this.labels.length > labels.length) {
			const extraLabels = this.labels.splice(labels.length);
			extraLabels.forEach((label) => {
				label.delete();
			});
		}
	}

	updateLabelPositions() {
		this.labels.forEach((label) => {
			label.updatePosition(this.source.position, this.target.position);
		});
	}

	getConnectionPoints() {
		// when starting the simulation all points are at the same position, rest wouldn't work
		if (this.source.position.equals(this.target.position))
			return [this.source.position, this.target.position];

		const direction = this.target.position.subtract(this.source.position);
		let sourceConnectionPoint = this.source.getConnectionPoint(direction);
		let targetConnectionPoint = this.target.getConnectionPoint(direction.multiply(-1));

		// partial edge
		const sourcePartial = getRelativeEdgePoint(
			sourceConnectionPoint,
			targetConnectionPoint,
			this.partialStart
		);
		const targetPartial = getRelativeEdgePoint(
			sourceConnectionPoint,
			targetConnectionPoint,
			this.partialEnd
		);

		return [sourcePartial, targetPartial];
	}

	updatePosition() {
		// orthogonal is static
		if (this.type === 'orthogonal' || this.type === 'bundled') return;

		[this.sourceConnectionPoint, this.targetConnectionPoint] = this.getConnectionPoints();
		this.lineShape.updatePosition(this.sourceConnectionPoint, this.targetConnectionPoint);

		this.updateDecorators();
		this.updateLabelPositions();
	}

	updateDecorators(decoratorData?: DecoratorData[], edgeColor?: Gradient) {
		this.decorators?.forEach((decTuple, index) => {
			decTuple[0].update(
				getRelativeEdgePoint(this.sourceConnectionPoint, this.targetConnectionPoint, decTuple[1]),
				this.getDirection()
			);

			if (decoratorData && edgeColor) {
				decTuple[0].updateStyle(decoratorData[index], edgeColor);
			}
		});
	}

	updateStyle(style: EdgeStyle, edgeLayout: EdgeLayoutType) {
		let type: 'segmented' | 'straight' | 'conical' = style.type;
		// edge layout change
		if (edgeLayout === 'orthogonal' || edgeLayout === 'bundled') {
			type = 'segmented';
		}

		// edge type change
		if (type != this.type) {
			this.type = type;
			if (this.lineShape) this.lineShape.delete();

			switch (type) {
				case 'conical':
					this.lineShape = new TriangleShape(
						this.sourceConnectionPoint,
						this.targetConnectionPoint
					);
					break;
				case 'straight':
					this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
					break;
				case 'segmented':
					if (!style.bendPoints || style.bendPoints.length === 0) {
						console.log('no bend points yet');

						this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
						break;
					}
					this.lineShape = new OrthogonalShape(
						this.sourceConnectionPoint,
						this.targetConnectionPoint,
						style.bendPoints.map((point) => new Paper.Point(point.x, point.y))
					);
					break;
				default:
					throw new Error('Invalid edge type');
			}
		}

		let color: paper.Color;
		let stringGradient = toStringGradient(style.color);
		if (stringGradient.length === 1) color = new Paper.Color(stringGradient[0][0]);
		else {
			// gradient
			color = new Paper.Color({
				gradient: {
					stops: toStringGradient(style.color)
				},
				origin: this.sourceConnectionPoint,
				destination: this.targetConnectionPoint
			});
		}

		// decorators
		this.addRemoveDecorators(style.decorators);
		this.updateDecorators(style.decorators, style.color);
		//this.addRemoveLabels(style.labels);
		this.updateLabels(style.labels);

		// style update
		const paperStyle = {
			strokeWidth: style.width,
			strokeColor: color
		};
		this.lineShape.updateStyle(paperStyle);

		// partial edge change
		if (this.partialStart != style.partialStart || this.partialEnd != style.partialEnd) {
			this.partialStart = style.partialStart;
			this.partialEnd = style.partialEnd;

			this.updatePosition();
		}
	}

	getDirection() {
		return this.target.position.subtract(this.source.position);
	}
}

function getRelativeEdgePoint(start: paper.Point, end: paper.Point, relativePosition: number) {
	return start.multiply(1 - relativePosition).add(end.multiply(relativePosition));
}
