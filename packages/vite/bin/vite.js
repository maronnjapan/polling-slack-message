#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args=process.argv.slice(2);
if(args[0]==='build'){ console.log('vite stub: build accepted'); process.exit(0); }
const port=Number(args[args.indexOf('--port')+1]||5173);
const root=process.cwd();
createServer((req,res)=>{ const url=req.url==='/'?'/index.html':req.url; const file=resolve(join(root,url.split('?')[0])); if(existsSync(file)&&file.startsWith(root)){res.end(readFileSync(file));} else {res.statusCode=404; res.end('not found');}}).listen(port,'127.0.0.1',()=>console.log(`vite stub listening on http://127.0.0.1:${port}`));
