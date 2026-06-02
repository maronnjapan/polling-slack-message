import type { ReactNode } from "react";
export function Layout({children,navigate}:{children:ReactNode;navigate:(p:string)=>void}){ return <><header className="top"><button onClick={()=>navigate("/")}>Inbox</button><button onClick={()=>navigate("/settings")}>Settings</button><strong>Slack MCP 問い合わせ支援</strong><span>Slackへ自動返信しません</span></header><main>{children}</main></>; }
