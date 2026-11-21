import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from '../software/diff-core.mjs';
const elements=new Map();
class Element {
 constructor(){this.value='';this.textContent='';this.dataset={};this.checked=false;this.disabled=false;this.children=[];this.listeners={};this.className='';this.attrs={};this._htmlTouched=false;}
 set innerHTML(_){this._htmlTouched=true;throw Error('Unsafe HTML injection');}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 async fire(type,payload={}){for(const fn of this.listeners[type]||[])await fn({target:this,...payload})}
 append(...n){this.children.push(...n)}
 replaceChildren(...n){this.children=n}
 setAttribute(k,v){this.attrs[k]=v}
 remove(){}
 click(){this.clicked=true}
}
const ids=['left','right','leftFile','rightFile','ignoreWhitespace','ignoreCase','compare','exportJson','exportPatch','clear','status','summary','diff'];
for(const id of ids)elements.set(id,new Element());
for(const id of ['exportJson','exportPatch'])elements.get(id).disabled=true;
const langs=['it','en'].map(lang=>{const e=new Element();e.dataset.lang=lang;return e});
const translated=Array.from({length:5},()=>{const e=new Element();e.dataset.it='IT';e.dataset.en='EN';return e});
const document={getElementById:id=>elements.get(id),querySelectorAll:q=>q==='[data-lang]'?langs:q==='[data-it][data-en]'?translated:[],createElement:()=>new Element(),body:new Element(),documentElement:{lang:'it'}};
const downloads=[];
const URL={createObjectURL:blob=>{downloads.push(blob);return 'blob:test'},revokeObjectURL:()=>{}};
const script=fs.readFileSync('software/diff-ui.mjs','utf8').replace(/^import .* from '\.\/diff-core\.mjs';\r?\n/,"const {DIFF_LIMITS,compareText,unifiedDiff}=__core;\n");
assert.doesNotMatch(script,/^import /m);
vm.runInNewContext(script,{__core:core,document,URL,Blob,Date,console,TextEncoder,setTimeout:()=>0}, {filename:'diff-ui.mjs'});
const el=id=>elements.get(id);
assert.equal(el('exportJson').disabled,true);
el('left').value='<img src=x onerror=alert(1)>\none';
el('right').value='<img src=x onerror=alert(1)>\ntwo';
await el('compare').fire('click');
assert.equal(el('exportJson').disabled,false);
assert.equal(el('exportPatch').disabled,false);
assert.ok(el('diff').children.length>0);
assert.ok(el('diff').children.some(r=>r.children.some(c=>c.textContent.includes('<img'))));
await el('exportJson').fire('click');
await el('exportPatch').fire('click');
assert.equal(downloads.length,2);
assert.match(await downloads[0].text(),/"counts"/);
assert.match(await downloads[1].text(),/@@/);
await langs[1].fire('click');
assert.equal(document.documentElement.lang,'en');
el('left').value='a';el('right').value='a';
await el('compare').fire('click');
assert.match(el('status').textContent,/No differences/);
await el('clear').fire('click');
assert.equal(el('exportJson').disabled,true);
assert.equal(el('left').value,'');
assert.equal(el('diff').children.length,1);
const f={name:'chapter.md',type:'text/markdown',size:7,text:async()=>'text\nOK'};
el('leftFile').files=[f];await el('leftFile').fire('change',{target:el('leftFile')});
assert.equal(el('left').value,'text\nOK');
assert.match(el('status').textContent,/Loaded file/);
const unsafe={name:'malware.exe',type:'application/octet-stream',size:3,text:async()=>'abc'};
el('leftFile').files=[unsafe];await el('leftFile').fire('change',{target:el('leftFile')});
assert.match(el('status').textContent,/Unsupported file/);
console.log('DIFF_INTERFACE_TESTS 11 PASS: DOM events, diff, safe text, export JSON+patch, languages, equal, reset, file import, blocked format');
