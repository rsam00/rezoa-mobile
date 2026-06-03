/**
 * playlistParser.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches and parses playlist files (.m3u, .pls) to extract the direct audio 
 * stream URL. React Native Track Player requires a direct media URL and will 
 * fail if passed a playlist file.
 */

/**
 * Checks if a URL points to a standard text-based playlist file.
 * Note: .m3u8 is intentionally excluded as it is typically an HLS manifest,
 * which TrackPlayer (ExoPlayer/AVPlayer) supports natively.
 */
export function isPlaylistUrl(url: string): boolean {
  const lowerUrl = url.split('?')[0].toLowerCase();
  return lowerUrl.endsWith('.m3u') || lowerUrl.endsWith('.pls');
}

/**
 * Given a URL, fetches it if it's a playlist and extracts the first valid 
 * audio stream URL. If it's not a playlist or parsing fails, returns the 
 * original URL.
 */
export async function resolveStreamUrl(url: string): Promise<string> {
  if (!url || !isPlaylistUrl(url)) {
    return url;
  }

  try {
    console.log(`[PlaylistParser] Fetching playlist: ${url}`);
    const response = await fetch(url, {
      headers: {
        // Disguise as a standard browser to avoid blocks from strict servers
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`[PlaylistParser] Failed to fetch playlist: ${response.status}`);
      return url;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    
    // .m3u format: just look for the first line starting with http
    // .pls format: looks like File1=http://...
    
    for (let line of lines) {
      line = line.trim();
      
      // Skip comments or empty lines
      if (!line || line.startsWith('#')) continue;

      // Check for .pls syntax (e.g., File1=http://...)
      if (line.toLowerCase().startsWith('file') && line.includes('=')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const possibleUrl = parts.slice(1).join('=').trim();
          if (possibleUrl.startsWith('http')) {
            console.log(`[PlaylistParser] Extracted PLS stream: ${possibleUrl}`);
            return possibleUrl;
          }
        }
      }
      
      // Check for .m3u syntax (raw URLs)
      if (line.startsWith('http')) {
        console.log(`[PlaylistParser] Extracted M3U stream: ${line}`);
        return line;
      }
    }

    console.warn('[PlaylistParser] No valid stream URL found in playlist');
    return url;
  } catch (error) {
    console.error('[PlaylistParser] Error parsing playlist:', error);
    return url;
  }
}
