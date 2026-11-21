import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const html=readFileSync("digital-mirror.html","utf8");
for(const id of ["mirror","lab","protection","cards","choices","feedback","checklist"]){
  assert.match(html,new RegExp('id="'+id+'"'),"Missing Digital Mirror component: "+id);
}
assert.match(html,/const texts=\{/,"Bilingual content missing");
assert.match(html,/optionOrder\.forEach/,"Quiz answer order must vary");
assert.match(html,/aria-live="polite"/,"Missing accessible feedback");
assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|sendBeacon|<script\s+src=/i,"Unexpected network behavior");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,"Missing Digital Mirror script");
new Script(match[1],{filename:"digital-mirror.js"});
assert.match(html,/data-nav="guide"/,"Translated guide link missing");
assert.match(html,/data-nav="identity"/,"Translated identity link missing");
assert.match(html,/document\.querySelectorAll\("\[data-nav\]"\)/,"Language switch does not update navigation");
assert.match(html,/\.card\{display:grid;grid-template-columns:minmax\(0,1fr\)/,"Compact mobile cards missing");
assert.match(html,/\.card \.hint\{display:none\}/,"Long card notes remain visible on mobile");
console.log("Digital Mirror validation passed");