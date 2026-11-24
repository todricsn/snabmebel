export const TYPES = {standard:'Классические локеры', z:'Z-образные', l:'L-образные', sport:'Открытые спортивные'};
export const COLORS = {wood:{name:'Светлый дуб',hex:'#c49b6d'},graphite:{name:'Графит',hex:'#424649'},grey:{name:'Серый',hex:'#b8bbb7'},beige:{name:'Бежевый',hex:'#ded2b9'},white:{name:'Белый',hex:'#efefea'},custom:{name:'Свой цвет',hex:'#657d86'}};
export const MATERIALS = {ldsp:'ЛДСП',hpl:'HPL, уточнить применение',discuss:'Подобрать с производителем'};
export const LOCKS = {key:'Ключевой',code:'Кодовый',rfid:'Электронный / RFID',discuss:'Нужна консультация'};
const integer = (value, fallback, min, max) => Number.isFinite(Number(value)) && value !== '' && value !== null ? Math.min(max,Math.max(min,Math.round(Number(value)))) : fallback;
export function normalize(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  const type = Object.hasOwn(TYPES,raw.type) ? raw.type : 'standard';
  const sections = integer(raw.sections,3,1,6);
  const tiers = type==='standard' ? integer(raw.tiers,2,1,5) : type==='sport' ? 1 : 2;
  let places = integer(raw.places,sections*tiers,1,type==='standard'?30:type==='sport'?6:12);
  if (type==='z'||type==='l') places=Math.max(2,Math.min(12,Math.round(places/2)*2));
  return {type,sections,tiers,places,mode:raw.mode==='places'?'places':'layout',bench:type==='sport'?false:raw.bench===true,color:Object.hasOwn(COLORS,raw.color)?raw.color:'wood',customHex:typeof raw.customHex==='string'&&/^#[0-9a-f]{6}$/i.test(raw.customHex)?raw.customHex:'#657d86',material:Object.hasOwn(MATERIALS,raw.material)?raw.material:'ldsp',lock:Object.hasOwn(LOCKS,raw.lock)?raw.lock:'discuss',quantity:integer(raw.quantity,1,1,100)};
}
export function layoutOptions(type, places) {
  if (!Number.isInteger(places)||places<1||places>30) return [];
  if (type==='sport') return places<=6 ? [{sections:places,tiers:1}] : [];
  if (type==='z'||type==='l') return places%2===0&&places<=12 ? [{sections:places/2,tiers:2}] : [];
  const pairs=[];
  for(let sections=1;sections<=6;sections++) if(places%sections===0&&places/sections<=5) pairs.push({sections,tiers:places/sections});
  return pairs;
}
export function selection(raw) {
  const s=normalize(raw);
  const places=s.mode==='places'?s.places:s.sections*s.tiers;
  const pairs=layoutOptions(s.type,places);
  const pair=s.mode==='places' ? pairs.find(p=>p.sections===s.sections&&p.tiers===s.tiers)||pairs[0] : {sections:s.sections,tiers:s.tiers};
  return {...s,...(pair||{}),places,totalPlaces:places*s.quantity,individual:!pair};
}
export function specification(raw) {
  const s=selection(raw);
  return ['Шкафчики для раздевалок','Тип: '+TYPES[s.type],s.individual?'Компоновка: индивидуальная':`Компоновка: ${s.sections} секц., ${s.tiers} яр.`,`Мест в одном шкафу: ${s.places}`,`Шкафов: ${s.quantity}. Всего мест: ${s.totalPlaces}`,'Скамья: '+(s.type==='sport'?'встроенное сиденье':s.bench?'дополнительная':'без скамьи'),'Цвет: '+COLORS[s.color].name+(s.color==='custom'?' ('+s.customHex+')':''),'Материал в запросе: '+MATERIALS[s.material],'Замок в запросе: '+LOCKS[s.lock],'Размеры и доступность комплектации согласовать.'].join('\n');
}
function shade(hex, amount) {
  return '#'+hex.slice(1).match(/../g).map(v=>Math.round(Math.max(0,Math.min(255,parseInt(v,16)+amount))).toString(16).padStart(2,'0')).join('');
}
// The drawing is a selection sketch, not a production drawing; confirm geometry and sizes in the order.
export function renderLocker(raw, id='locker') {
  const s=selection(raw);
  if(s.individual) return `<div class="individual-layout"><strong>${s.places}</strong><span>мест в индивидуальной компоновке</span><p>Равномерная сетка в пределах 6 секций и 5 ярусов не получается. Подберём раскладку по проекту.</p></div>`;
  const fill=s.color==='custom'?s.customHex:COLORS[s.color].hex;
  const dark=['graphite'].includes(s.color)||s.color==='custom';
  const hardware=dark?'#e5e6e1':'#303535';
  const count=s.sections, column=82, height=280, body=count*column, side=18;
  const x=(660-body-side)/2,y=s.bench?52:38;
  const wood=s.color==='wood';
  const face=wood?`url(#${id}-wood)`:fill;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 410" role="img" aria-label="Эскиз: ${TYPES[s.type]}, ${s.sections} секций, ${s.places} мест"><defs><pattern id="${id}-wood" width="32" height="110" patternUnits="userSpaceOnUse"><rect width="32" height="110" fill="${fill}"/><path d="M3 0Q8 35 3 70T3 140M16 0Q12 40 17 90T17 140M28 0Q22 48 27 95" fill="none" stroke="${shade(fill,-24)}" stroke-width=".7" opacity=".45"/></pattern></defs><ellipse cx="330" cy="${y+height+(s.bench?48:23)}" rx="${body*.57+side}" ry="9" fill="#d7d7ce"/><path d="M${x} ${y}l${side} -10h${body}l-${side} 10Z" fill="${shade(fill,22)}"/><path d="M${x+body} ${y}l${side} -10v${height}l-${side} 10Z" fill="${shade(fill,-36)}"/><rect x="${x}" y="${y}" width="${body}" height="${height}" fill="#41423b"/>`;
  let number=1;
  for(let c=0;c<count;c++) {
    const left=x+c*column+2,w=column-4;
    if(s.type==='sport') {
      svg+=`<rect x="${left}" y="${y+2}" width="${w}" height="${height-4}" fill="${shade(fill,-35)}"/><rect x="${left+5}" y="${y+7}" width="${w-10}" height="${height-100}" fill="${shade(fill,8)}"/><path d="M${left+5} ${y+54}h${w-10}" stroke="${shade(fill,-30)}" stroke-width="5"/><path d="M${left+25} ${y+72}v12q-7 9-7 0m24-12v12q7 9 7 0" fill="none" stroke="${hardware}" stroke-width="2.5"/><rect x="${left+4}" y="${y+height-89}" width="${w-8}" height="84" fill="${face}"/><rect x="${left}" y="${y+height-94}" width="${w}" height="8" fill="${shade(fill,22)}"/><path d="M${left+14} ${y+height-38}h${w-28}m-${w-28} 6h${w-28}" stroke="${hardware}" stroke-width="2"/>`;
    } else if(s.type==='z'||s.type==='l') {
      const middle=y+height*.5;
      const seam=s.type==='z'?`M${left} ${middle+26}h${w*.32}l${w*.36} -52h${w*.32}`:`M${left} ${middle+28}h${w*.5}v-56h${w*.5}`;
      svg+=`<rect x="${left}" y="${y+2}" width="${w}" height="${height-4}" fill="${face}"/><path d="${seam}" fill="none" stroke="#41423b" stroke-width="3"/>`;
      for(let t=0;t<2;t++) {const cy=y+(t?height*.76:height*.22);svg+=`<text x="${left+8}" y="${cy-10}" fill="${hardware}" font-size="9">${String(number++).padStart(2,'0')}</text><circle cx="${left+(t?w-13:13)}" cy="${cy+9}" r="4" fill="${hardware}"/>`;}
    } else {
      const cell=height/s.tiers;
      for(let t=0;t<s.tiers;t++) {
        const top=y+t*cell+2,h=cell-4;
        svg+=`<rect x="${left}" y="${top}" width="${w}" height="${h}" fill="${face}"/><text x="${left+8}" y="${top+17}" fill="${hardware}" font-size="9">${String(number++).padStart(2,'0')}</text><rect x="${left+w-15}" y="${top+h*.52-5}" width="6" height="14" rx="2" fill="${hardware}"/>`;
        if(h>65) svg+=`<path d="M${left+9} ${top+h-18}h16m-16 4h16m-16 4h16" stroke="${hardware}" stroke-width="1.2" opacity=".7"/>`;
      }
    }
  }
  svg+=`<path d="M${x+8} ${y+height}v15m${body-16}-15v15" stroke="#41423b" stroke-width="5"/>`;
  if(s.bench) svg+=`<path d="M${x-6} ${y+height+16}l20 -15h${body+2}l-20 15Z" fill="${shade(fill,18)}"/><path d="M${x-6} ${y+height+16}h${body+2}" stroke="${shade(fill,-18)}" stroke-width="5"/><path d="M${x+3} ${y+height+19}v26m${body-18}-26v26" stroke="#41423b" stroke-width="5"/>`;
  return svg+'</svg>';
}
export const PRESETS=[{sections:2,tiers:1},{sections:2,tiers:2},{sections:3,tiers:3},{type:'z',sections:3},{type:'l',sections:2},{type:'sport',sections:3}];
