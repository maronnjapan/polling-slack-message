export const nowIso = () => new Date().toISOString();
export const hoursAgoIso = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
export const yyyyMm = (iso = nowIso()) => { const d = new Date(iso); return { year: String(d.getUTCFullYear()), month: String(d.getUTCMonth()+1).padStart(2,"0") }; };
