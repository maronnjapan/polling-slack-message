export type ReactNode = any;
export function useState<T>(initial:T): [T,(v:T)=>void] { let value=initial; return [value,(v:T)=>{value=v;}]; }
export function useEffect(_fn:()=>void|(()=>void), _deps?: unknown[]) {}
export const StrictMode = ({children}: {children:any}) => children;
export default { useState, useEffect, StrictMode };
