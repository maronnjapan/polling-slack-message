interface ImportMetaEnv { readonly VITE_API_BASE?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
declare module "*.css" { const content: string; export default content; }
declare module "react/jsx-runtime" { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare module "react-dom/client" { export function createRoot(el: any): { render(node: any): void }; }
