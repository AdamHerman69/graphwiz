import Paper from 'paper';
import { Color } from 'paper/dist/paper-core';
import type { DecoratorData, DecoratorType, Gradient } from '../utils/graphSettings.svelte';
import { colord } from 'colord';
import { getGradientColorAsString } from '../utils/gradient';

export function createIsoscelesTriangleEdge(
	topPoint: paper.Point,
	baseCenter: paper.Point,
	baseLength: number
) {
	const direction = topPoint.subtract(baseCenter);
	const a = baseCenter.add(new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2));
	const c = baseCenter.subtract(
		new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2)
	);
	const triangle = new Paper.Path([a, topPoint, c]);
	triangle.closed = true;
	return triangle;
}

export function getIsoscelesTrianglePointsEdge(
	topPoint: paper.Point,
	baseCenter: paper.Point,
	baseLength: number
) {
	const direction = topPoint.subtract(baseCenter);
	const a = baseCenter.add(new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2));
	const c = baseCenter.subtract(
		new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2)
	);

	return [a, topPoint, c];
}

export function createIsoscelesTriangle(
	topPoint: paper.Point,
	baseLength: number,
	height: number,
	direction: paper.Point
): paper.Path {
	const baseCenter = topPoint.subtract(direction.normalize(height));
	const a = baseCenter.add(new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2));
	const c = baseCenter.subtract(
		new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2)
	);

	const triangle = new Paper.Path([a, topPoint, c]);
	triangle.closed = true;
	return triangle;
}

export function getIsoscelesTrianglePoints(
	topPoint: paper.Point,
	baseLength: number,
	height: number,
	direction: paper.Point
) {
	const baseCenter = topPoint.subtract(direction.normalize(height));
	const a = baseCenter.add(new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2));
	const c = baseCenter.subtract(
		new Paper.Point(-direction.y, direction.x).normalize(baseLength / 2)
	);
	return [a, topPoint, c];
}

export interface Decorator {
	update(newPosition: paper.Point, direction: paper.Point): void;
	updateStyle(decoratorData: DecoratorData, edgeColor: Gradient): void;
	delete(): void;
	type: DecoratorType;
}

export class TriangleDecorator implements Decorator {
	type: DecoratorType;
	triangle: paper.Path;
	width: number;
	length: number;

	constructor(length: number, width: number) {
		this.triangle = createIsoscelesTriangle(
			new Paper.Point(1, 1),
			width,
			length,
			new Paper.Point(2, 2)
		); // init at random place

		this.triangle.fillColor = new Paper.Color('white');
		this.width = width;
		this.length = length;
		this.type = 'triangle';
	}

	update(newPosition: paper.Point, direction: paper.Point): void {
		[
			this.triangle.segments[0].point,
			this.triangle.segments[1].point,
			this.triangle.segments[2].point
		] = getIsoscelesTrianglePoints(newPosition, this.width, this.length, direction);
	}

	updateStyle(decoratorData: DecoratorData, edgeColor: Gradient): void {
		let color: paper.Color;
		if (decoratorData.color) {
			color = new Paper.Color(colord(decoratorData.color).toRgbString());
		} else {
			color = new Paper.Color(getGradientColorAsString(edgeColor, decoratorData.position));
		}

		this.triangle.fillColor = color;
	}

	delete() {
		this.triangle.remove();
	}
}

export class CircleDecorator implements Decorator {
	type: DecoratorType;
	circle: paper.Path.Circle;
	radius: number;

	constructor(radius: number) {
		this.circle = new Paper.Path.Circle({
			center: new Paper.Point(1, 1),
			radius: radius,
			fillColor: new Paper.Color('white')
		});
		this.radius = radius;
		this.type = 'circle';
	}

	update(newPosition: paper.Point, direction: paper.Point): void {
		this.circle.position = newPosition;
	}

	updateStyle(decoratorData: DecoratorData, edgeColor: Gradient): void {
		let color: paper.Color;
		if (decoratorData.color) {
			color = new Paper.Color(colord(decoratorData.color).toRgbString());
		} else {
			color = new Paper.Color(getGradientColorAsString(edgeColor, decoratorData.position));
		}

		this.circle.fillColor = color;
	}

	delete() {
		this.circle.remove();
	}
}

export class SquareDecorator implements Decorator {
	type: DecoratorType;
	square: paper.Path.Rectangle;
	size: number;

	constructor(size: number) {
		this.square = new Paper.Path.Rectangle({
			point: new Paper.Point(1, 1),
			size: new Paper.Size(size, size),
			fillColor: new Paper.Color('white')
		});
		this.size = size;
		this.type = 'square';
	}

	update(newPosition: paper.Point, direction: paper.Point): void {
		this.square.position = newPosition;
	}

	updateStyle(decoratorData: DecoratorData, edgeColor: Gradient): void {
		let color: paper.Color;
		if (decoratorData.color) {
			color = new Paper.Color(colord(decoratorData.color).toRgbString());
		} else {
			color = new Paper.Color(getGradientColorAsString(edgeColor, decoratorData.position));
		}

		this.square.fillColor = color;
	}

	delete() {
		this.square.remove();
	}
}
