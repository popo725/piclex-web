import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
const root = new URL('../tests/fixtures/demo/', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const datasets = [
  { id:'cafe', title:'咖啡馆的早晨', description:'一份早餐，几种平常的小美好', credit:'Kawin Harasai', source:'https://commons.wikimedia.org/wiki/File:Rustic_Cafe_Table_(Unsplash).jpg', license:'CC0 1.0', words:[
    ['croissant','牛角包',[.45,.46,.17,.28],'A croissant is on the wooden plate.','一个牛角包放在木盘上。'],
    ['spoon','勺子',[.19,.44,.14,.45],'The wooden spoon is beside the plate.','木勺在盘子旁边。'],
    ['fork','叉子',[.51,.20,.24,.35],'A fork rests on the table.','一把叉子放在桌上。'],
    ['plate','盘子',[.375,.34,.31,.50],'The plate holds a warm breakfast.','盘子里盛着一份温暖的早餐。'],
    ['lemon','柠檬',[.247,.23,.071,.115],'There is a yellow lemon in the glass.','玻璃杯里有一个黄色的柠檬。'],
    ['table','桌子',null,'The table is made of dark wood.','这张桌子是深色木头做的。'] ] },
  { id:'travel', title:'下一站，出发', description:'把行李收好，也把新词装进记忆', credit:'My Spain Visa', source:'https://unsplash.com/photos/C082gaOEDyM', license:'Unsplash License', words:[
    ['passport','护照',[.25,.57,.42,.16],'Keep your passport in a safe place.','把护照放在安全的地方。'],
    ['suitcase','行李箱',[.015,.48,.79,.51],'My suitcase is ready for the trip.','我的行李箱已为旅行准备好了。'],
    ['handle','把手',[.10,.12,.22,.13],'Pull the handle to move the suitcase.','拉起把手来移动行李箱。'],
    ['ticket','票',[.22,.53,.24,.105],'Check the date on your ticket.','检查一下票上的日期。'],
    ['curtain','窗帘',[.86,.02,.13,.65],'The curtain moves in the breeze.','窗帘在微风中摆动。'],
    ['pool','游泳池',[.58,.18,.26,.14],'The blue pool is outside the window.','蓝色的游泳池就在窗外。'] ] },
  { id:'home', title:'留一点时间给自己', description:'一盏灯、一本书，和安静的日常', credit:'Puscas Adryan', source:'https://unsplash.com/photos/w6VGEybp5wc', license:'Unsplash License', words:[
    ['lamp','台灯',[.365,.27,.28,.43],'The lamp lights up the desk.','台灯照亮了书桌。'],
    ['plant','植物',[.63,.37,.20,.33],'A small plant sits beside the lamp.','一株小植物放在台灯旁边。'],
    ['book','书',[.11,.68,.69,.11],'The book is open on the desk.','书在桌子上摊开着。'],
    ['desk','书桌',null,'I read at this desk every evening.','我每天晚上在这张书桌前读书。'],
    ['shadow','影子',[.05,.10,.26,.50],'The plant casts a shadow on the wall.','植物在墙上投下影子。'],
    ['wall','墙壁',[.02,.02,.29,.62],'The light shines on the wall.','灯光照在墙壁上。'] ] }
];
await mkdir(new URL('decks/', root), { recursive: true });
const catalog = [], sourceDecks = [];
for (const [index, d] of datasets.entries()) {
  const id = `b121e000-0000-4000-8000-${String(index + 1).padStart(12,'0')}`;
  const deckID = `b121e100-0000-4000-8000-${String(index + 1).padStart(12,'0')}`;
  const image = new Uint8Array(await readFile(new URL(`images/${d.id}.jpg`, root)));
  const imagePath = `photos/${id}.jpg`, jsonPath = `photos/${id}.json`;
  const labels = d.words.map(([english,chinese,rect,example,exampleChinese]) => ({
    english,chinese,x:rect?Math.round((rect[0]+rect[2]/2)*1000):500,y:rect?Math.round((rect[1]+rect[3]/2)*1000):500,
    phoneticUS:'',phoneticUK:'',backgroundColor:'#ffffff',textColor:'#202020',paletteColorIsFixed:true,
    boundingBox:rect?{left:Math.round(rect[0]*1000),top:Math.round(rect[1]*1000),right:Math.round((rect[0]+rect[2])*1000),bottom:Math.round((rect[1]+rect[3])*1000)}:null,
    positionUnavailable:!rect,
    learning:{partOfSpeech:'n. 名词',relation:'visible',sceneConnection:chinese,association:chinese,collocation:english,example,exampleChinese}
  }));
  const metadata = strToU8(JSON.stringify({formatVersion:1,id,createdAt:1793664000000,imagePath,imageByteCount:image.length,imageSHA256:digest(image),labels,
    quote:{chinese:'',english:'',source:'',sourceURL:null,provenance:'none'},recognitionCompleted:true,libraryAppendOrder:0}));
  const manifest = { formatIdentifier:'com.zhaoolee.piclex.photo-archive',formatVersion:1,exporterVersion:'1.3.0',importerVersion:'1.3.0',appVersion:'piclex-web-0.1.0',exportedAt:1793664000000,photoCount:1,trashCount:0,deckName:d.title,photos:[{id,jsonPath,jsonSHA256:digest(metadata)}] };
  // ZIP records wall-clock fields, not an absolute UTC instant; keep bytes stable across build timezones.
  const bytes = zipSync({ 'manifest.json':strToU8(JSON.stringify(manifest)),[jsonPath]:metadata,[imagePath]:image }, { level:0, mtime:new Date(2026,10,3,0,0,0) });
  await writeFile(new URL(`decks/${d.id}.piclexdeck`,root),bytes);
  catalog.push({id:d.id,title:d.title,description:d.description,count:d.words.length,cover:`images/${d.id}.jpg`,package:`decks/${d.id}.piclexdeck`,credit:d.credit,source:d.source});
  sourceDecks.push({deckID,title:d.title,author:'PicLex',description:d.description,version:1,photoCount:1,wordCount:d.words.length,packageURL:`https://zhaoolee.com/piclex-web/decks/${d.id}.piclexdeck`,packageBytes:bytes.length,packageSHA256:digest(bytes),coverURL:`https://zhaoolee.com/piclex-web/images/${d.id}.jpg`,access:'public'});
}
await writeFile(new URL('catalog.json',root),JSON.stringify(catalog,null,2)+'\n');
await writeFile(new URL('source.json',root),JSON.stringify({format:'com.piclex.deck-source',schemaVersion:1,title:'PicLex Web 场景体验',decks:sourceDecks},null,2)+'\n');
console.log(`Built ${catalog.length} demo decks with ${datasets.reduce((n,d)=>n+d.words.length,0)} words.`);
