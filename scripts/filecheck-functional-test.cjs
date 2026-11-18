const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
const html=fs.readFileSync(path.join(process.cwd(),'filecheck.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const all=new Map();
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.dataset={};this.disabled=false;this.value='';this._text='';this._class=new Set();this.classList={add:(x)=>this._class.add(x),remove:(x)=>this._class.delete(x),toggle:(x,v)=>{if(v===undefined)v=!this._class.has(x);v?this._class.add(x):this._class.delete(x)},contains:(x)=>this._class.has(x)};this.style={};}
 set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(x=>x.textContent).join('')}
 set innerHTML(v){this._text=v;this.children=[]}get innerHTML(){return this._text}
 append(...elements){this.children.push(...elements)}appendChild(e){this.children.push(e);return e}
 replaceChildren(...e){this.children=e}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
 async fire(name,payload={}){for(const fn of this.listeners[name]||[])await fn({preventDefault(){},...payload})}
 setAttribute(k,v){this.attrs[k]=v}
 get className(){return this._class.values().next().value??''}set className(v){this._class=new Set(v.split(' '))}
 click(){return this.fire('click')}
 remove(){}
}
const ids=['files','drop','calculate','results','expected','compare','duplicates','export','resultsWrap','status','bar','barFill','clear','counter','comparison','year'];
ids.forEach(id=>all.set(id,new Element()));
const languages=['it','en'].map(lang=>{const e=new Element('button');e.dataset.lang=lang;return e});
const translated=[...html.matchAll(/data-t="([^"]+)"/g)].map(x=>{const e=new Element();e.dataset.t=x[1];return e});
const document={getElementById:id=>all.get(id),querySelectorAll:q=>q==='[data-lang]'?languages:q==='[data-t]'?translated:[],createElement:tag=>new Element(tag),body:new Element('body'),documentElement:{lang:'it'}};
let blobCreated=null,downloaded=false;const URL={createObjectURL:(b)=>{blobCreated=b;return 'blob:test'},revokeObjectURL:()=>{}};
const original=all.get('files');const a=Buffer.from('first test file'),b=Buffer.from('second file');
const make=(name,buf)=>({name,size:buf.length,arrayBuffer:async()=>Uint8Array.from(buf).buffer});
const context={document,navigator:{clipboard:{writeText:async()=>{}}},crypto:crypto.webcrypto,Array,Map,Promise,Blob,URL,Date,console,setTimeout:(fn)=>{fn();return 0},innerWidth:800,Event};
vm.runInNewContext(script,context);
(async()=>{
 original.files=[make('a.txt',a),make('copy.txt',a),make('b.txt',b)];
 await original.fire('change');
 if(all.get('calculate').disabled)throw Error('CALCULATE BUTTON INCORRECTLY DISABLED');
 await all.get('calculate').fire('click');
 const rows=all.get('results').children;
 const expected=crypto.createHash('sha256').update(a).digest('hex');
 if(rows.length!==3)throw Error('ROW COUNT '+rows.length);
 const hashes=rows.map(tr=>tr.children[2].textContent);
 if(hashes[0]!==expected||hashes[1]!==expected||hashes[2]===expected)throw Error('SHA-256 INCORRECT');
 if(!all.get('duplicates').textContent.includes('1 grupp'))throw Error('DUPLICATES MISSED');
 all.get('expected').value=expected;await all.get('expected').fire('input');
 if(!all.get('comparison').textContent.includes('Corrispondenza'))throw Error('MATCH CHECK FAILED');
 all.get('expected').value='0'.repeat(64);await all.get('compare').fire('click');
 if(!all.get('comparison').textContent.includes('diversa'))throw Error('MISMATCH CHECK FAILED');
 await all.get('export').fire('click');
 if(!blobCreated)throw Error('EXPORT MISSING');
 await languages[1].fire('click');
 if(document.documentElement.lang!=='en')throw Error('LANG SWITCH FAILED');
 await all.get('clear').fire('click');
 if(all.get('results').children.length)throw Error('CLEAR DID NOT CLEAR RESULTS');
 if(!all.get('calculate').disabled)throw Error('CLEAR DID NOT DISABLE CALCULATE');
 console.log('PASSED: SHA-256 known result; 3 files; duplicate detection; match/mismatch; TXT export; language; reset');
})().catch(e=>{console.error('FUNCTIONAL_TEST_FAILURE',e.stack);process.exitCode=1});
