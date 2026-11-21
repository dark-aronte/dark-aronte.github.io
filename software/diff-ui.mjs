import {DIFF_LIMITS,compareText,unifiedDiff} from './diff-core.mjs';
const $=id=>document.getElementById(id);
const dictionary={
 it:{start:'Inserisci due testi per iniziare.',ready:'Confronto completato.',clear:'Nessun confronto eseguito.',same:'Nessuna differenza nelle condizioni di confronto selezionate.',different:'I documenti presentano differenze.',error:'Errore: ',added:'Righe aggiunte: ',removed:'Righe eliminate: ',unchanged:'Righe invariate: ',newline:'Le terminazioni di riga finali differiscono.',loaded:'File importato: ',unsupported:'File non supportato: seleziona testo semplice.',limit:'File superiore a 1 MB.',noText:'Inserisci almeno un documento.',normalized:'Confronto normalizzato: potrebbero esserci differenze ignorate.'},
 en:{start:'Enter two texts to begin.',ready:'Comparison completed.',clear:'No comparison yet.',same:'No differences under selected comparison options.',different:'Documents contain differences.',error:'Error: ',added:'Added lines: ',removed:'Removed lines: ',unchanged:'Unchanged lines: ',newline:'Terminal newline differs.',loaded:'Loaded file: ',unsupported:'Unsupported file: select plain text.',limit:'File exceeds 1 MB.',noText:'Enter at least one document.',normalized:'Normalized comparison: ignored differences may remain.'}
};
let lang='it',result=null,leftName='original.txt',rightName='revised.txt';
const tr=()=>dictionary[lang],status=s=>{$('status').textContent=s};
function download(name,content,type){
 const b=new Blob([content],{type}),url=URL.createObjectURL(b);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function clearResult(){
 result=null;$('summary').replaceChildren();$('diff').replaceChildren();
 const n=document.createElement('div');n.className='line none';n.textContent=tr().clear;$('diff').append(n);
 $('exportJson').disabled=true;$('exportPatch').disabled=true;
}
function view(){
 if(!result)return;
 const sum=$('summary');sum.replaceChildren();
 for(const value of [tr().added+result.counts.added,tr().removed+result.counts.removed,tr().unchanged+result.counts.unchanged]){
  const cell=document.createElement('span');cell.textContent=value;sum.append(cell);
 }
 const container=$('diff');container.replaceChildren();
 for(const op of result.operations){
  const line=document.createElement('div');line.className='line '+(op.type==='insert'?'ins':op.type==='delete'?'del':'eq');
  for(const val of [op.oldLine??'',op.newLine??'',(op.type==='insert'?'+ ':op.type==='delete'?'- ':'  ')+op.text]){
   const cell=document.createElement('span');cell.textContent=String(val);cell.className=typeof val==='number'||val===''?'num':'content';line.append(cell);
  }container.append(line);
 }
 if(!result.operations.length){const n=document.createElement('div');n.className='line none';n.textContent=tr().same;container.append(n)}
 let message=tr().ready+' '+(result.counts.added||result.counts.removed?tr().different:tr().same);
 if(!result.sameContent&&!(result.counts.added||result.counts.removed))message+=' '+tr().normalized;
 if(result.left.finalNewline!==result.right.finalNewline)message+=' '+tr().newline;
 status(message);
 $('exportJson').disabled=false;$('exportPatch').disabled=false;
}
function compare(){
 const left=$('left').value,right=$('right').value;
 if(!left&&!right){clearResult();status(tr().noText);return}
 try{
  result=compareText(left,right,{ignoreWhitespace:$('ignoreWhitespace').checked,ignoreCase:$('ignoreCase').checked});
  view();
 }catch(err){clearResult();status(tr().error+err.message)}
}
async function readFile(file,side){
 if(!file)return;
 const allow=/\.(txt|md|csv|json|xml|html|htm)$/i;
 if(!allow.test(file.name)||(!file.type.startsWith('text/')&&file.type&&!['application/json','application/xml'].includes(file.type))){status(tr().unsupported);return}
 if(file.size>DIFF_LIMITS.maxBytes){status(tr().limit);return}
 try{
  const text=await file.text();
  if(new TextEncoder().encode(text).byteLength>DIFF_LIMITS.maxBytes)throw new RangeError('Text exceeds 1 MiB');
  $(side).value=text;side==='left'?(leftName=file.name):(rightName=file.name);
  clearResult();status(tr().loaded+file.name);
 }catch(err){status(tr().error+err.message)}
}
function changeLanguage(next){
 lang=next;document.documentElement.lang=next;
 document.querySelectorAll('[data-it][data-en]').forEach(el=>el.textContent=el.dataset[next]);
 document.querySelectorAll('[data-lang]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.lang===next)));
 if(result)view();else status(tr().start);
}
$('compare').addEventListener('click',compare);
$('exportJson').addEventListener('click',()=>{if(result)download('dark-aronte-diff-report.json',JSON.stringify({leftName,rightName,createdAt:new Date().toISOString(),...result},null,2)+'\n','application/json;charset=utf-8')});
$('exportPatch').addEventListener('click',()=>{if(result)download('dark-aronte-diff.patch',unifiedDiff(result,{leftName,rightName}), 'text/plain;charset=utf-8')});
$('clear').addEventListener('click',()=>{for(const id of ['left','right','leftFile','rightFile'])$(id).value='';$('ignoreWhitespace').checked=false;$('ignoreCase').checked=false;leftName='original.txt';rightName='revised.txt';clearResult();status(tr().start)});
$('leftFile').addEventListener('change',ev=>readFile(ev.target.files?.[0],'left'));
$('rightFile').addEventListener('change',ev=>readFile(ev.target.files?.[0],'right'));
for(const id of ['left','right','ignoreWhitespace','ignoreCase'])$(id).addEventListener('input',()=>{clearResult();status(tr().start)});
for(const btn of document.querySelectorAll('[data-lang]'))btn.addEventListener('click',()=>changeLanguage(btn.dataset.lang));
