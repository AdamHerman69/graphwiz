// generate_graph.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CONFIGURABLE PARAMETERS
const NUM_NODES = 300;
const FIELDS = ['AI', 'Bioinformatics', 'Physics', 'Sociology', 'Mathematics', 'Neuroscience'];
const INSTITUTIONS = [
	'MIT',
	'Stanford',
	'Harvard',
	'Oxford',
	'Cambridge',
	'ETH Zurich',
	'Tokyo Univ'
];
const FIRST_NAMES = [
	'Alice',
	'Bob',
	'Carol',
	'David',
	'Eve',
	'Frank',
	'Grace',
	'Heidi',
	'Ivan',
	'Judy',
	'Ken',
	'Laura',
	'Mallory',
	'Niaj',
	'Olivia',
	'Peggy',
	'Quentin',
	'Rupert',
	'Sybil',
	'Trent',
	'Uma',
	'Victor',
	'Wendy',
	'Xavier',
	'Yvonne',
	'Zach'
];
const LAST_NAMES = [
	'Smith',
	'Lee',
	'Jones',
	'Brown',
	'Garcia',
	'Müller',
	'Kim',
	'Chen',
	'Singh',
	'Kumar',
	'Nguyen',
	'Wang'
];

// Helper functions
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Load settings from your existing homepageGraph.json
const settingsPath = join(__dirname, 'homepageGraph.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')).settings;

// Generate nodes
const nodes = [];
for (let i = 0; i < NUM_NODES; i++) {
	const name = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
	const field = rand(FIELDS);
	const institution = rand(INSTITUTIONS);
	const h_index = randInt(10, 80);
	const papers = randInt(20, 200);
	nodes.push({
		key: String(i),
		attributes: { name, field, institution, h_index, papers }
	});
}

// Generate edges (collaborations) with outliers
const edges = [];
let edgeId = 0;

// Create some outliers (20% of nodes) with only one edge
const numOutliers = Math.floor(NUM_NODES * 0.5);
const outlierIndices = new Set();
for (let i = 0; i < numOutliers; i++) {
	let randomIndex;
	do {
		randomIndex = randInt(0, NUM_NODES - 1);
	} while (outlierIndices.has(randomIndex));
	outlierIndices.add(randomIndex);
}

// Generate edges for regular nodes (non-outliers)
for (let i = 0; i < NUM_NODES; i++) {
	if (outlierIndices.has(i)) {
		// Outliers get only one edge
		const allOtherNodes = nodes.filter((n) => n.key !== nodes[i].key);
		const mate = rand(allOtherNodes);
		if (mate) {
			edges.push({
				key: `e${edgeId++}`,
				source: nodes[i].key,
				target: mate.key,
				attributes: {
					papers_coauthored: randInt(1, 3),
					first_collab_year: randInt(2000, 2024)
				}
			});
		}
	} else {
		// Regular nodes get 1-2 cluster edges and 0-1 bridge edges
		const clusterMates = nodes.filter(
			(n) => n.attributes.field === nodes[i].attributes.field && n.key !== nodes[i].key
		);
		const numClusterEdges = randInt(1, 2); // Reduced from 1-3 to 1-2
		for (let j = 0; j < numClusterEdges; j++) {
			const mate = rand(clusterMates);
			if (
				mate &&
				!edges.find(
					(e) =>
						(e.source === nodes[i].key && e.target === mate.key) ||
						(e.source === mate.key && e.target === nodes[i].key)
				)
			) {
				edges.push({
					key: `e${edgeId++}`,
					source: nodes[i].key,
					target: mate.key,
					attributes: {
						papers_coauthored: randInt(1, 15),
						first_collab_year: randInt(2000, 2024)
					}
				});
			}
		}

		// Bridge edges (reduced probability)
		if (Math.random() < 0.3) {
			// 30% chance instead of always trying
			const otherFieldMates = nodes.filter((n) => n.attributes.field !== nodes[i].attributes.field);
			const mate = rand(otherFieldMates);
			if (
				mate &&
				!edges.find(
					(e) =>
						(e.source === nodes[i].key && e.target === mate.key) ||
						(e.source === mate.key && e.target === nodes[i].key)
				)
			) {
				edges.push({
					key: `e${edgeId++}`,
					source: nodes[i].key,
					target: mate.key,
					attributes: {
						papers_coauthored: randInt(1, 5),
						first_collab_year: randInt(2000, 2024)
					}
				});
			}
		}
	}
}

const graph = {
	options: { type: 'undirected', multi: false, allowSelfLoops: true },
	attributes: {},
	nodes,
	edges
};

const output = { settings, graph };

fs.writeFileSync(join(__dirname, 'homepageGraph.json'), JSON.stringify(output, null, 2));
console.log('Generated homepageGraph.json!');
console.log(`Created ${nodes.length} nodes and ${edges.length} edges`);
console.log(`Outliers: ${numOutliers} nodes with only one edge each`);
