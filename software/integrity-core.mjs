/* Dark Aronte Integrity Studio — deterministic local integrity manifests.
 * Pure functions for browser and Node testing; no network, no persistence.
 */
const HASH=/^[a-f0-9]{64}$/;
const NAME_LIMIT=220;
const MAX_FILES=50;
const MAX_FILE_BYTES=100*1024*1024;
const MAX_MANIFEST_BYTES=256*1024;
export const limits=Object.freeze({maxFiles:MAX_FILES,maxFileBytes:MAX_FILE_BYTES,maxManifestBytes:MAX_MANIFEST_BYTES});
export function safeName(name){
 if(typeof name!=='string'||!name.length||name.length>NAME_LIMIT||/[\\/\u0000-\u001f\u007f]/.test(name)||name==='.'||name==='..')throw new Error('Invalid file name');
 return name;
}
export function hex(buffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');}
export async function hashFile(file,cryptoApi=globalThis.crypto){
 if(!file||typeof file.arrayBuffer!=='function'||!Number.isSafeInteger(file.size)||file.size<0||file.size>MAX_FILE_BYTES)throw new Error('File exceeds allowed size or is invalid');
 safeName(file.name);
 if(!cryptoApi?.subtle?.digest)throw new Error('Secure browser with Web Crypto required');
 const data=await file.arrayBuffer();
 if(data.byteLength!==file.size)throw new Error('File changed while reading');
 return {name:file.name,size:file.size,sha256:hex(await cryptoApi.subtle.digest('SHA-256',data))};
}
export async function inspectFiles(files,cryptoApi=globalThis.crypto,onProgress=()=>{}){
 const items=Array.from(files||[]);
 if(!items.length||items.length>MAX_FILES)throw new Error('Select between 1 and 50 files');
 const names=new Set(),result=[];
 for(const file of items){
   const name=safeName(file.name);
   if(names.has(name))throw new Error('Duplicate file name: '+name);
   names.add(name);
 }
 for(let i=0;i<items.length;i++){
  result.push(await hashFile(items[i],cryptoApi));
  onProgress(i+1,items.length);
 }
 return result.sort((a,b)=>a.name.localeCompare(b.name,'en'));
}
export function makeManifest(records,createdAt=new Date().toISOString()){
 if(!Array.isArray(records)||!records.length||records.length>MAX_FILES)throw new Error('Invalid file list');
 const seen=new Set(),files=[];
 for(const r of records){
  safeName(r?.name);
  if(seen.has(r.name)||!Number.isSafeInteger(r.size)||r.size<0||r.size>MAX_FILE_BYTES||!HASH.test(r.sha256))throw new Error('Invalid file record');
  seen.add(r.name);
  files.push({name:r.name,size:r.size,sha256:r.sha256});
 }
 if(!Number.isFinite(Date.parse(createdAt))||typeof createdAt!=='string')throw new Error('Invalid timestamp');
 files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
 return {format:'dark-aronte-integrity-manifest',version:1,algorithm:'SHA-256',createdAt,files};
}
export function parseManifest(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).byteLength>MAX_MANIFEST_BYTES)throw new Error('Manifest too large');
 let j;try{j=JSON.parse(input)}catch{throw new Error('Invalid JSON')}
 if(!j||j.format!=='dark-aronte-integrity-manifest'||j.version!==1||j.algorithm!=='SHA-256'||!Array.isArray(j.files))throw new Error('Unsupported manifest');
 return makeManifest(j.files,j.createdAt);
}
export function compareFiles(manifest,observed){
 if(!manifest||!Array.isArray(manifest.files)||!Array.isArray(observed))throw new Error('Missing comparison input');
 const expected=new Map(manifest.files.map(r=>[r.name,r]));
 const actual=new Map(observed.map(r=>[r.name,r]));
 const rows=[];
 for(const exp of manifest.files){
  const found=actual.get(exp.name);
  rows.push({name:exp.name,status:!found?'missing':exp.size!==found.size?'size_mismatch':exp.sha256!==found.sha256?'hash_mismatch':'match',expected:exp.sha256,actual:found?.sha256||null});
 }
 for(const obs of observed)if(!expected.has(obs.name))rows.push({name:obs.name,status:'extra',expected:null,actual:obs.sha256});
 rows.sort((a,b)=>a.name.localeCompare(b.name,'en'));
 const counts={match:0,missing:0,size_mismatch:0,hash_mismatch:0,extra:0};
 for(const row of rows)counts[row.status]++;
 return {ok:counts.match===manifest.files.length&&counts.extra===0,counts,rows};
}
export function duplicateGroups(records){
 const map=new Map();
 for(const r of records){const k=r.size+':'+r.sha256;map.set(k,[...(map.get(k)||[]),r.name])}
 return [...map.values()].filter(g=>g.length>1);
}
