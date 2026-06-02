const redact = (v: unknown) =>
  String(v).replace(/(sk-[A-Za-z0-9_-]+|xox[a-z]-[A-Za-z0-9-]+|Bearer\s+\S+)/g, "[REDACTED]");
export const logger = {
  info: (...a: unknown[]) => console.log(...a.map(redact)),
  warn: (...a: unknown[]) => console.warn(...a.map(redact)),
  error: (...a: unknown[]) => console.error(...a.map(redact)),
};
