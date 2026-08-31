#!/usr/bin/env node
// Fetches the latest posts from the Medium RSS feed and rewrites the
// "posts" array inside public/assets/data/content.json (blogs section).
//
// Run manually with: node scripts/update-blogs.mjs
// Run automatically by .github/workflows/update-blogs.yml

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FEED_URL = 'https://khatzie.medium.com/feed';
const CONTENT_PATH = fileURLToPath(new URL('../public/assets/data/content.json', import.meta.url));
const POST_COUNT = 6;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Best-effort tag casing for common abbreviations. Anything not listed
// here falls back to simple Title Case.
const TAG_WORD_OVERRIDES = {
	ios: 'iOS',
	swiftui: 'SwiftUI',
	ux: 'UX',
	ui: 'UI',
	api: 'API',
	ci: 'CI',
	cd: 'CD',
	jfrog: 'JFrog',
	devsecops: 'DevSecOps',
	devops: 'DevOps',
	mobsf: 'MobSF'
};

async function main() {
	const feedXml = await fetchText(FEED_URL);
	const items = parseFeedItems(feedXml).slice(0, POST_COUNT);

	if (!items.length) {
		throw new Error('No items found in Medium feed.');
	}

	const posts = [];
	for (const item of items) {
		const excerpt = await fetchExcerpt(item.link).catch(() => null);
		posts.push({
			title: item.title,
			url: item.link,
			date: formatDate(item.pubDate),
			excerpt: excerpt || `New post from Katherine's Medium: ${item.title}.`,
			tags: item.categories.slice(0, 3).map(formatTag)
		});
	}

	updateContentFile(posts);
	console.log(`Updated ${posts.length} posts in ${CONTENT_PATH}`);
}

async function fetchText(url) {
	const response = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT }
	});
	if (!response.ok) {
		throw new Error(`Request to ${url} failed with status ${response.status}`);
	}
	return response.text();
}

function parseFeedItems(xml) {
	const items = [];
	const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

	for (const [, block] of itemMatches) {
		const title = decodeEntities(matchOne(block, /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/));
		const link = matchOne(block, /<link>([\s\S]*?)<\/link>/);
		const pubDate = matchOne(block, /<pubDate>([\s\S]*?)<\/pubDate>/);
		const categories = [...block.matchAll(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g)]
			.map((match) => match[1]);

		if (title && link && pubDate) {
			items.push({ title, link, pubDate, categories });
		}
	}

	return items;
}

function matchOne(text, regex) {
	const match = text.match(regex);
	return match ? match[1].trim() : '';
}

function decodeEntities(text) {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

// Medium doesn't include a real summary in its RSS feed, so we pull the
// article page and grab the first substantial paragraph from the embedded
// Apollo state as a stand-in "dek". This is scraping an undocumented
// internal JSON blob, so it may stop matching if Medium changes its page
// structure -- the caller falls back to a generic excerpt when it does.
async function fetchExcerpt(url) {
	const html = await fetchText(url);
	const paragraphPattern = /"type":"P"[^{}]*?"text":"((?:[^"\\]|\\.)*)"/g;

	for (const match of html.matchAll(paragraphPattern)) {
		const text = JSON.parse(`"${match[1]}"`);
		if (text.length >= 50 && text.length <= 220) {
			return text;
		}
	}

	return null;
}

function formatDate(pubDate) {
	const date = new Date(pubDate);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTag(slug) {
	return slug
		.split('-')
		.map((word) => TAG_WORD_OVERRIDES[word] || (word.charAt(0).toUpperCase() + word.slice(1)))
		.join(' ');
}

function updateContentFile(posts) {
	const raw = readFileSync(CONTENT_PATH, 'utf8');

	const startMarker = '\t\t\t"posts": [\n';
	const endMarker = '\n\t\t\t]';

	const startIndex = raw.indexOf(startMarker);
	if (startIndex === -1) {
		throw new Error('Could not find "posts" array in content.json');
	}

	const arrayStart = startIndex + startMarker.length;
	const endIndex = raw.indexOf(endMarker, arrayStart);
	if (endIndex === -1) {
		throw new Error('Could not find end of "posts" array in content.json');
	}

	const postsBlock = posts.map(formatPostBlock).join(',\n');
	const updated = raw.slice(0, arrayStart) + postsBlock + raw.slice(endIndex);
	writeFileSync(CONTENT_PATH, updated);
}

function formatPostBlock(post) {
	return [
		'\t\t\t\t{',
		`\t\t\t\t\t"title": ${JSON.stringify(post.title)},`,
		`\t\t\t\t\t"url": ${JSON.stringify(post.url)},`,
		`\t\t\t\t\t"date": ${JSON.stringify(post.date)},`,
		`\t\t\t\t\t"excerpt": ${JSON.stringify(post.excerpt)},`,
		`\t\t\t\t\t"tags": [${post.tags.map((tag) => JSON.stringify(tag)).join(', ')}]`,
		'\t\t\t\t}'
	].join('\n');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
