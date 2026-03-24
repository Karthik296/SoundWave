/**
 * youtubeApi.js
 * 
 * Interacts with the official YouTube Data API v3 if a key is provided in .env
 * Falls back to the public Piped API proxy, which may be unstable or blocked.
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
console.log("YOUTUBE API KEY LOADED:", !!YOUTUBE_API_KEY);
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.smdv.sn',
    'https://pipedapi.adminforge.de'
];

/**
 * Searches for YouTube videos based on a query.
 */
export async function searchYouTubeVideos(query) {
    if (!query) return [];

    // Append high-res and spatial audio filters to force YouTube to return premium formats
    const modifiedQuery = `${query} 4K HDR Dolby Vision HDR10+ Dolby Atmos DTS:X Spatial 3D Audio 7.1`;

    // 1. Try Official API first if key exists
    if (YOUTUBE_API_KEY) {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=24&q=${encodeURIComponent(modifiedQuery)}&key=${YOUTUBE_API_KEY}`);
            if (!res.ok) throw new Error('YouTube API error (Check quota or key limits).');
            const data = await res.json();
            return data.items.map(item => ({
                url: `https://youtube.com/watch?v=${item.id.videoId}`,
                videoId: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                uploaderName: item.snippet.channelTitle,
                uploadedDate: new Date(item.snippet.publishedAt).toLocaleDateString(),
                views: 0,
                duration: 0
            }));
        } catch (err) {
            console.warn('Official API failed, falling back to proxy...', err);
        }
    }

    // 2. Fallback to Proxy loop
    let lastError = new Error('All public proxies failed.');
    for (const base of PIPED_INSTANCES) {
        try {
            const res = await fetch(`${base}/search?q=${encodeURIComponent(modifiedQuery)}&filter=all`);
            if (!res.ok) continue;

            const textResponse = await res.text();
            // Check if it's returning HTML instead of JSON (like cloudflare block)
            if (textResponse.trim().startsWith('<')) continue;

            const data = JSON.parse(textResponse);
            if (data.items) {
                return data.items.filter(item => item.type === 'stream');
            }
        } catch (err) {
            lastError = err;
            continue;
        }
    }

    console.error('searchYouTubeVideos error:', lastError);
    throw new Error('Public YouTube proxy is currently down. Please add VITE_YOUTUBE_API_KEY to your .env file for reliable access.');
}

/**
 * Fetches trending YouTube videos for a specific region.
 */
export async function getTrendingYouTubeVideos(region = 'IN') {
    // 1. Try Official API first if key exists
    if (YOUTUBE_API_KEY) {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=24&key=${YOUTUBE_API_KEY}`);
            if (!res.ok) throw new Error('YouTube API error (Check quota or key limits).');
            const data = await res.json();
            return data.items.map(item => {
                // Parse ISO 8601 duration (e.g. PT4M13S) to seconds approximately for display
                let durationStr = item.contentDetails.duration || '';
                let match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                let durationSecs = 0;
                if (match) {
                    const h = parseInt(match[1] || 0);
                    const m = parseInt(match[2] || 0);
                    const s = parseInt(match[3] || 0);
                    durationSecs = (h * 3600) + (m * 60) + s;
                }

                return {
                    url: `https://youtube.com/watch?v=${item.id}`,
                    videoId: item.id,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                    uploaderName: item.snippet.channelTitle,
                    uploadedDate: new Date(item.snippet.publishedAt).toLocaleDateString(),
                    views: parseInt(item.statistics.viewCount) || 0,
                    duration: durationSecs
                };
            });
        } catch (err) {
            console.warn('Official API failed, falling back to proxy...', err);
        }
    }

    // 2. Fallback to Proxy loop
    let lastError = new Error('All public proxies failed.');
    for (const base of PIPED_INSTANCES) {
        try {
            const res = await fetch(`${base}/trending?region=${region}`);
            if (!res.ok) continue;

            const textResponse = await res.text();
            // Check if it's returning HTML instead of JSON (like cloudflare block)
            if (textResponse.trim().startsWith('<')) continue;

            const data = JSON.parse(textResponse);
            if (Array.isArray(data) && data.length > 0) {
                return data.filter(item => item.type === 'stream');
            }
        } catch (err) {
            lastError = err;
            continue;
        }
    }

    console.error('getTrendingYouTubeVideos error:', lastError);
    throw new Error('Public YouTube proxy is currently down. Please add VITE_YOUTUBE_API_KEY to your .env file for reliable access.');
}
