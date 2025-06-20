import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper functions
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randBool = () => Math.random() < 0.5;

// --- Configuration for new attributes ---

// Scenario: A network of software projects
const LANGUAGES = ['JavaScript', 'Python', 'Go', 'Rust', 'Java'];
const DEPENDENCY_TYPES = ['direct', 'dev'];

// Some sample words to generate repo names
const REPO_PREFIXES = ['turbo', 'quantum', 'neural', 'hyper', 'crypto', 'poly', 'meta', 'giga'];
const REPO_SUFFIXES = ['flow', 'script', 'base', 'net', 'core', '-io', '-kit', '-stack'];

const generateRepoName = () => `${rand(REPO_PREFIXES)}-${rand(REPO_SUFFIXES)}`;

// --- Main Script ---

const inputFilePath = join(__dirname, 'homepageGraph.json');
const outputFilePath = join(__dirname, 'homepageGraphWithAttributes.json');

console.log('Reading graph data...');
const graphData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

const { nodes, edges } = graphData.graph;

// 1. Identify existing clusters from the 'field' attribute
const existingClusters = [...new Set(nodes.map((n) => n.attributes.field))];
console.log('Found existing clusters (fields):', existingClusters);

// 2. Map existing clusters to new 'language' clusters
const clusterMapping = {};
existingClusters.forEach((cluster, i) => {
	clusterMapping[cluster] = LANGUAGES[i % LANGUAGES.length];
});
console.log('Mapping to new language clusters:', clusterMapping);

// 3. Process nodes to add new attributes
const newNodes = nodes.map((node) => {
	const originalCluster = node.attributes.field;
	return {
		key: node.key,
		attributes: {
			language: clusterMapping[originalCluster], // Cluster attribute
			repo_name: generateRepoName(), // String attribute
			stars: randInt(50, 10000), // Numerical attribute
			commits: randInt(100, 50000) // Numerical attribute
		}
	};
});

// 4. Process edges to add new attributes
const newEdges = edges.map((edge) => {
	return {
		key: edge.key,
		source: edge.source,
		target: edge.target,
		attributes: {
			dependency_type: rand(DEPENDENCY_TYPES), // String attribute
			version_lag: randInt(0, 3), // Numerical attribute
			is_critical: randBool() // Boolean attribute
		}
	};
});

// 5. Construct the new graph object
const newGraphData = {
	...graphData,
	graph: {
		...graphData.graph,
		nodes: newNodes,
		edges: newEdges
	}
};

// 6. Write to output file
fs.writeFileSync(outputFilePath, JSON.stringify(newGraphData, null, 2));

console.log(`\nSuccessfully processed graph!`);
console.log(`- Nodes: ${newNodes.length}`);
console.log(`- Edges: ${newEdges.length}`);
console.log(`- Output file written to: ${outputFilePath}`);
