declare const process: any;
declare module "node:fs" { export const promises: any; }
declare module "node:path" { const path: any; export default path; export function join(...parts:string[]): string; export function resolve(...parts:string[]): string; export function dirname(p:string): string; export function relative(from:string,to:string): string; export function normalize(p:string): string; export function isAbsolute(p:string): boolean; export const sep: string; }
declare module "node:url" { export function fileURLToPath(url: string | URL): string; }
declare module "node:child_process" { export function spawn(cmd:string,args?:string[],opts?:any): any; }
declare module "node:crypto" { export function randomUUID(): string; }
