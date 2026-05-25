/**
 * streamProbe.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Mobile-safe stream inspector with Zeno.fm API priority.
 *
 * STRATEGY (in order):
 *
 *   1. ZENO.FM API  (stream.zeno.fm / stream.zenolive.com)
 *      ─────────────────────────────────────────────────────
 *      Zeno exposes a Server-Sent Events (SSE) endpoint per stream mount:
 *        https://api.zeno.fm/mounts/metadata/subscribe/<mountId>
 *
 *      The mount ID is the last path segment of the stream URL.
 *        stream.zeno.fm/82q102t62neuv  →  mountId = "82q102t62neuv"
 *
 *      The SSE stream emits JSON events like:
 *        data: {"mount":"82q102t62neuv","streamTitle":"Artist - Title"}
 *
 *      We connect, read the FIRST message event, then close.
 *      This gives us the currently-playing track instantly without ever
 *      touching the audio stream itself.
 *
 *      556 of 629 stations (88%) in the Rezoa database are Zeno streams.
 *
 *   2. XHR ICY PROBE  (all other streams)
 *      ─────────────────────────────────────────────────────
 *      Opens a GET connection with Icy-MetaData:1, reads headers at
 *      readyState=2 (HEADERS_RECEIVED), then aborts before body download.
 *      Gives us protocol + icy-name, icy-genre, icy-br, etc.
 *
 *      WHY XHR INSTEAD OF fetch():
 *      fetch() on React Native / Android (OkHttp) doesn't resolve until the
 *      response body is fully received — a live stream never ends, so fetch()
 *      hangs until the AbortController timeout fires (10 s every time).
 *      XHR's readyState=2 fires as soon as headers arrive, before body bytes.
 */

export type StreamProtocol = 'ICY' | 'HLS' | 'DASH' | 'UNKNOWN';

export interface StreamInfo {
  protocol      : StreamProtocol;
  // ICY connection headers
  icyName       : string | null;   // Station name from server
  icyGenre      : string | null;   // Music genre
  icyBitrate    : string | null;   // kbps
  icySampleRate : string | null;   // Hz
  icyMetaInt    : number | null;   // Bytes between inline metadata blocks
  icyUrl        : string | null;   // Station website URL
  icyPub        : boolean | null;  // Publicly listed in directory?
  icyAudioInfo  : string | null;   // Codec details (ice-audio-info)
  // Now-playing metadata
  nowPlaying    : string | null;   // Currently playing track (StreamTitle)
  nowPlayingUrl : string | null;   // Track URL (StreamUrl)
  // Source
  metadataSource: 'zeno-api' | 'icy-headers' | 'none';
  // Transport
  resolvedUrl   : string | null;
  contentType   : string | null;
  server        : string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ZENO_API_TIMEOUT_MS  = 6_000;
const XHR_PROBE_TIMEOUT_MS = 8_000;
const ZENO_METADATA_BASE   = 'https://api.zeno.fm/mounts/metadata/subscribe/';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyInfo(url: string): StreamInfo {
  return {
    protocol: 'UNKNOWN', resolvedUrl: url, contentType: null, server: null,
    icyName: null, icyGenre: null, icyBitrate: null, icySampleRate: null,
    icyMetaInt: null, icyUrl: null, icyPub: null, icyAudioInfo: null,
    nowPlaying: null, nowPlayingUrl: null,
    metadataSource: 'none',
  };
}

function parseXhrHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  raw.split('\r\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      out[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
  });
  return out;
}

function detectProtocol(h: Record<string, string>, url: string): StreamProtocol {
  const ct = (h['content-type'] || '').toLowerCase();
  const u  = url.toLowerCase().split('?')[0];

  // ICY signals — any icy-* header is definitive
  if (h['icy-name'] || h['icy-br'] || h['icy-genre'] || h['icy-metaint'] || h['icy-url']) return 'ICY';
  if (ct.includes('audio/mpeg') || ct.includes('audio/aac')  || ct.includes('audio/aacp') ||
      ct.includes('audio/ogg')  || ct.includes('application/ogg')) return 'ICY';

  // HLS
  if (ct.includes('application/vnd.apple.mpegurl') || ct.includes('audio/mpegurl') ||
      ct.includes('application/x-mpegurl') || u.endsWith('.m3u8')) return 'HLS';

  // DASH
  if (ct.includes('application/dash+xml') || u.endsWith('.mpd')) return 'DASH';

  return 'UNKNOWN';
}

/**
 * Extract the Zeno mount ID from a stream URL.
 * Works for both stream.zeno.fm and stream.zenolive.com.
 *
 * Examples:
 *   https://stream.zeno.fm/82q102t62neuv       →  "82q102t62neuv"
 *   https://stream.zenolive.com/0zef35h1my5tv   →  "0zef35h1my5tv"
 *
 * Returns null if the URL is not a Zeno stream.
 */
function extractZenoMountId(streamUrl: string): string | null {
  const m = streamUrl.match(/stream\.zeno(?:live)?\.(?:fm|com)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

// ─── Zeno.fm API probe ────────────────────────────────────────────────────────

/**
 * Call the Zeno.fm SSE metadata endpoint for a given mount ID.
 *
 * The endpoint is a Server-Sent Events stream that emits JSON events:
 *   event: message
 *   data: {"mount":"<id>","streamTitle":"Artist - Title"}
 *
 * We read the first `message` event and immediately close the connection.
 * Typical response time: 200–800 ms.
 *
 * Returns { streamTitle } or null on failure/timeout.
 */
function zenoMetadataProbe(mountId: string): Promise<{ streamTitle: string | null }> {
  return new Promise((resolve) => {
    const url = `${ZENO_METADATA_BASE}${mountId}`;
    const xhr  = new XMLHttpRequest();
    let   done = false;
    let   buffer = '';

    const finish = (streamTitle: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      xhr.abort();
      resolve({ streamTitle });
    };

    const timer = setTimeout(() => {
      console.log(`[StreamProbe] Zeno API timeout for mount: ${mountId}`);
      finish(null);
    }, ZENO_API_TIMEOUT_MS);

    xhr.onreadystatechange = () => {
      if (done) return;
      if (xhr.readyState < 3) return; // wait for LOADING (body bytes arriving)

      // Accumulate body chunks (SSE is chunked-encoded)
      const newText = xhr.responseText || '';
      if (newText.length > buffer.length) {
        buffer = newText;
      }

      // Parse SSE: look for a "data:" line containing valid JSON
      const lines = buffer.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const payload = JSON.parse(jsonStr);
          if (payload && typeof payload.streamTitle === 'string') {
            const title = payload.streamTitle.trim();
            console.log('\n=============================================');
            console.log('📻 ZENO API NOW PLAYING:');
            console.log(`   Mount ID:     ${mountId}`);
            console.log(`   Stream Title: "${title || 'No Track Information'}"`);
            console.log('=============================================\n');
            finish(title || null);
            return;
          }
        } catch {
          // Not valid JSON yet — keep accumulating
        }
      }
    };

    xhr.onerror = () => finish(null);

    xhr.open('GET', url, true);
    // Request plain text so XHR doesn't try to parse as XML/HTML
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.send();
  });
}

// ─── XHR ICY probe ───────────────────────────────────────────────────────────

/**
 * Open a GET connection to an audio stream, read headers at readyState=2
 * (HEADERS_RECEIVED), then abort before downloading any audio data.
 * Gives us protocol + all icy-* connection headers.
 */
function xhrIcyProbe(streamUrl: string): Promise<{ headers: Record<string, string>; responseUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let done  = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      xhr.abort();
      reject(new Error(`XHR timeout after ${XHR_PROBE_TIMEOUT_MS}ms`));
    }, XHR_PROBE_TIMEOUT_MS);

    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 2 && !done) {
        done = true;
        clearTimeout(timer);
        const headers     = parseXhrHeaders(xhr.getAllResponseHeaders() || '');
        const responseUrl = (xhr as any).responseURL || streamUrl;
        xhr.abort(); // stop downloading audio body immediately
        resolve({ headers, responseUrl });
      }
    };

    xhr.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      // SHOUTcast v1 "ICY 200 OK" — invalid HTTP version triggers onerror
      reject(new Error('Network error (possibly SHOUTcast v1 ICY server)'));
    };

    xhr.open('GET', streamUrl, true);
    xhr.setRequestHeader('Icy-MetaData', '1');
    xhr.send();
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Probe a streaming URL to detect its protocol and extract all available
 * metadata. Always resolves — never rejects.
 *
 * Call this NON-BLOCKING after TrackPlayer.play() so playback has zero
 * added latency. The result arrives in 0.5–3 s and the UI updates then.
 */
export async function probeStream(streamUrl: string): Promise<StreamInfo> {

  // ── PATH 1: Zeno.fm API (fast, reliable, gives StreamTitle) ──────────────
  const mountId = extractZenoMountId(streamUrl);

  if (mountId) {
    console.log(`[StreamProbe] Zeno stream detected — mount: ${mountId}`);
    try {
      const { streamTitle } = await zenoMetadataProbe(mountId);

      const info: StreamInfo = {
        ...emptyInfo(streamUrl),
        protocol       : 'ICY',   // All Zeno streams are ICY/SHOUTcast
        metadataSource : 'zeno-api',
        nowPlaying     : streamTitle,
        resolvedUrl    : streamUrl,
      };

      console.log(`[StreamProbe] Zeno result: nowPlaying="${info.nowPlaying}"`);
      return info;
    } catch (err) {
      // Zeno API failed — fall through to XHR ICY probe
      console.log('[StreamProbe] Zeno API error, falling back to XHR probe:', (err as Error).message);
    }
  }

  // ── PATH 2: XHR ICY probe (all other streams) ─────────────────────────────
  try {
    const { headers, responseUrl } = await xhrIcyProbe(streamUrl);
    const protocol    = detectProtocol(headers, responseUrl);
    const metaIntRaw  = headers['icy-metaint'];

    const info: StreamInfo = {
      protocol,
      resolvedUrl    : responseUrl,
      contentType    : headers['content-type']    || null,
      server         : headers['server']           || null,
      icyName        : headers['icy-name']         || null,
      icyGenre       : headers['icy-genre']        || null,
      icyBitrate     : headers['icy-br']           || null,
      icySampleRate  : headers['icy-sr']           || null,
      icyMetaInt     : metaIntRaw ? parseInt(metaIntRaw, 10) : null,
      icyUrl         : headers['icy-url']          || null,
      icyPub         : headers['icy-pub'] === '1' ? true : headers['icy-pub'] === '0' ? false : null,
      icyAudioInfo   : headers['ice-audio-info']   || null,
      nowPlaying     : null,
      nowPlayingUrl  : null,
      metadataSource : 'icy-headers',
    };

    console.log(`[StreamProbe] ICY probe → protocol=${protocol} icy-name="${info.icyName}" br="${info.icyBitrate}kbps"`);
    return info;

  } catch (err: any) {
    const msg = err?.message || '';

    // SHOUTcast v1 "ICY 200 OK" — XHR onerror fires but stream IS ICY
    if (msg.includes('Network error')) {
      console.log('[StreamProbe] SHOUTcast v1 (ICY 200 OK) server detected');
      return { ...emptyInfo(streamUrl), protocol: 'ICY', metadataSource: 'none' };
    }

    console.log('[StreamProbe] Probe failed:', msg);
    return emptyInfo(streamUrl);
  }
}

// ─── Zeno now-playing refresh ─────────────────────────────────────────────────

/**
 * Lightweight now-playing refresh for a Zeno stream already identified.
 * Call this periodically (e.g. every 30 s) from the MiniPlayer to update
 * the currently-playing track without re-running the full probe.
 *
 * Returns the new streamTitle, or null if unavailable / not a Zeno stream.
 */
export async function refreshZenoNowPlaying(streamUrl: string): Promise<string | null> {
  const mountId = extractZenoMountId(streamUrl);
  if (!mountId) return null;
  try {
    const { streamTitle } = await zenoMetadataProbe(mountId);
    return streamTitle;
  } catch {
    return null;
  }
}
