/**
 * JioSaavn API — using jiosaavn-api-privatecvc2.vercel.app (working as of Feb 2026)
 * Response format: primaryArtists (string), image[].link, downloadUrl[].link
 */

const BASE = 'https://jiosaavn-api-privatecvc2.vercel.app';

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    // This API wraps data in { status, data } OR returns data directly
    return json.data ?? json;
}

// ─── Normalise a song object from this API into a consistent shape ───────────
function normaliseSong(s) {
    if (!s) return s;
    // Build artists object compatible with old saavn.dev shape
    const primaryNames = s.primaryArtists
        ? s.primaryArtists.split(', ')
        : [];
    const primaryIds = (s.primaryArtistsId || '').split(', ');

    return {
        ...s,
        year: s.year || s.releaseDate || '',
        artists: {
            primary: primaryNames.map((name, i) => ({
                id: primaryIds[i] || '',
                name,
            })),
        },
        // normalise image array: use `link` key → `url`
        image: (s.image || []).map(img => ({
            quality: img.quality,
            url: img.link || img.url,
        })),
        // normalise downloadUrl: use `link` key → `url`
        downloadUrl: (s.downloadUrl || []).map(d => ({
            quality: d.quality,
            url: d.link || d.url,
        })),
    };
}

function normaliseAlbum(al) {
    if (!al) return al;
    return {
        ...al,
        year: al.year || al.releaseDate || '',
        image: (al.image || []).map(img => ({
            quality: img.quality,
            url: img.link || img.url,
        })),
    };
}

function normaliseArtist(ar) {
    if (!ar) return ar;
    return {
        ...ar,
        image: (ar.image || []).map(img => ({
            quality: img.quality,
            url: img.link || img.url,
        })),
    };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function searchSongs(query, page = 0, limit = 20) {
    try {
        const data = await get(`/search/songs?query=${encodeURIComponent(query)}&page=${page + 1}&limit=${limit}`);
        const results = data?.results || data?.songs?.results || [];
        return results.map(normaliseSong);
    } catch (e) { console.error('searchSongs error:', e); return []; }
}

export async function searchAlbums(query, page = 0, limit = 20) {
    try {
        const data = await get(`/search/albums?query=${encodeURIComponent(query)}&page=${page + 1}&limit=${limit}`);
        const results = data?.results || data?.albums?.results || [];
        return results.map(normaliseAlbum);
    } catch (e) { console.error('searchAlbums error:', e); return []; }
}

export async function searchArtists(query, page = 0, limit = 20) {
    try {
        const data = await get(`/search/artists?query=${encodeURIComponent(query)}&page=${page + 1}&limit=${limit}`);
        const results = data?.results || data?.artists?.results || [];
        return results.map(normaliseArtist);
    } catch (e) { console.error('searchArtists error:', e); return []; }
}

export async function getAlbum(id) {
    try {
        const data = await get(`/albums?id=${id}`);
        const album = data?.albumDetails || data;
        const songs = (data?.songs?.results || data?.songs || []).map(normaliseSong);
        return { ...normaliseAlbum(album), songs };
    } catch (e) { console.error('getAlbum error:', e); return {}; }
}

export async function getArtist(id) {
    try {
        const data = await get(`/artists/${id}`);
        return normaliseArtist(data);
    } catch (e) { console.error('getArtist error:', e); return {}; }
}

export async function getArtistSongs(id) {
    try {
        const data = await get(`/artists/${id}/songs`);
        const results = data?.results || data?.songs?.results || [];
        return results.map(normaliseSong);
    } catch (e) { console.error('getArtistSongs error:', e); return []; }
}

const LANG_QUERIES = {
    hindi: 'hindi',
    telugu: 'telugu',
    tamil: 'tamil',
    kannada: 'kannada',
    malayalam: 'malayalam',
    punjabi: 'punjabi',
    english: 'english',
    bengali: 'bengali',
    marathi: 'marathi',
    bhojpuri: 'bhojpuri',
};

// Category keywords appended to language name for targeted search
const currentYear = new Date().getFullYear();
export const CATEGORIES = [
    { id: 'latest', label: 'Latest', icon: '🆕', keyword: `latest ${currentYear}` },
    { id: 'love', label: 'Love', icon: '❤️', keyword: 'love' },
    { id: 'mass', label: 'Mass', icon: '🔥', keyword: 'mass' },
    { id: 'party', label: 'Party', icon: '🎉', keyword: 'party' },
    { id: 'sad', label: 'Sad', icon: '😢', keyword: 'sad' },
    { id: 'devotional', label: 'Devotional', icon: '🙏', keyword: 'devotional' },
    { id: 'top', label: 'Top Hits', icon: '⭐', keyword: `top hits ${currentYear}` },
    { id: 'folk', label: 'Folk', icon: '🪘', keyword: 'folk' },
    { id: 'melody', label: 'Melody', icon: '🎶', keyword: 'melody' },
    { id: 'peppy', label: 'Peppy', icon: '😄', keyword: 'dance' },
];

export async function getSongsByLanguage(lang, page = 0, limit = 30) {
    const base = LANG_QUERIES[lang] || lang;
    return searchSongs(`${base} top songs ${currentYear - 1} ${currentYear}`, page, limit);
}

export async function getSongsByCategory(lang, categoryId, page = 0, limit = 30) {
    const base = LANG_QUERIES[lang] || lang;
    const cat = CATEGORIES.find(c => c.id === categoryId);
    const keyword = cat ? cat.keyword : categoryId;

    // Explicitly ask for large result set to sort if it's the latest category
    const actualLimit = categoryId === 'latest' ? Math.max(limit, 50) : limit;

    const results = await searchSongs(`${base} ${keyword}`, page, actualLimit);

    // Perform custom sorting to ensure newest songs rise to the top for the "Latest" category
    if (categoryId === 'latest' && results.length > 0) {
        results.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearB - yearA; // descending order: newest first
        });
    }

    return results.slice(0, limit); // Cap it back to requested length if we over-fetched
}


export async function getNewReleases() {
    return searchSongs(`new hindi songs ${currentYear}`, 0, 20);
}

export async function getTrendingSongs() {
    return searchSongs(`trending bollywood ${currentYear - 1} ${currentYear}`, 0, 15);
}

// ─── Stream URL helpers ───────────────────────────────────────────────────────

export function getSongStreamUrl(song) {
    if (!song?.downloadUrl?.length) return null;
    const urls = song.downloadUrl;
    const best =
        urls.find(u => u.quality === '320kbps') ||
        urls.find(u => u.quality === '160kbps') ||
        urls.find(u => u.quality === '96kbps') ||
        urls[urls.length - 1];
    return best?.url || null;
}

export function getSongImage(song, quality = 'medium') {
    if (!song?.image?.length) return null;
    const qMap = { high: '500x500', medium: '150x150', low: '50x50' };
    const target = qMap[quality] || '150x150';
    return (
        song.image.find(i => i.quality === target)?.url ||
        song.image[song.image.length - 1]?.url ||
        null
    );
}
