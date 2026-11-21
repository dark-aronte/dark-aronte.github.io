/* Dark Aronte Engineering Lab. Real local checks; no outgoing API calls. */
const $=id=>document.getElementById(id);
const modules={
 aegis:{name:'ARONTE AEGIS',url:'/aegis-system/',it:['Controlli CSP e registri SHA-256 con firme Ed25519 per verificare versioni autorizzate dei file pubblicati.','La firma prova la corrispondenza ai file firmati, non l’assenza di vulnerabilità. Sistema in sviluppo e collaudo.'],en:['CSP validation and SHA-256 manifests signed with Ed25519 to verify authorized versions of published assets.','A signature proves correspondence to signed files, not absence of vulnerabilities. System under development and testing.']},
 filecheck:{name:'FileCheck',url:'/filecheck.html',it:['Confronto SHA-256 di file locali, ricerca duplicati ed esportazione TXT.','L’impronta non è una scansione antivirus e non identifica l’autore.'],en:['Local SHA-256 file hashes, duplicate detection and TXT report export.','A hash is not a malware scan or a proof of authorship.']},
 integrity:{name:'Integrity Studio',url:'/integrity-studio.html',it:['Manifesti JSON SHA-256 e confronto di gruppi di documenti per individuare file alterati, aggiunti o mancanti.','Fino a 50 file e 100 MB per file; il manifesto deve restare in un luogo affidabile.'],en:['SHA-256 JSON manifests and multi-file comparisons for altered, added or missing documents.','Up to 50 files and 100 MB per file; the manifest must be stored somewhere trustworthy.']},
 diff:{name:'Diff Studio',url:'/diff-studio.html',it:['Confronto testuale riga per riga, evidenza di aggiunte e rimozioni, esportazione JSON e patch.','Solo testo leggibile, non file PDF o DOCX binari; sono previsti limiti di dimensione.'],en:['Line-by-line text comparison, additions and deletions with JSON and text-patch export.','Readable text only, not binary PDF or DOCX; file-size limits apply.']},
 mirror:{name:'Digital Mirror',url:'/digital-mirror.html',it:['Laboratorio formativo sulla superficie informativa del browser e sugli inganni digitali.','Non esegue scansioni del dispositivo e non certifica la sicurezza dell’utente.'],en:['Educational lab about browser-exposed information and digital deception.','Does not scan devices or certify user security.']},
 elena:{name:'Elena ADC',url:'https://michelebottino-autor.github.io/adc/elena/',it:['Assistente documentale e informativo per Calatabiano, ideato da Michele Bottino con sviluppo tecnologico Dark Aronte.','Le risposte non sostituiscono uffici pubblici né fonti storiche originali.'],en:['Documentary and information assistant for Calatabiano, conceived by Michele Bottino with technology developed by Dark Aronte.','Answers do not replace public offices or original historical sources.']}
};
const labels={it:{link:'Esplora il progetto',running:'Verifica in esecuzione…',finished:'Verifica conclusa. Esporta il rapporto per conservare i risultati.',errors:'Alcuni controlli non sono stati superati.',unavailable:'Non disponibile',pass:'SUPERATO',fail:'NON SUPERATO',ready:'Pronto. Premi «Esegui verifica».',tests:['Connessione HTTPS / contesto sicuro','Disponibilità API Web Crypto','Vettore SHA-256: abc','Generatore crittografico locale']},
en:{link:'Explore project',running:'Running checks…',finished:'Checks completed. Export the report to preserve results.',errors:'Some checks failed.',unavailable:'Unavailable',pass:'PASS',fail:'FAIL',ready:'Ready. Press “Run checks”.',tests:['HTTPS / secure context','Web Crypto availability','SHA-256 known vector: abc','Local cryptographic random generator']}};
let lang='it',selected='aegis',evidence=null,busy=false;
function language(next){
 lang=next;document.documentElement.lang=next;
 document.querySelectorAll('[data-it][data-en]').forEach(x=>{x.textContent=x.dataset[next]});
 document.querySelectorAll('[data-lang]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.lang===next)));
 select(selected);
 if(evidence)display(evidence);else $('terminalPrompt').textContent=labels[lang].ready;
}
function select(id){
 if(!Object.hasOwn(modules,id))return;
 selected=id;const v=modules[id];
 document.querySelectorAll('[data-module]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.module===id)));
 $('detailTitle').textContent=v.name;$('detailBody').textContent=v[lang][0];$('detailLimit').textContent=v[lang][1];
 $('detailLink').href=v.url;$('detailLink').textContent=labels[lang].link;
}
function appendLine(message,ok){
 const p=document.createElement('p');p.className=ok===null?'muted':ok?'ok':'warn';p.textContent=message;$('terminal').append(p);
}
function display(data){
 $('terminal').replaceChildren();appendLine('[DARK ARONTE] ENGINEERING LAB',null);
 data.checks.forEach((check,i)=>appendLine((check.ok?labels[lang].pass:labels[lang].fail)+' / '+labels[lang].tests[i]+(check.detail?' · '+check.detail:''),check.ok));
 $('checks').textContent=data.checks.filter(x=>x.ok).length+' / '+data.checks.length;
 $('duration').textContent=data.durationMs.toFixed(1);
 $('result').textContent=data.checks.every(x=>x.ok)?labels[lang].finished:labels[lang].errors;
 $('export').disabled=false;
}
async function run(){
 if(busy)return;
 busy=true;$('run').disabled=true;$('export').disabled=true;$('terminal').replaceChildren();appendLine(labels[lang].running,null);
 $('result').textContent=labels[lang].running;
 const start=performance.now(),checks=[];
 const add=(ok,detail='')=>checks.push({ok:Boolean(ok),detail});
 add(globalThis.isSecureContext===true);
 const cryptoOK=Boolean(globalThis.crypto?.subtle?.digest&&globalThis.crypto?.getRandomValues);
 add(cryptoOK);
 let digestOK=false,digestDetail='';
 if(cryptoOK){
  try{
   const data=new TextEncoder().encode('abc');
   const raw=await globalThis.crypto.subtle.digest('SHA-256',data);
   const actual=Array.from(new Uint8Array(raw),x=>x.toString(16).padStart(2,'0')).join('');
   digestOK=actual==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
   digestDetail=digestOK?'SHA-256':'digest mismatch';
  }catch{digestDetail='digest unavailable'}
 }
 add(digestOK,digestDetail);
 let randomOK=false;
 if(cryptoOK){try{const first=new Uint8Array(32),second=new Uint8Array(32);crypto.getRandomValues(first);crypto.getRandomValues(second);randomOK=first.some(x=>x!==0)&&second.some(x=>x!==0)&&first.some((x,i)=>x!==second[i]);}catch{}}
 add(randomOK);
 evidence={format:'dark-aronte-engineering-evidence',version:1,createdAt:new Date().toISOString(),durationMs:Math.round((performance.now()-start)*1000)/1000,checks,scope:'local browser capability checks; no remote scanning'};
 busy=false;$('run').disabled=false;display(evidence);
}
function exportEvidence(){
 if(!evidence)return;
 const blob=new Blob([JSON.stringify(evidence,null,2)+'\n'],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='dark-aronte-engineering-evidence.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
for(const btn of document.querySelectorAll('[data-module]'))btn.addEventListener('click',()=>select(btn.dataset.module));
for(const btn of document.querySelectorAll('[data-lang]'))btn.addEventListener('click',()=>language(btn.dataset.lang));
$('run').addEventListener('click',run);$('export').addEventListener('click',exportEvidence);
select(selected);
