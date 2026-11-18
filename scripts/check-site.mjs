import { readFileSync, existsSync, statSync } from "node:fs";
import assert from "node:assert/strict";
const html=readFileSync("index.html","utf8");
for(const id of ["main","software","console","cyber-knowledge"]) {
  assert.match(html,new RegExp('id="'+id+'"'),"Missing section: "+id);
}
assert.match(html,/data-switch="it"/,"Italian switch missing");
assert.match(html,/data-switch="en"/,"English switch missing");
assert.match(html,/rel="canonical"/,"Canonical link missing");
assert.match(html,/name="viewport"/,"Responsive viewport missing");
assert.ok(existsSync("robots.txt"),"Missing robots.txt");
assert.ok(existsSync("sitemap.xml"),"Missing sitemap.xml");
assert.ok(existsSync("404.html"),"Missing 404 page");
const image="assets/dark-aronte.webp";
assert.ok(existsSync(image),"Hero image missing");
assert.ok(statSync(image).size>1024,"Hero image appears empty");
assert.doesNotMatch(html,/(href|src)="#"/i,"Placeholder destination detected");
console.log("Dark Aronte site checks passed");