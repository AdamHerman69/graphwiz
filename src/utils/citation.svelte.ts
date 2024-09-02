import { Cite } from '@citation-js/core';
import '@citation-js/plugin-doi';

export type Citation = {
	DOI: string;
	authors: Author[];
	created: Date;
	title: string;
	subtitle?: string;
	abstract: string;
	URL: string;
};

export type Author = {
	given: string;
	family: string;
};

const literature: Map<string, Promise<Citation>> = new Map<string, Promise<Citation>>();

export async function getCitationInfo(DOI: string): Promise<Citation> {
	if (!literature.has(DOI)) {
		const citationPromise = fetchCitation(DOI);
		literature.set(DOI, citationPromise);
	}
	return literature.get(DOI)!;
}

async function fetchCitation(DOI: string): Promise<Citation> {
	try {
		const cite = await Cite.async(DOI);
		const data = cite.data[0];

		return {
			DOI: DOI,
			authors: data.author?.map((author: any) => ({
				given: author.given,
				family: author.family
			})),
			created: new Date(data.created['date-time']),
			title: data.title,
			subtitle: data.subtitle?.[0],
			abstract: data.abstract,
			URL: data.URL
		};
	} catch (error) {
		console.error('Error fetching citation:', error);
		throw error;
	}
}
