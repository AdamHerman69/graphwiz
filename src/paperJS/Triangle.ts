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

	constructor(lenght: number, width: number) {
		this.triangle = createIsoscelesTriangle(
			new Paper.Point(1, 1),
			width,
			lenght,
			new Paper.Point(2, 2)
		); // init at random place

		this.triangle.fillColor = new Paper.Color('white');
		this.width = width;
		this.length = lenght;
		this.type = 'triangle';
	}

	// todo only update the path -> much better performance!
	// todo triangles stay there on graph change??
	update(newPosition: paper.Point, direction: paper.Point): void {
		[
			this.triangle.segments[0].point,
			this.triangle.segments[1].point,
			this.triangle.segments[2].point
		] = getIsoscelesTrianglePoints(newPosition, this.width, this.length, direction);
	}

	updateStyle(decoratorData: DecoratorData, edgeColor: Gradient): void {
		// update color
		let color: paper.Color;
		if (decoratorData.color) {
			color = new Paper.Color(colord(decoratorData.color).toRgbString());
		} else {
			// we use the edge color at the point (if gradient)
			color = new Paper.Color(getGradientColorAsString(edgeColor, decoratorData.position));
		}

		this.triangle.fillColor = color;
	}

	delete() {
		this.triangle.remove();
	}
}
