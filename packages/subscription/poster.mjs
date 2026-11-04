/** Browser-native poster template shared by the editor and the batch CLI. */
export const DEFAULT_POSTER_TEXT = Object.freeze({
 brand:'App Store下载“摄影学英语”',
 heading:'扫码下载，开始学习',
 guide:'进入学习栏目\n点击右上角按钮\n扫码即可获取卡组',
 emphasis:'学习,右上角',
 theme:'paper',panelY:1004,qrSize:310
});
export async function loadPosterImage(source){
 const image=new Image();image.src=source;await image.decode();
 if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>32000000)throw Error('封面尺寸过大，请使用3200万像素以内的图片。');
 return image;
}
export function drawSubscriptionPoster(canvas,cover,qr,settings={}){
 const s={...DEFAULT_POSTER_TEXT,...settings};
 const lines=s.guide.split('\n').map(x=>x.trim()).filter(Boolean);
 if(!lines.length||lines.length>3)throw Error('扫码指引请写1至3行。');
 if(s.brand.length>40||s.heading.length>28||lines.some(x=>x.length>40))throw Error('文案过长，请缩短后预览。');
 const qrSize=Number(s.qrSize),panelY=Number(s.panelY);
 if(!Number.isFinite(qrSize)||qrSize<240||qrSize>310||!Number.isFinite(panelY)||panelY<640||panelY>1106)throw Error('模板尺寸超出范围。');
 canvas.width=1024;canvas.height=1536;const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器无法生成图片。');
 const night=s.theme==='night',ink=night?'#f5d89b':'#19334b';
 ctx.fillStyle=night?'#062c29':'#f9e7c8';ctx.fillRect(0,0,1024,1536);
 const scale=Math.min(1024/cover.naturalWidth,1536/cover.naturalHeight),w=cover.naturalWidth*scale,h=cover.naturalHeight*scale;
 ctx.drawImage(cover,(1024-w)/2,(1536-h)/2,w,h);
 const rounded=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
 ctx.save();ctx.shadowColor='#0003';ctx.shadowBlur=44;ctx.shadowOffsetY=16;
 ctx.fillStyle=night?'rgba(5,35,31,.97)':'rgba(255,247,228,.97)';rounded(56,panelY,912,374,24);ctx.fill();ctx.restore();
 ctx.strokeStyle=night?'#c49a50':'#cba56c';ctx.lineWidth=2;rounded(56,panelY,912,374,24);ctx.stroke();
 const qrX=88,qrY=panelY+(374-qrSize)/2;ctx.fillStyle='#fff';rounded(qrX,qrY,qrSize,qrSize,8);ctx.fill();
 ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,qrX,qrY,qrSize,qrSize);ctx.imageSmoothingEnabled=true;
 const x=qrX+qrSize+34,maxWidth=968-30-x;
 const family='"PingFang SC","Microsoft YaHei",sans-serif';
 const font=(size,bold=false)=>`${bold?700:400} ${size}px ${family}`;
 const fitted=(text,size,bold=false)=>{while(size>16){ctx.font=font(size,bold);if(ctx.measureText(text).width<=maxWidth)return size;size--;}ctx.font=font(16,bold);if(ctx.measureText(text).width>maxWidth)throw Error('文字过长，请缩短文案。');return 16;};
 const brandSize=fitted(s.brand,21),titleSize=fitted(s.heading,43,true);
 const tokens=s.emphasis.split(/[,，\s]+/).filter(Boolean);
 const segments=line=>{let parts=[{text:line,bold:false}];for(const token of tokens){parts=parts.flatMap(p=>p.bold?[p]:p.text.split(token).flatMap((v,i)=>i?[{text:token,bold:true},{text:v,bold:false}]:[{text:v,bold:false}]));}return parts;};
 const guide=lines.map(line=>{const parts=segments(line);let size=26;const width=()=>parts.reduce((n,p)=>{ctx.font=font(size,p.bold);return n+ctx.measureText(p.text).width;},0);while(size>16&&width()>maxWidth)size--;if(width()>maxWidth)throw Error('指引过长，请缩短文案。');return {parts,size};});
 const textHeight=brandSize*1.3+14+titleSize*1.3+20+guide.length*47;
 let y=panelY+(374-textHeight)/2;ctx.textBaseline='top';ctx.fillStyle=ink;ctx.globalAlpha=.8;ctx.font=font(brandSize);ctx.fillText(s.brand,x,y);ctx.globalAlpha=1;
 y+=brandSize*1.3+14;ctx.font=font(titleSize,true);ctx.fillText(s.heading,x,y);y+=titleSize*1.3+20;
 for(const line of guide){let xx=x;for(const part of line.parts){ctx.font=font(line.size,part.bold);ctx.fillText(part.text,xx,y);xx+=ctx.measureText(part.text).width;}y+=47;}
 return canvas;
}
