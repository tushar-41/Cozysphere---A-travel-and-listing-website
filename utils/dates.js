const DAY_MS = 24 * 60 * 60 * 1000;

// Parses "YYYY-MM-DD" into a UTC-midnight Date, or null if invalid.
function parseDay(str) {
    if (typeof str !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const d = new Date(`${str}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== str ? null : d;
}

function todayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function nightsBetween(checkIn, checkOut) {
    return Math.round((checkOut - checkIn) / DAY_MS);
}

module.exports = { parseDay, todayUTC, nightsBetween, DAY_MS };
