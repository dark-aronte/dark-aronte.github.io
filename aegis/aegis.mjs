#!/usr/bin/env node
/**
 * ARONTE AEGIS: self-contained static-site CSP generator and security linter.
 * Usage: node aegis/aegis.mjs [--apply] [site-root]
 * Applies only to HTML files listed in the page manifest below.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv.find((v,i)=>i>1&&!v.startsWith('--'))||'.');
const apply=process.argv.includes('--apply');
const files=['index.html','diff-studio.html','integrity-studio.html','identita.html','guide/index.html','digital-mirror.html','filecheck.html','404.html'];
const errors=[];
const hash=s=>"'sha256-"+crypto.createHash('sha256').update(s,'utf8').digest('base64')+"'";
const cssHashes=html=>[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>hash(m[1]));
const jsHashes=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m=>!(/\bsrc\s*=/.test(m[1])) && !(/type\s*=\s*["']application\/ld\+json["']/.test(m[1])))
  .map(m=>hash(m[2]));
function policy(html){
  const scripts=jsHashes(html),styles=cssHashes(html);
  return [
    "default-src 'none'",
    ["script-src","'self'",...scripts].join(' '),
    ["style-src","'self'",...styles].join(' '),
    "style-src-attr 'none'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}
const metaPattern=/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/i;
for(const file of files){
 const filename=path.join(root,file);
 if(!fs.existsSync(filename)){errors.push('File missing '+file);continue}
 let html=fs.readFileSync(filename,'utf8');
 if(/\son(?:click|load|error|mouseover|focus|submit|input|change)\s*=/i.test(html))errors.push('Inline event handler '+file);
 if(/\sstyle\s*=/i.test(html))errors.push('Inline style attribute '+file);
 if(/<iframe\b|<object\b|<embed\b/i.test(html))errors.push('Embedded element '+file);
 if(/(?:src|href)\s*=\s*["']http:\/\//i.test(html))errors.push('Insecure resource '+file);
 const p=policy(html);
 const tag='<meta http-equiv="Content-Security-Policy" content="'+p+'">';
 if(apply){
   if(metaPattern.test(html))html=html.replace(metaPattern,tag);
   else if(/<head[^>]*>/i.test(html))html=html.replace(/<head[^>]*>/i,m=>m+tag);
   else errors.push('Missing HTML head '+file);
   fs.writeFileSync(filename,html,'utf8');
 }
 if(!metaPattern.test(html)||!html.match(metaPattern)[0].includes(p))errors.push('Missing or outdated CSP '+file);
 console.log((errors.some(x=>x.endsWith(file))?'FAIL ':'PASS ')+file);
}
if(errors.length){console.error('AEGIS POLICY FAILED:\n'+errors.join('\n'));process.exitCode=1;}
else console.log('ARONTE AEGIS security profile validated across '+files.length+' pages.');
