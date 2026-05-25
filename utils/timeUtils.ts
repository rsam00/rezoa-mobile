export interface Program {
  id: string;
  stationId: string;
  name: string;
  schedules: { startTime: string; endTime: string; days: string[] }[];
}

// ---------------------------------------------------------------------------
// Haiti timezone cache
// Intl.DateTimeFormat.formatToParts() with a non-local timezone is expensive
// on the JS thread. We cache the UTC-to-Haiti offset and only refresh it once
// per minute (the offset only changes twice a year for DST).
// ---------------------------------------------------------------------------
let _cachedOffsetMinutes: number | null = null;
let _cacheRefreshedAtMinute = -1;

function getHaitiOffsetMinutes(): number {
  const nowMs = Date.now();
  const nowMinute = Math.floor(nowMs / 60000);

  if (_cachedOffsetMinutes !== null && nowMinute === _cacheRefreshedAtMinute) {
    return _cachedOffsetMinutes;
  }

  try {
    // One cheap Intl call per minute to get the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Port-au-Prince',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const utcDate = new Date(nowMs);
    const parts = formatter.formatToParts(utcDate);
    const pm = parts.find(p => p.type === 'minute');
    const ph = parts.find(p => p.type === 'hour');
    if (pm && ph) {
      const haitiH = parseInt(ph.value, 10);
      const haitiM = parseInt(pm.value, 10);
      const haitiTotalMinutes = haitiH * 60 + haitiM;
      const utcH = utcDate.getUTCHours();
      const utcM = utcDate.getUTCMinutes();
      const utcTotalMinutes = utcH * 60 + utcM;
      _cachedOffsetMinutes = haitiTotalMinutes - utcTotalMinutes;
    }
  } catch {
    _cachedOffsetMinutes = -300; // Haiti is UTC-5 (EST) as a safe fallback
  }

  _cacheRefreshedAtMinute = nowMinute;
  return _cachedOffsetMinutes ?? -300;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Gets the current time and day in Haiti (America/Port-au-Prince).
 * Uses a cached UTC offset so the expensive Intl call only runs once per minute.
 */
export function getHaitiTime() {
  const nowMs = Date.now();
  const offsetMinutes = getHaitiOffsetMinutes();
  const haitiMs = nowMs + offsetMinutes * 60000;
  const d = new Date(haitiMs);

  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const day = DAYS[d.getUTCDay()];

  return {
    day,
    hours,
    minutes,
    seconds,
    totalSeconds: hours * 3600 + minutes * 60 + seconds,
  };
}

/**
 * Finds the currently playing program for a station based on Haiti time
 */
export function getCurrentProgram(programs: Program[], stationId: string, precomputedTime?: any) {
  const haiti = precomputedTime || getHaitiTime();
  const { day, totalSeconds } = haiti;
  const currentMinutes = Math.floor(totalSeconds / 60);

  // Normalize day name for comparison (remove spaces, etc.)
  const normalizedDay = day.trim();
  

  const program = programs.find((p: Program) => 
    String(p.stationId) === String(stationId) && 
    p.schedules && 
    p.schedules.some(sch => {
      // Robust day matching: check if normalizedDay is in sch.days
      const dayMatch = sch.days.some(d => d.trim().toLowerCase() === normalizedDay.toLowerCase());
      if (!dayMatch) return false;
      
      const [startH, startM = '0'] = sch.startTime.split(':');
      const [endH, endM = '0'] = sch.endTime.split(':');
      const start = parseInt(startH, 10) * 60 + parseInt(startM, 10);
      let end = parseInt(endH, 10) * 60 + parseInt(endM, 10);
      
      let match = false;
      if (end > start) {
        match = currentMinutes >= start && currentMinutes < end;
      } else if (end < start) {
        match = currentMinutes >= start || currentMinutes < end;
      }
      
      return match;
    })
  );


  return program;
}

/**
 * Calculates high-precision progress for a program
 */
export function calculateProgramProgress(program: Program) {
  const { day, totalSeconds: nowSeconds } = getHaitiTime();
  
  const activeSch = program.schedules.find(sch => sch.days.includes(day));
  if (!activeSch) return 0;

  const [startH, startM = '0'] = activeSch.startTime.split(':');
  const [endH, endM = '0'] = activeSch.endTime.split(':');
  
  let startSeconds = parseInt(startH, 10) * 3600 + parseInt(startM, 10) * 60;
  let endSeconds = parseInt(endH, 10) * 3600 + parseInt(endM, 10) * 60;
  
  let currentSeconds = nowSeconds;

  // Handle midnight wrap-around
  if (endSeconds < startSeconds) {
    endSeconds += 86400; // Add 24 hours
    if (currentSeconds < startSeconds) {
      currentSeconds += 86400;
    }
  }

  const total = endSeconds - startSeconds;
  const elapsed = currentSeconds - startSeconds;
  
  return Math.max(0, Math.min(1, elapsed / (total || 1)));
}
