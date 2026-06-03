type Parser<T> = (v: unknown) => T;
class Schema<T> { constructor(public p: Parser<T>) {} parse(v: unknown): T { return this.p(v); } optional(): Schema<T | undefined> { return new Schema((v) => v === undefined ? undefined : this.parse(v)); } nullable(): Schema<T | null> { return new Schema((v) => v === null ? null : this.parse(v)); } default(d: T): Schema<T> { return new Schema((v) => v === undefined ? d : this.parse(v)); } min(_n: number): this { return this; } }
const str = () => new Schema<string>((v) => String(v));
const bool = () => new Schema<boolean>((v) => Boolean(v));
const num = () => new Schema<number>((v) => Number(v));
const lit = <T extends string | number | boolean | null>(x: T) => new Schema<T>((v) => v as T);
const en = <T extends readonly [string, ...string[]]>(vals: T) => new Schema<T[number]>((v) => vals.includes(v as string) ? v as T[number] : vals[0]);
const arr = <T>(s: Schema<T>) => new Schema<T[]>((v) => Array.isArray(v) ? v.map((x) => s.parse(x)) : []);
const obj = <S extends Record<string, Schema<any>>>(shape: S) => new Schema<{[K in keyof S]: S[K] extends Schema<infer T> ? T : never}>((v) => { const r:any={}; const o:any=v ?? {}; for (const k of Object.keys(shape)) r[k]=shape[k].parse(o[k]); return r; });
export const z = { string: str, boolean: bool, number: num, literal: lit, enum: en, array: arr, object: obj };
export default z;
