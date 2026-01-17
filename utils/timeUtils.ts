export interface Program {
  id: string;
  stationId: string;
  name: string;
  schedules: { startTime: string; endTime: string; days: string[] }[];
}

/**
 * Gets the current time and day in Haiti (America/Port-au-Prince)
 */
/**
 * Gets the current time and day in Haiti (America/Port-au-Prince)
 */
export function getHaitiTime() {
  const now = new Date();
  
  try {
    // We want to get the hour, minute, second and weekday in Haiti's timezone
    // The safest way is to use a locale that we know returns full weekday names
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Port-au-Prince',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        weekday: 'long',
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    const dateMap: Record<string, string> = {};
    parts.forEach(p => { dateMap[p.type] = p.value; });


    // Weekday normalization
    let day = dateMap.weekday;
    if (!day) {
        // Fallback weekday calculation if Intl parts are missing weekday
        const haitiString = now.toLocaleString('en-US', { timeZone: 'America/Port-au-Prince' });
        const haitiDate = new Date(haitiString);
        day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][haitiDate.getDay()];
    }

    const result = {
      day: day, // Should be "Saturday", "Sunday", etc.
      hours: parseInt(dateMap.hour, 10),
      minutes: parseInt(dateMap.minute, 10),
      seconds: parseInt(dateMap.second, 10),
      totalSeconds: (parseInt(dateMap.hour, 10) || 0) * 3600 + (parseInt(dateMap.minute, 10) || 0) * 60 + (parseInt(dateMap.second, 10) || 0),
    };
    return result;
  } catch (e) {
    console.error('[timeUtils] Error in getHaitiTime:', e);
    // Absolute fallback to local time if everything fails
    return {
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      totalSeconds: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(),
    };
  }
}

/**
 * Finds the currently playing program for a station based on Haiti time
 */
export function getCurrentProgram(programs: Program[], stationId: string) {
  const haiti = getHaitiTime();
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
