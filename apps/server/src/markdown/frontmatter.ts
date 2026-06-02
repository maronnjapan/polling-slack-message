export function frontmatter(data: Record<string, unknown>) { return `---\n${Object.entries(data).filter(([,v])=>v!==undefined).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n`; }
