#!/usr/bin/env node
/**
 * ARONTE AEGIS TRUSTPRINT v1
 * Detached Ed25519 signatures over deterministic JSON manifest bytes.
 * Verification can be performed locally or over HTTPS from an independently held CLI/key.
 * Node.js 20+, no third-party dependencies or telemetry.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const paths=['index.html','identita.html','guide/index.html','digital-mirror.html','filecheck.html','404.html','editoriale.css','editoriale.js','assets/dark-aronte.webp','software/catalog.json','sitemap.xml','robots.txt','aegis/aegis.mjs','aegis/aegis.svg','aegis-system/index.html','aegis-system/style.css'];
const root=process.cwd();
const manifestPath=path.join(root,'aegis','trustprint-manifest.json');
const signaturePath=path.join(root,'aegis','trustprint-signature.txt');
const publicPath=path.join(root,'aegis','trustprint-public.pem');
const keyDir=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.config'),'DarkAronte','AEGIS-Trustprint');
const privatePath=path.join(keyDir,'signing-private.pem');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message)};
const expectedPaths=()=>paths.slice().sort();
const noSymlinks=p=>{if(fs.lstatSync(p).isSymbolicLink())fail('Symbolic link rejected: '+p)};
function manifestForFiles(){
 const entries={};
 for(const relative of expectedPaths()){
  const absolute=path.join(root,relative);
  if(!fs.existsSync(absolute))fail('Missing signed asset: '+relative);
  noSymlinks(absolute);
  const buf=fs.readFileSync(absolute);
  entries[relative]={sha256:hash(buf),bytes:buf.length};
 }
 return {format:'arontaeigis-trustprint-1',algorithm:'Ed25519',files:entries};
}
function canonical(obj){return JSON.stringify(obj,null,2)+'\n'}
function keygen(){
 if(fs.existsSync(privatePath))fail('A signing key already exists. Refusing to overwrite: '+privatePath);
 fs.mkdirSync(keyDir,{recursive:true,mode:0o700});
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519');
 fs.writeFileSync(privatePath,privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600,flag:'wx'});
 fs.mkdirSync(path.dirname(publicPath),{recursive:true});
 fs.writeFileSync(publicPath,publicKey.export({type:'spki',format:'pem'}));
 console.log('SIGNING_PRIVATE_KEY_LOCAL_ONLY '+privatePath);
 console.log('PUBLIC_KEY_FINGERPRINT_SHA256 '+hash(publicKey.export({type:'spki',format:'der'})));
}
function sign(){
 if(!fs.existsSync(privatePath))fail('Private signing key missing; run keygen securely on the signing computer.');
 if(!fs.existsSync(publicPath))fail('Public key missing.');
 const privateKey=crypto.createPrivateKey(fs.readFileSync(privatePath));
 const publicKey=crypto.createPublicKey(fs.readFileSync(publicPath));
 if(!crypto.verify(null,Buffer.from('aegis-key-check'),publicKey,crypto.sign(null,Buffer.from('aegis-key-check'),privateKey)))fail('Private/public key mismatch');
 const manifest=canonical(manifestForFiles());
 const sig=crypto.sign(null,Buffer.from(manifest),privateKey);
 fs.writeFileSync(manifestPath,manifest);
 fs.writeFileSync(signaturePath,sig.toString('base64')+'\n');
 console.log('SIGNED '+paths.length+' assets. Fingerprint '+hash(publicKey.export({type:'spki',format:'der'})));
}
function inspect(manifestBuffer,signatureBuffer,publicKeyPem){
 const publicKey=crypto.createPublicKey(publicKeyPem);
 const fingerprint=hash(publicKey.export({type:'spki',format:'der'}));
 const bytes=Buffer.from(manifestBuffer);
 const sig=Buffer.from(Buffer.from(signatureBuffer).toString('utf8').trim(),'base64');
 if(sig.length!==64||!crypto.verify(null,bytes,publicKey,sig))fail('INVALID SIGNATURE');
 const manifest=JSON.parse(bytes.toString('utf8'));
 if(canonical(manifest)!==bytes.toString('utf8'))fail('NON-CANONICAL MANIFEST');
 if(manifest.format!=='arontaeigis-trustprint-1'||manifest.algorithm!=='Ed25519')fail('UNSUPPORTED MANIFEST FORMAT');
 const keys=Object.keys(manifest.files||{}).sort();
 if(JSON.stringify(keys)!==JSON.stringify(expectedPaths()))fail('UNEXPECTED FILE LIST');
 return {fingerprint,files:manifest.files};
}
function verifyLocal(){
 const {fingerprint,files}=inspect(fs.readFileSync(manifestPath),fs.readFileSync(signaturePath),fs.readFileSync(publicPath));
 for(const [name,meta] of Object.entries(files)){
  const data=fs.readFileSync(path.join(root,name));
  if(hash(data)!==meta.sha256||data.length!==meta.bytes)fail('FILE HASH MISMATCH '+name);
 }
 console.log('TRUSTPRINT VERIFIED LOCALLY '+Object.keys(files).length+' files; key '+fingerprint);
}
async function verifyLive(args){
 const origin=args[0]||'https://dark-aronte.github.io';
 const expectedKey=args[1];
 if(!origin.startsWith('https://'))fail('HTTPS required');
 // The expected key is read from the verifier's LOCAL public key, NOT downloaded from the site.
 if(!fs.existsSync(publicPath))fail('Pin public key locally before verification');
 const pub=fs.readFileSync(publicPath);
 const fingerprint=hash(crypto.createPublicKey(pub).export({type:'spki',format:'der'}));
 if(expectedKey&&expectedKey.toLowerCase()!==fingerprint)fail('PINNED KEY FINGERPRINT MISMATCH');
 const get=async p=>{
  const res=await fetch(new URL('/'+p,origin),{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!res.ok)fail('HTTP '+res.status+' for '+p);
  return Buffer.from(await res.arrayBuffer());
 };
 const manifest=await get('aegis/trustprint-manifest.json');
 const signature=await get('aegis/trustprint-signature.txt');
 const inspected=inspect(manifest,signature,pub);
 for(const [name,meta] of Object.entries(inspected.files)){
  const body=await get(name);
  if(hash(body)!==meta.sha256||body.length!==meta.bytes)fail('LIVE FILE MISMATCH '+name);
 }
 console.log('TRUSTPRINT VERIFIED LIVE '+Object.keys(inspected.files).length+' files; pinned key '+fingerprint);
}
const [command,...args]=process.argv.slice(2);
try{
 if(command==='keygen')keygen();
 else if(command==='sign')sign();
 else if(command==='verify')verifyLocal();
 else if(command==='verify-live')await verifyLive(args);
 else fail('Usage: node trustprint.mjs keygen | sign | verify | verify-live [https://site] [pinned-fingerprint]');
}catch(error){console.error('TRUSTPRINT ERROR:',error.message);process.exitCode=1}
