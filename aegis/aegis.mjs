#!/usr/bin/env node
/**
 * ARONTE AEGIS — static-site defense profile.
 * No dependencies, no telemetry. Usage: node aegis/aegis.mjs [--apply] [directory]
 * --apply writes CSP meta tags; default validates without changes.
 * HTTP response headers, WAF, DDoS mitigation, authentication and infrastructure
 * hardening must be configured separately at the hosting/CDN provider.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv.find((a,i)=>i>1&&!a.startsWith('--'))||'.');
const apply=process.argv.includes('--apply');
const pages=['index.html','identita.html','guide/index.html','digital-mirror.html','filecheck.html','404.html'];
const failures=[];
const sha=s=>"'sha256-"+crypto.createHash('sha256').update(s,'utf8').digest('base64')+"'";
const csp=(html)=>{
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!(/\bsrc\s*=/.test(m[1])) && !(/type\s*=\s*["']application\/ld\+json["']/.test(m[1])))
    .map(m=>sha(m[2]));
  const rules=[
    "default-src 'none'",
    "script-src 'self' "+scripts.join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];
  return rules.join('; ').replace(/script-src 'self'\s*;/,'script-src \'self\';');
};
for(const file of pages){
  const p=path.join(root,file);
  if(!fs.existsSync(p)){failures.push('Missing '+file);continue}
  let html=fs.readFileSync(p,'utf8');
  const policy=csp(html);
  const meta='<meta http-equiv="Content-Security-Policy" content="'+policy+'">';
  const old=/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/i;
  if(apply){
    if(old.test(html))html=html.replace(old,meta);
    else if(/<head[^>]*>/i.test(html))html=html.replace(/<head[^>]*>/i,m=>m+meta);
    else{failures.push('Missing head '+file);continue}
    fs.writeFileSync(p,html);
  }
  const actual=html.match(old)?.[0];
  if(!actual||!actual.includes(policy))failures.push('CSP missing or stale '+file);
  if(/\bon[a-z]+\s*=/i.test(html))failures.push('Inline event handler '+file);
  if(/(?:src|href)\s*=\s*["']http:\/\//i.test(html))failures.push('HTTP resource '+file);
  if(/<iframe\b|<object\b|<embed\b/i.test(html))failures.push('Unexpected embedded content '+file);
  console.log((failures.some(x=>x.endsWith(file))?'FAIL':'OK')+' '+file);
}
if(failures.length){console.error('AEGIS CHECK FAILED:\n'+failures.join('\n'));process.exitCode=1}
else console.log('ARONTE AEGIS: '+pages.length+' pages checked; CSP hashes current.');
