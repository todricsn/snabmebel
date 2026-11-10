const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../shablon1');
const base='/snabmebel/shablon1/';
const routes=['','catalog/','osnashchenie-razdevalok/','mebel-dlya-sportzalov/','torgovye-ostrovki/','stoyki-resepshen/'];
const pages=Object.fromEntries(routes.map(route=>[route,fs.readFileSync(path.join(root,route,'index.html'),'utf8')]));
for(const[route,html]of Object.entries(pages)){
 const pageURL='https://todricsn.github.io'+base+route;
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,route);
 assert.ok(html.includes('type="button">Отправить заявку</button>'));
 assert.ok(!html.includes('id="request-note"'));
 assert.ok(html.includes('>Позвонить</a>'));
 assert.ok(html.includes('telegram.svg'));
 for(const[,attribute,raw]of html.matchAll(/\b(href|src)="([^"]+)"/g)){
  const url=new URL(raw,pageURL);
  if(url.origin!=='https://todricsn.github.io')continue;
  assert.ok(url.pathname.startsWith(base),'Escapes template: '+raw);
  const relative=url.pathname.slice(base.length);
  const file=path.join(root,relative.endsWith('/')||!relative?relative+'index.html':relative);
  assert.ok(fs.existsSync(file),'Missing '+raw+' in '+route);
  if(attribute==='href'&&url.hash){const target=fs.readFileSync(file,'utf8');assert.ok(target.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),'Broken anchor '+raw);}
 }
}
assert.ok(pages['catalog/'].includes('id="model-request-dialog"'));
assert.ok(pages['catalog/'].includes('aria-haspopup="dialog"'));
assert.ok(fs.readFileSync(path.join(root,'app.js'),'utf8').includes("form.addEventListener('submit',event=>event.preventDefault())"));
console.log('PASS: all six shablon1 pages, project-prefixed links, assets, anchors, inert enquiry buttons and contact icons.');
