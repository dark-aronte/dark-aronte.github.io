/* Dark Aronte Diff Studio — offline line comparison.
 * Deterministic line-oriented edit script. No network, storage or dynamic execution.
 */
export const DIFF_LIMITS=Object.freeze({maxBytes:1048576,maxLines:1600,maxCells:2600000});
export function normalizeText(source){
 if(typeof source!=='string')throw new TypeError('Expected text');
 if(new TextEncoder().encode(source).byteLength>DIFF_LIMITS.maxBytes)throw new RangeError('Text exceeds 1 MiB');
 return source.replace(/\r\n?/g,'\n');
}
export function splitLines(source){
 const normal=normalizeText(source);
 const lines=normal.split('\n');
 // Keep the exact terminal newline in metadata, but exclude trailing empty sentinel.
 const finalNewline=normal.endsWith('\n');
 if(finalNewline)lines.pop();
 if(normal==='')lines.pop();
 if(lines.length>DIFF_LIMITS.maxLines)throw new RangeError('Too many lines');
 return {lines,finalNewline};
}
export function keyFor(line,{ignoreWhitespace=false,ignoreCase=false}={}){
 let result=line;
 if(ignoreWhitespace)result=result.trim().replace(/[ \t]+/g,' ');
 if(ignoreCase)result=result.toLocaleLowerCase('en');
 return result;
}
export function compareText(left,right,options={}){
 const a=splitLines(left),b=splitLines(right),n=a.lines.length,m=b.lines.length;
 if((n+1)*(m+1)>DIFF_LIMITS.maxCells)throw new RangeError('Comparison exceeds processing limit');
 const ak=a.lines.map(s=>keyFor(s,options)),bk=b.lines.map(s=>keyFor(s,options));
 // Dynamic programming LCS: <= 2.56m cells, <= 10.3MB, bounded on all devices.
 const width=m+1,dp=new Uint32Array((n+1)*width);
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--){
  const p=i*width+j;
  dp[p]=ak[i]===bk[j]?1+dp[(i+1)*width+j+1]:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
 }
 let i=0,j=0,leftLine=1,rightLine=1;
 const operations=[];
 while(i<n||j<m){
  if(i<n&&j<m&&ak[i]===bk[j]){
   operations.push({type:'equal',text:a.lines[i],oldLine:leftLine++,newLine:rightLine++});i++;j++;
  }else if(i<n&&(j>=m||dp[(i+1)*width+j]>=dp[i*width+j+1])){
   operations.push({type:'delete',text:a.lines[i],oldLine:leftLine++,newLine:null});i++;
  }else{
   operations.push({type:'insert',text:b.lines[j],oldLine:null,newLine:rightLine++});j++;
  }
 }
 const counts={unchanged:0,added:0,removed:0};
 for(const op of operations)if(op.type==='equal')counts.unchanged++;else if(op.type==='insert')counts.added++;else counts.removed++;
 const sameContent=normalizeText(left)===normalizeText(right);
 return {format:'dark-aronte-text-diff',version:1,options:{ignoreWhitespace:!!options.ignoreWhitespace,ignoreCase:!!options.ignoreCase},left:{lines:n,finalNewline:a.finalNewline},right:{lines:m,finalNewline:b.finalNewline},counts,sameContent,operations};
}
export function unifiedDiff(diff,{leftName='original.txt',rightName='revised.txt',context=3}={}){
 if(!diff||!Array.isArray(diff.operations))throw new Error('Invalid comparison');
 if(!Number.isSafeInteger(context)||context<0||context>20)throw new Error('Invalid context');
 const clean=s=>String(s).replace(/[\r\n\u0000-\u001f\u007f]/g,'_').slice(0,120);
 const ops=diff.operations;
 const changes=[];
 for(let k=0;k<ops.length;k++)if(ops[k].type!=='equal')changes.push(k);
 const out=['--- '+clean(leftName),'+++ '+clean(rightName)];
 if(!changes.length){
  if(diff.left.finalNewline!==diff.right.finalNewline)out.push('# Terminal newline differs');
  return out.join('\n')+'\n';
 }
 const ranges=[];
 for(const c of changes){
  const from=Math.max(0,c-context),to=Math.min(ops.length,c+context+1);
  const prev=ranges[ranges.length-1];
  if(prev&&from<=prev[1])prev[1]=Math.max(prev[1],to);
  else ranges.push([from,to]);
 }
 for(const [start,end] of ranges){
  let oldStart=1,newStart=1;
  for(let k=0;k<start;k++){if(ops[k].type!=='insert')oldStart++;if(ops[k].type!=='delete')newStart++}
  let oldCount=0,newCount=0;
  const lines=[];
  for(let k=start;k<end;k++){
   const op=ops[k];
   if(op.type!=='insert')oldCount++;
   if(op.type!=='delete')newCount++;
   lines.push((op.type==='delete'?'-':op.type==='insert'?'+':' ')+op.text);
  }
  const oldRange=oldCount===1?String(oldStart):oldCount===0?String(oldStart-1)+',0':oldStart+','+oldCount;
  const newRange=newCount===1?String(newStart):newCount===0?String(newStart-1)+',0':newStart+','+newCount;
  out.push('@@ -'+oldRange+' +'+newRange+' @@',...lines);
 }
 if(diff.left.finalNewline!==diff.right.finalNewline)out.push('# Terminal newline differs; compare original files for exact ending');
 return out.join('\n')+'\n';
}
