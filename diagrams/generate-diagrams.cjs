// Native, editable draw.io diagrams and matching SVG/PNG review exports.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const out = __dirname;
const W = 1600, H = 1220;
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const users = ['wallet_address [PK]', 'name', 'bio (nullable)', 'created_at'];
const campaigns = ['id [PK]', 'creator_address [FK]', 'title', 'description', 'image_url', 'category', 'location', 'organizer', 'creation_block', 'transaction_hash [UQ]', 'created_at'];
const chain = ['campaignId : uint256 (kunci mapping)', 'creator : address', 'target : uint256 (wei)', 'deadline : uint256 (Unix detik)', 'raised : uint256 (wei)', 'withdrawn : uint256 (wei)'];
const events = [
 ['CampaignCreated', 'campaignId, creator, target, deadline'],
 ['DonationReceived', 'campaignId, donor, amount, timestamp'],
 ['FundsWithdrawn', 'campaignId, creator, amount,', 'totalWithdrawn, timestamp']
];
class Page {
 constructor(id,title) { this.id=id; this.title=title; this.cells=[]; this.svg=[]; this.ids=new Set(); this.n=0; }
 box(id,x,y,w,h,lines,kind='box',opt={}) {
  if(this.ids.has(id)) throw Error('Duplicate '+id); this.ids.add(id);
  lines=Array.isArray(lines)?lines:String(lines).split('\n');
  const color=opt.color||'#222222', fill=opt.fill||'#ffffff', size=opt.size||18;
  const align=opt.align||'center', dashed=opt.dashed?'dashed=1;dashPattern=7 5;':'';
  const base=kind==='diamond'?'rhombus;':kind==='text'?'text;strokeColor=none;fillColor=none;':'rounded=0;';
  const style=`${base}whiteSpace=wrap;html=0;fontFamily=Arial;fontSize=${size};fontColor=${color};align=${align};verticalAlign=middle;spacing=8;strokeWidth=1.5;${kind==='text'?'':`strokeColor=${color};fillColor=${fill};`}${dashed}${opt.bold?'fontStyle=1;':''}`;
  this.cells.push(`<mxCell id="${id}" value="${esc(lines.join('\n'))}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
  if(kind==='diamond') this.svg.push(`<polygon points="${x+w/2},${y} ${x+w},${y+h/2} ${x+w/2},${y+h} ${x},${y+h/2}" fill="${fill}" stroke="${color}" stroke-width="1.5"/>`);
  else if(kind!=='text') this.svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${color}" stroke-width="1.5" ${opt.dashed?'stroke-dasharray="7 5"':''}/>`);
  const lineHeight=size*1.4, start=y+h/2-(lines.length-1)*lineHeight/2;
  this.svg.push(`<text font-family="Arial" font-size="${size}" fill="${color}" text-anchor="${align==='left'?'start':'middle'}" ${opt.bold?'font-weight="bold"':''}>${lines.map((s,i)=>`<tspan x="${align==='left'?x+12:x+w/2}" y="${start+i*lineHeight}" dominant-baseline="middle">${esc(s)}</tspan>`).join('')}</text>`);
 }
 line(points,opt={}) {
  const id='edge_'+(++this.n), color=opt.color||'#222222'; this.ids.add(id);
  const [a,...rest]=points, b=rest.pop();
  this.cells.push(`<mxCell id="${id}" style="edgeStyle=none;html=0;endArrow=${opt.arrow?'block':'none'};endFill=1;strokeWidth=1.5;strokeColor=${color};${opt.dashed?'dashed=1;dashPattern=7 5;':''}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${a[0]}" y="${a[1]}" as="sourcePoint"/><mxPoint x="${b[0]}" y="${b[1]}" as="targetPoint"/>${rest.length?`<Array as="points">${rest.map(p=>`<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('')}</Array>`:''}</mxGeometry></mxCell>`);
  this.svg.push(`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" ${opt.dashed?'stroke-dasharray="7 5"':''} ${opt.arrow?'marker-end="url(#arrow)"':''}/>`);
 }
 text(id,x,y,w,h,txt,opt={}) {this.box(id,x,y,w,h,txt,'text',opt);}
 zone(id,y,h,title,blue=false){this.box(id,40,y,1520,h,[],'box',{dashed:true,color:blue?'#536a83':'#555555'}); this.text(id+'_label',65,y+8,1460,30,title,{align:'left',size:19,bold:true});}
 record(id,x,y,w,title,rows){ const hh=42,rh=28; this.box(id,x,y,w,hh+rows.length*rh,[]); this.box(id+'_head',x,y,w,hh,title,'box',{bold:true}); rows.forEach((r,i)=>this.text(id+'_r'+i,x,y+hh+i*rh,w,rh,r,{align:'left',size:17})); return {x,y,w,h:hh+rows.length*rh}; }
 start(){ this.text('title',40,20,1520,38,this.title,{size:25,bold:true});this.text('subtitle',40,59,1520,26,'RuangBaik | Model hybrid: PostgreSQL (off-chain) + Ethereum Sepolia (on-chain)',{size:17}); }
 finish(){this.text('legend',55,1110,1490,36,'Konektor utuh: relasi SQL / asosiasi blockchain. Konektor putus-putus: tautan lintas penyimpanan, bukan FK SQL.',{size:16});this.text('scope',55,1150,1490,40,['PK = primary key | FK = foreign key | UQ = unique | 0..N = nol atau banyak.', 'Berlaku untuk satu deployment kontrak. Struktur kontrak dan event bukan tabel PostgreSQL.'],{size:16});}
 xml(){return `<diagram id="${this.id}" name="${esc(this.title)}"><mxGraphModel dx="1600" dy="1220" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${W}" pageHeight="${H}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${this.cells.join('')}</root></mxGraphModel></diagram>`;}
 svgText(){return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#222"/></marker></defs><rect width="100%" height="100%" fill="white"/>${this.svg.join('')}</svg>`;}
}
function chainPanel(p,y=640){
 p.zone('chain_zone',y,445,'ON-CHAIN — Ethereum Sepolia / smart contract Crowdfunding',true);
 p.record('CL03',110,y+83,480,'Campaign «struct dalam mapping»',chain);
 p.text('mapping',100,y+320,500,54,['campaigns: mapping(uint256 => Campaign)', 'campaignId bukan anggota struct Campaign.'],{size:16});
 events.forEach((e,i)=>{
  const ey=y+65+i*112;
  p.record('event_'+i,1020,ey,470,e[0]+' «event»',e.slice(1));
  const cy=ey+35;
  p.line([[590,y+135],[720+i*45,y+135],[720+i*45,cy],[1020,cy]]);
  p.text('evrel_'+i,825,cy-36,175,30,i===0?'1 : 1 (pembuatan)':'1 : 0..N',{size:16});
 });
 p.text('event_note',720,y+390,800,35,'TxHash dan nomor blok berasal dari log/receipt; bukan parameter event.',{size:16});
}
const erd=new Page('erd','3.2.1 Entity Relationship Diagram (ERD)'); erd.start();
erd.zone('sql_zone',105,465,'OFF-CHAIN — PostgreSQL (Neon)');
erd.box('E01',130,170,260,60,'USERS'); erd.box('R01',650,155,160,90,'Membuat','diamond'); erd.box('E02',1060,170,280,60,'CAMPAIGNS');
erd.line([[390,200],[650,200]]); erd.line([[810,200],[1060,200]]);
erd.text('one',440,164,100,30,'1'); erd.text('many',895,164,100,30,'0..N');
erd.text('uattrs',100,260,340,140,users,{align:'left'}); erd.line([[260,230],[260,250]]);
erd.text('cattrs',1030,250,420,290,campaigns,{align:'left'}); erd.line([[1200,230],[1200,245]]);
erd.text('sql_rule',455,330,500,110,['Satu pengguna dapat membuat 0..N kampanye.', 'Setiap kampanye memiliki tepat 1 pembuat.', 'R01: users.wallet_address', '→ campaigns.creator_address (FK)'],{size:17});
// Conceptual on-chain extension uses the same external attribute notation as ERD reference.
erd.zone('chain_zone',640,445,'ON-CHAIN — Perluasan konseptual; bukan entitas relasional SQL',true);
erd.box('CL03',170,725,350,60,'Campaign «struct»');
erd.text('chainattrs',130,805,470,190,chain,{align:'left',size:17});
erd.text('mapping',110,1005,500,55,['campaigns: mapping(uint256 => Campaign)', 'campaignId adalah kunci mapping, bukan atribut struct.'],{size:16});
events.forEach((ev,i)=>{const y=690+i*125;erd.box('ev_'+i,1060,y,440,42,ev[0]+' «event»');erd.text('evattrs_'+i,1055,y+47,450,60,ev.slice(1),{size:16});erd.box('diamond_'+i,735,y-10,135,65,i===0?'Dibuat':'Mencatat','diamond',{size:16});erd.line([[520,755],[650+i*18,755],[650+i*18,y+22],[735,y+22]]);erd.line([[870,y+22],[1060,y+22]]);erd.text('card_'+i,883,y-10,170,28,i===0?'1 : 1':'1 : 0..N',{size:16});});
erd.line([[1340,200],[1535,200],[1535,625],[70,625],[70,700],[345,700],[345,725]],{dashed:true});
erd.text('hybrid_link',480,578,720,53,['CAMPAIGNS.id ↔ campaignId: tautan aplikasi (text ↔ uint256)', 'Setiap metadata → 1 Campaign; setiap Campaign → 0..1 metadata.'],{size:16});
erd.finish();

const tr=new Page('transformasi','3.2.2 Transformasi ERD ke Logical Record Structure (LRS)'); tr.start();
tr.zone('sql_zone',105,465,'OFF-CHAIN — Transformasi relasi R01 (1:N) menjadi dua record');
tr.box('group_users',90,160,450,350,[],'box',{dashed:true,color:'#536a83'});
tr.box('group_campaigns',620,160,880,350,[],'box',{dashed:true,color:'#536a83'});
tr.box('E01',150,185,260,50,'USERS'); tr.box('R01',660,172,145,76,'Membuat','diamond',{size:17}); tr.box('E02',1050,185,310,50,'CAMPAIGNS');
tr.line([[410,210],[660,210]]);tr.line([[805,210],[1050,210]]);tr.text('one',550,174,70,28,'1');tr.text('many',890,174,110,28,'0..N');
tr.record('lrs_users',140,285,350,'USERS',['wallet_address [PK]','name, bio, created_at']);
tr.record('lrs_campaigns',890,285,540,'CAMPAIGNS',['id [PK]','creator_address [FK]','... atribut E02 lainnya tetap']);
tr.line([[490,341],[760,341],[760,369],[890,369]],{arrow:true});
tr.text('migration',635,255,240,70,['PK sisi 1 → FK sisi N', 'wallet_address →', 'creator_address'],{size:16});
tr.text('rule',660,420,800,58,['Relasi Membuat diserap ke record CAMPAIGNS.', 'Tidak terbentuk tabel penghubung; seluruh atribut E01/E02 tetap dipertahankan.'],{size:16});
tr.text('complete',90,515,1410,40,'Daftar lengkap atribut record hasil transformasi disajikan pada halaman 3.2.3 (LRS).',{size:17});
chainPanel(tr);
tr.line([[1500,370],[1535,370],[1535,625],[70,625],[70,700],[350,700],[350,723]],{dashed:true});
tr.text('hybrid_link',410,579,900,47,['CAMPAIGNS.id ↔ campaignId: tautan aplikasi; bukan hasil migrasi FK.', 'Struct dan event tetap di blockchain, tidak ditransformasikan menjadi tabel SQL.'],{size:16});
tr.finish();

const lrs=new Page('lrs','3.2.3 Logical Record Structure (LRS)'); lrs.start();
lrs.zone('sql_zone',105,465,'OFF-CHAIN — Record relasional PostgreSQL (Neon)');
lrs.record('E01',130,165,380,'USERS',users);
lrs.record('E02',980,165,460,'CAMPAIGNS',campaigns);
lrs.line([[510,221],[730,221],[730,249],[980,249]],{arrow:true});
lrs.text('fk_label',535,270,420,100,['R01 — Membuat (1 : 0..N)', 'users.wallet_address [PK]', '→ campaigns.creator_address [FK]', '1 pengguna pembuat per kampanye'],{size:17});
lrs.text('bio_note',110,360,430,55,'Hanya bio yang nullable.\nKolom lainnya wajib terisi.',{size:17});
chainPanel(lrs);
lrs.line([[1440,221],[1535,221],[1535,625],[70,625],[70,700],[350,700],[350,723]],{dashed:true});
lrs.text('hybrid_link',420,580,1000,46,['CAMPAIGNS.id (text) ↔ campaignId (uint256): satu metadata untuk satu kampanye.', 'Campaign on-chain dapat belum memiliki metadata (0..1); tautan ini bukan FK SQL.'],{size:16});
lrs.finish();
const pages=[erd,tr,lrs];
const wrap=ps=>`<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" type="device" compressed="false">${ps.map(p=>p.xml()).join('')}</mxfile>`;
async function main(){
 fs.writeFileSync(path.join(out,'RuangBaik_Perancangan_Basis_Data_Hybrid.drawio'),wrap(pages));
 for(const [i,p] of pages.entries()){
  const name=['01_ERD_Hybrid','02_Transformasi_ERD_ke_LRS','03_LRS_Hybrid'][i];
  fs.writeFileSync(path.join(out,name+'.drawio'),wrap([p]));
  const svg=p.svgText();fs.writeFileSync(path.join(out,name+'.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out,name+'.png'));
 }
 console.log('Created 3 editable diagram pages, individual draw.io files, SVG and PNG exports.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

