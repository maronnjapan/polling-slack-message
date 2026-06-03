export const nowIso = () => new Date().toISOString();
export const byUpdatedDesc = <T extends { updatedAt: string }>(a: T, b: T) => b.updatedAt.localeCompare(a.updatedAt);
