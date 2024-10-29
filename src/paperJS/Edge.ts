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
	updatePosition(source: paper.Point, target: paper.Point): void;
	updateStyle(style: paper.Style): void;
	delete(): void;
	getPointOnPath(relativePosition: number): paper.Point;
	getDirectionAtPoint(relativePosition: number): paper.Point;
}

// TODO solve resize on static view

class OrthogonalShape implements EdgeShape {
	line: paper.Path;

	constructor(bendPoints: paper.Point[], source?: paper.Point, target?: paper.Point) {
		this.line = new Paper.Path();
		if (source) this.line.add(source);
		bendPoints.forEach((point) => this.line.add(point));
		if (target) this.line.add(target);
	}

	updatePosition(source: paper.Point, target: paper.Point): void {
		console.log('update position orthogonalaaaaaaaaaaaaaal');
		// Calculate the delta between the first point and the new source
		const deltaX = source.x - this.line.firstSegment.point.x;
		const deltaY = source.y - this.line.firstSegment.point.y;

		// Apply the delta to all points on the line
		this.line.segments.forEach((segment) => {
			segment.point.x += deltaX;
			segment.point.y += deltaY;
		});

		// Ensure the first and last points match the new source and target
		// this.line.firstSegment.point = source;
		// this.line.lastSegment.point = target;

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

	getPointOnPath(relativePosition: number): paper.Point {
		return this.line.getPointAt(this.line.length * relativePosition);
	}

	getDirectionAtPoint(relativePosition: number): paper.Point {
		return this.line.getTangentAt(this.line.length * relativePosition);
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

	getPointOnPath(relativePosition: number): paper.Point {
		return this.line.getPointAt(this.line.length * relativePosition);
	}

	getDirectionAtPoint(relativePosition: number): paper.Point {
		return this.line.getTangentAt(this.line.length * relativePosition);
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

	getPointOnPath(relativePosition: number): paper.Point {
		const source = this.triangle.segments[2].point;
		const target = this.triangle.segments[0].point.add(this.triangle.segments[1].point).divide(2);
		return source.multiply(1 - relativePosition).add(target.multiply(relativePosition));
	}

	getDirectionAtPoint(relativePosition: number): paper.Point {
		const source = this.triangle.segments[2].point;
		const target = this.triangle.segments[0].point.add(this.triangle.segments[1].point).divide(2);
		return target.subtract(source).normalize();
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

	updatePosition(point: paper.Point, direction: paper.Point) {
		this.pointText.position = point;

		// Rotate this vector by 90 degrees to get a vector that is perpendicular to the line
		let perpendicularVector = direction.rotate(90, new Paper.Point(0, 0));

		// Normalize this vector and multiply it by 3 to get a vector that is perpendicular to the line and has a length of 3
		let offsetVector = perpendicularVector.normalize().multiply(3);

		if (this.datum.position === 'above')
			this.pointText.position = this.pointText.position.add(offsetVector);
		if (this.datum.position === 'below')
			this.pointText.position = this.pointText.position.subtract(offsetVector);

		// rotation
		if (this.datum.rotate) {
			// Calculate the angle of the direction vector
			let angle = direction.angle;

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
	id: string;

	updatePosition(bendPoints?: Map<string, { x: number; y: number }[]>): void;
	updateStyle(style: EdgeStyle): void;
	updateLayout(edgeLayout: EdgeLayoutType, bendPoints?: { x: number; y: number }[]): void;
}

export class PEdge {
	id: string;
	source: IPNode;
	target: IPNode;
	sourceConnectionPoint: paper.Point;
	targetConnectionPoint: paper.Point;
	decorators: [Decorator, number][]; // number is a relative position on edge 0 - start, 1 - end
	lineShape: EdgeShape;
	partialStart: number;
	partialEnd: number;
	type: 'bundled' | 'orthogonal' | 'straight' | 'conical' | 'none';
	labels: Label[];
	style: EdgeStyle;
	constructor(
		id: string,
		source: IPNode,
		target: IPNode,
		style: EdgeStyle,
		edgeLayout: EdgeLayoutType
	) {
		this.id = id;
		this.source = source;
		this.target = target;
		this.partialStart = style.partialStart;
		this.partialEnd = style.partialEnd;
		// line
		// vvvvv doesn't work but doesn't really matter
		[this.sourceConnectionPoint, this.targetConnectionPoint] = this.getConnectionPoints();

		this.type = 'none';
		this.decorators = [];
		this.labels = [];

		this.updateStyle(style);
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
				const point = this.lineShape.getPointOnPath(labelDatum.relativePosition);
				const direction = this.lineShape.getDirectionAtPoint(labelDatum.relativePosition);
				this.labels[index].updatePosition(point, direction);
			} else {
				// create new labels
				const newLabel = new Label(labelDatum);
				const point = this.lineShape.getPointOnPath(labelDatum.relativePosition);
				const direction = this.lineShape.getDirectionAtPoint(labelDatum.relativePosition);
				newLabel.updatePosition(point, direction);
				this.labels.push(newLabel);
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
			const point = this.lineShape.getPointOnPath(label.datum.relativePosition);
			const direction = this.lineShape.getDirectionAtPoint(label.datum.relativePosition);
			label.updatePosition(point, direction);
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
		[this.sourceConnectionPoint, this.targetConnectionPoint] = this.getConnectionPoints();

		this.lineShape.updatePosition(this.sourceConnectionPoint, this.targetConnectionPoint);

		this.updateDecorators();
		this.updateLabelPositions();
	}

	updateDecorators(decoratorData?: DecoratorData[], edgeColor?: Gradient) {
		this.decorators?.forEach((decTuple, index) => {
			const point = this.lineShape.getPointOnPath(decTuple[1]);
			const direction = this.lineShape.getDirectionAtPoint(decTuple[1]);
			decTuple[0].update(point, direction);

			if (decoratorData && edgeColor) {
				decTuple[0].updateStyle(decoratorData[index], edgeColor);
			}
		});
	}

	updateLayout(edgeLayout: EdgeLayoutType, bendPoints?: { x: number; y: number }[]) {
		if (edgeLayout === 'straight') {
			this.changeType('straight', [], true);
		} else {
			if (!bendPoints || bendPoints.length === 0) throw new Error('No bendpoints passed');
			this.changeType(edgeLayout, bendPoints, true);
		}
	}

	changeType(
		type: 'bundled' | 'orthogonal' | 'straight' | 'conical',
		bendPoints?: { x: number; y: number }[],
		forced?: boolean
	) {
		if (type === this.type) return;
		if (!forced && type === 'straight' && (this.type === 'bundled' || this.type === 'orthogonal')) {
			//console.log('skiiiiiiped');
			return;
		} // don't do anything on regular edge style update with a segmented edge

		if (this.lineShape) this.lineShape.delete();
		switch (type) {
			case 'conical':
				this.lineShape = new TriangleShape(this.sourceConnectionPoint, this.targetConnectionPoint);
				break;
			case 'straight':
				this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
				break;
			case 'bundled':
			case 'orthogonal':
				if (!bendPoints || bendPoints.length === 0) {
					console.log('no bend points yet');

					this.lineShape = new LineShape(this.sourceConnectionPoint, this.targetConnectionPoint);
					break;
				}
				this.lineShape = new OrthogonalShape(
					bendPoints.map((point) => new Paper.Point(point.x, point.y))
				);
				// else
				// 	this.lineShape = new OrthogonalShape(
				// 		bendPoints.map((point) => new Paper.Point(point.x, point.y)),
				// 		this.sourceConnectionPoint,
				// 		this.targetConnectionPoint
				// 	);

				this.lineShape.updateStyle({
					strokeWidth: this.style.width,
					strokeColor: toPaperColor(
						this.style.color,
						this.sourceConnectionPoint,
						this.targetConnectionPoint
					)
				});
				break;
			default:
				throw new Error('Invalid edge type');
		}
		this.type = type;
	}

	updateStyle(style: EdgeStyle) {
		this.changeType(style.type);

		let color: paper.Color = toPaperColor(
			style.color,
			this.sourceConnectionPoint,
			this.targetConnectionPoint
		);

		// decorators
		this.addRemoveDecorators(style.decorators);
		this.updateDecorators(style.decorators, style.color);
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

		this.style = style;
	}

	getDirection() {
		return this.target.position.subtract(this.source.position);
	}
}

function getRelativeEdgePoint(start: paper.Point, end: paper.Point, relativePosition: number) {
	return start.multiply(1 - relativePosition).add(end.multiply(relativePosition));
}

function toPaperColor(
	colorGradient: Gradient,
	source: paper.Point,
	target: paper.Point
): paper.Color {
	let color: paper.Color;
	let stringGradient = toStringGradient(colorGradient);
	if (stringGradient.length === 1) color = new Paper.Color(stringGradient[0][0]);
	else {
		// gradient
		color = new Paper.Color({
			gradient: {
				stops: toStringGradient(colorGradient)
			},
			origin: source,
			destination: target
		});
	}
	return color;
}
