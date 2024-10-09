import { forceEdgeBundling } from '$lib/d3-force-bundle';

self.onmessage = (event) => {
	const { nodes, links } = event.data;

	const linksFormated = links.map((link) => ({
		source: link.source.id,
		target: link.target.id
	}));

	const fbundling = forceEdgeBundling();

	fbundling
		.nodes(nodes.reduce((acc, n) => ({ ...acc, [n.id]: n }), {}))
		.edges(linksFormated)
		.bundling_stiffness(0.1)
		.step_size(0.1)
		.iterations(100)
		.iterations_rate(0.7)
		.subdivision_points_seed(1)
		.subdivision_rate(2);

	const results = fbundling();

	self.postMessage(results);
};
