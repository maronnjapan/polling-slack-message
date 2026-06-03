#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const [file,...args]=process.argv.slice(2); if(!file){process.exit(0)}
const r=spawnSync('node',['--experimental-strip-types',file,...args],{stdio:'inherit'}); process.exit(r.status ?? 1);
