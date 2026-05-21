import { getConfig } from '../config.js';

export function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export interface SearchSource {
  index: number;
  title: string;
  url: string;
  snippet: string;
}

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResult {
  text: string;
  count: number;
  sources: SearchSource[];
}

export async function searchWeb(query: string): Promise<WebSearchResult> {
  const config = getConfig();
  const wsConfig = config.webSearch;

  if (!wsConfig?.enabled) {
    console.log('[WebSearch] disabled in config');
    return { text: '', count: 0, sources: [] };


  }

  if (wsConfig.provider === 'searxng') {
    return searchSearXNG(query, wsConfig.searxngUrl);
  }

  console.log('[WebSearch] unknown provider:', wsConfig.provider);
  return { text: '', count: 0, sources: [] };
}

async function searchSearXNG(query: string, baseUrl: string): Promise<WebSearchResult> {
  try {
    const url = new URL('/search', baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', 'en');
    url.searchParams.set('categories', 'general');
    url.searchParams.set('pageno', '1');

    console.log(`[WebSearch] querying SearXNG at ${url.toString()}`);

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Open-Arena/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`[WebSearch] SearXNG error: ${res.status}`);
      return { text: '', count: 0, sources: [] };
    }

    const data = await res.json();
    const rawResults: RawSearchResult[] = (data.results || []).slice(0, 8);

    if (rawResults.length === 0) {
      console.log('[WebSearch] no results found');
      return { text: '', count: 0, sources: [] };
    }

    console.log(`[WebSearch] ${rawResults.length} results found`);

    const today = getTodayDateString();
    const sources: SearchSource[] = rawResults.map((r, i) => ({
      index: i + 1,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));
    const snippets = sources.map((s) =>
      `[${s.index}] ${s.title}\n${s.snippet}\nSource: ${s.url}`
    );

    const text = [
      `Today is ${today}. The user is asking about current or recent information.`,
      'Web search results for the user\'s query are provided below.',
      'These results are from a live search engine — they are NOT part of your training data.',
      'You MUST use these search results to form your answer, especially for time-sensitive questions.',
      'If the results contain relevant information, base your answer on them and cite sources numerically like [1], [2], etc.',
      'If no results are relevant, politely say you could not find current information.',
      '',
      ...snippets,
    ].join('\n');

    return { text, count: sources.length, sources };
  } catch (e) {
    console.error('[WebSearch] SearXNG request failed:', e);
    return { text: '', count: 0, sources: [] };
  }
}
