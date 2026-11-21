import {limits,inspectFiles,makeManifest,parseManifest,compareFiles,duplicateGroups} from './integrity-core.mjs';
const $=id=>document.getElementById(id);
const words={
it:{none:'Nessun file selezionato.',selected:' file selezionati.',loaded:'Registro importato: ',progress:'Elaborazione locale: ',ready:'File elaborati: ',invalid:'Errore: ',empty:'Nessun risultato.',good:'Identico',missing:'Mancante',size_mismatch:'Dimensione diversa',hash_mismatch:'Impronta diversa',extra:'Aggiunto',dups:'Gruppi di duplicati: ',download:'Registro scaricato.',report:'Esito scaricato.',notLoaded:'Nessun registro importato.',summary:'Identici: ',compare:', mancanti: ',badSize:', dimensioni diverse: ',badHash:', impronte diverse: ',extraCount:', aggiunti: '},
en:{none:'No files selected.',selected:' files selected.',loaded:'Manifest loaded: ',progress:'Local processing: ',ready:'Files processed: ',invalid:'Error: ',empty:'No results.',good:'Match',missing:'Missing',size_mismatch:'Size mismatch',hash_mismatch:'Hash mismatch',extra:'Extra',dups:'Duplicate groups: ',download:'Manifest downloaded.',report:'Report downloaded.',notLoaded:'No manifest loaded.',summary:'Matches: ',compare:', missing: ',badSize:', size mismatch: ',badHash:', hash mismatch: ',extraCount:', extra: '}
};
let lang='it',selected=[],records=[],manifest=null,report=null,busy=false;
const txt=(id,v)=>{$(id).textContent=v};
const tr=()=>words[lang];
function actions(){ $('calculate').disabled=busy||!selected.length;$('reset').disabled=busy;$('exportManifest').disabled=busy||!records.length;$('verify').disabled=busy||!records.length||!manifest;$('exportReport').disabled=busy||!report;}
function selectFiles(files){
 if(busy)return;selected=Array.from(files||[]);records=[];report=null;
 txt('selection',selected.length?selected.length+tr().selected:tr().none);txt('summary',tr().empty);txt('duplicates','');
 $('rows').replaceChildren();$('bar').style.width='0%';$('progress').setAttribute('aria-valuenow','0');actions();
}
function draw(items){
 $('rows').replaceChildren();
 if(!items.length){const r=document.createElement('tr'),c=document.createElement('td');c.colSpan=4;c.textContent=tr().empty;r.append(c);$('rows').append(r);return;}
 for(const row of items){
  const r=document.createElement('tr'),state=row.status?(row.status==='match'?tr().good:tr()[row.status]):'—';
  for(const v of [row.name,String(row.size??'—'),row.sha256||row.actual||'—',state]){
   const c=document.createElement('td');c.textContent=v;
   if(/^[0-9a-f]{64}$/.test(v))c.classList.add('hash');
   if(row.status==='match'&&v===state)c.classList.add('ok');
   if(row.status&&row.status!=='match'&&v===state)c.classList.add('bad');
   r.append(c);
  }$('rows').append(r);
 }
}
function save(name,value){
 const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function calculate(){
 if(busy||!selected.length)return;busy=true;actions();report=null;records=[];
 try{
  records=await inspectFiles(selected,globalThis.crypto,(n,total)=>{
   txt('summary',tr().progress+n+'/'+total);const pct=Math.round(100*n/total);$('bar').style.width=pct+'%';$('progress').setAttribute('aria-valuenow',String(pct));
  });
  txt('summary',tr().ready+records.length);draw(records);const groups=duplicateGroups(records);
  txt('duplicates',groups.length?tr().dups+groups.map(g=>g.join(', ')).join(' | '):'');
 }catch(e){records=[];txt('summary',tr().invalid+e.message);draw([]);}
 finally{busy=false;actions();}
}
async function loadManifest(file){
 if(busy||!file)return;
 try{if(file.size>limits.maxManifestBytes)throw new Error('Manifest too large');manifest=parseManifest(await file.text());report=null;txt('manifestStatus',tr().loaded+manifest.files.length+' · '+manifest.createdAt);}
 catch(e){manifest=null;report=null;txt('manifestStatus',tr().invalid+e.message)}actions();
}
function resultSummary(counts){return tr().summary+counts.match+tr().compare+counts.missing+tr().badSize+counts.size_mismatch+tr().badHash+counts.hash_mismatch+tr().extraCount+counts.extra;}
function verify(){
 if(busy||!records.length||!manifest)return;
 try{
  const output=compareFiles(manifest,records);
  report={format:'dark-aronte-integrity-report',version:1,comparedAt:new Date().toISOString(),manifestCreatedAt:manifest.createdAt,ok:output.ok,summary:output.counts,results:output.rows};
  draw(output.rows.map(r=>({...r,size:records.find(x=>x.name===r.name)?.size??'—',sha256:r.actual||'—'})));
  txt('summary',resultSummary(output.counts));
 }catch(e){report=null;txt('summary',tr().invalid+e.message)}actions();
}
function changeLanguage(next){
 lang=next;document.documentElement.lang=lang;
 document.querySelectorAll('[data-it][data-en]').forEach(el=>{el.textContent=el.dataset[lang]});
 document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
 txt('selection',selected.length?selected.length+tr().selected:tr().none);
 txt('manifestStatus',manifest?tr().loaded+manifest.files.length+' · '+manifest.createdAt:tr().notLoaded);
 if(report){txt('summary',resultSummary(report.summary));draw(report.results.map(r=>({...r,size:records.find(x=>x.name===r.name)?.size??'—',sha256:r.actual||'—'})));}
 else if(records.length){txt('summary',tr().ready+records.length);draw(records);}else {txt('summary',tr().empty);draw([]);}
}
$('files').addEventListener('change',ev=>selectFiles(ev.target.files));
$('manifest').addEventListener('change',ev=>loadManifest(ev.target.files?.[0]));
for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,ev=>{ev.preventDefault();$('drop').classList.add('drag')});
for(const event of ['dragleave','drop'])$('drop').addEventListener(event,ev=>{ev.preventDefault();$('drop').classList.remove('drag')});
$('drop').addEventListener('drop',ev=>selectFiles(ev.dataTransfer?.files));
$('calculate').addEventListener('click',calculate);$('verify').addEventListener('click',verify);
$('exportManifest').addEventListener('click',()=>{if(records.length){save('integrity-manifest.json',makeManifest(records));txt('selection',tr().download)}});
$('exportReport').addEventListener('click',()=>{if(report){save('integrity-report.json',report);txt('manifestStatus',tr().report)}});
$('reset').addEventListener('click',()=>{selected=[];records=[];report=null;manifest=null;$('files').value='';$('manifest').value='';txt('manifestStatus',tr().notLoaded);selectFiles([])});
for(const btn of document.querySelectorAll('[data-lang]'))btn.addEventListener('click',()=>changeLanguage(btn.dataset.lang));
draw([]);actions();
