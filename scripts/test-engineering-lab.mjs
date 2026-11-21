import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const code=readFileSync('software/engineering-lab.mjs','utf8');
const html=readFileSync('engineering-lab.html','utf8');
for(const id of ['nodes','detail','run','export','terminal','result','checks','duration','engine','detailLink'])assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
assert.match(html,/aria-live="polite"/);
assert.match(html,/data-lang="en"/);
assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|innerHTML|eval\s*\(/);
assert.match(readFileSync('index.html','utf8'),/href="\/engineering-lab.html"/);
class El {
 constructor(){this.dataset={};this.textContent='';this.disabled=false;this.children=[];this.attributes={};this.listeners={};this.href='';}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn)}
 async fire(n){for(const fn of this.listeners[n]||[])await fn()}
 setAttribute(k,v){this.attributes[k]=v}
 replaceChildren(...items){this.children=items}
 append(...items){this.children.push(...items)}
 remove(){}
 click(){this.clicked=true}
}
const ids=['nodes','detail','run','export','terminal','result','checks','duration','engine','detailLink','detailTitle','detailBody','detailLimit','terminalPrompt'];
const nodes=['aegis','filecheck','integrity','diff','mirror','elena'].map(id=>{const e=new El();e.dataset.module=id;return e});
const langs=['it','en'].map(id=>{const e=new El();e.dataset.lang=id;return e});
const trans=Array.from({length:3},()=>{const e=new El();e.dataset.it='IT';e.dataset.en='EN';return e});
const elements=Object.fromEntries(ids.map(id=>[id,new El()]));
const document={getElementById:id=>elements[id],querySelectorAll:selector=>selector==='[data-module]'?nodes:selector==='[data-lang]'?langs:selector==='[data-it][data-en]'?trans:[],createElement:()=>new El(),body:new El(),documentElement:{lang:'it'}};
let blob=null;
const URL={createObjectURL:b=>{blob=b;return 'blob:test'},revokeObjectURL:()=>{}};
const context={document,crypto:webcrypto,isSecureContext:true,globalThis:undefined,performance:{now:()=>100},TextEncoder,Uint8Array,Array,Boolean,Blob,Date,URL,console,setTimeout:()=>0};
context.globalThis=context;
vm.runInNewContext(code,context,{filename:'engineering-lab.mjs'});
assert.equal(elements.detailTitle.textContent,'ARONTE AEGIS');
await nodes[3].fire('click');
assert.equal(elements.detailTitle.textContent,'Diff Studio');
assert.equal(elements.detailLink.href,'/diff-studio.html');
await elements.run.fire('click');
assert.equal(elements.checks.textContent,'4 / 4');
assert.equal(elements.export.disabled,false);
assert.equal(elements.run.disabled,false);
await elements.export.fire('click');
assert.ok(blob);
const evidence=JSON.parse(await blob.text());
assert.equal(evidence.checks.length,4);
assert.equal(evidence.checks.every(x=>x.ok),true);
assert.ok(!JSON.stringify(evidence).includes('password'));
await langs[1].fire('click');
assert.equal(document.documentElement.lang,'en');
assert.equal(elements.detailTitle.textContent,'Diff Studio');
assert.match(elements.result.textContent,/Checks completed/);
console.log('ENGINEERING_LAB_TESTS 15 PASS: DOM modules, crypto vector, secure context, export, language, no network, links');
