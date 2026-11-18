import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
import {webcrypto} from "node:crypto";
const html=readFileSync("filecheck.html","utf8");
for(const id of ["files","drop","calculate","results","expected","compare","duplicates","export"]){
  assert.match(html,new RegExp('id="'+id+'"'),"Missing FileCheck element "+id);
}
assert.match(html,/crypto\.subtle\.digest\("SHA-256"/,"Expected browser SHA-256");
assert.match(html,/new Blob\(/,"Report export missing");
assert.match(html,/data-lang="en"/,"English option missing");
assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|sendBeacon|<script\s+src=/i,"Unexpected outgoing request code");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,"Missing local script");
new Script(match[1],{filename:"filecheck.js"});
const b=await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode("abc"));
assert.equal(Buffer.from(b).toString("hex"),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
console.log("FileCheck static and SHA-256 reference checks passed");