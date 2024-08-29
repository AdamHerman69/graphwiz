import { Cite } from '@citation-js/core';
import '@citation-js/plugin-doi';

export type Citation = {
	DOI: string;
	authors: Author[];
	created: Date;
	title: string;
	abstract: string;
	URL: string;
};

export type Author = {
	given: string;
	family: string;
};

export let litarature: Map<string, Citation> = new Map<string, Citation>(); // key: DOI, value: Citation

export async function getCitationInfo(DOI: string): Promise<Citation> {
	if (litarature.has(DOI)) {
		return litarature.get(DOI);
	}

	try {
		const cite = await Cite.async(DOI);
		const data = cite.data[0];

		let citation: Citation = {
			DOI: DOI,
			authors: data.author?.map((author: any) => {
				return { given: author.given, family: author.family };
			}),
			created: new Date(data.created['date-time']),
			title: data.title,
			abstract: data.abstract,
			URL: data.URL
		};

		litarature.set(DOI, citation);

		return citation;
	} catch (error) {
		console.error('Error fetching citation:', error);
		throw error;
	}
}
