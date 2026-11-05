"""Synthetic native-compatible photo archive; bounded memory even beyond ZIP32."""
from pathlib import Path
import zipfile,json,hashlib,sys,uuid
root=Path(sys.argv[1]);mib=int(sys.argv[2]);root.mkdir(parents=True,exist_ok=True)
fixture=Path(__file__).resolve().parents[1]/'fixtures/demo/decks/cafe.piclexdeck'
with zipfile.ZipFile(fixture) as z:
 manifest=json.loads(z.read('manifest.json'));template=json.loads(z.read(manifest['photos'][0]['jsonPath']));image=z.read(template['imagePath'])
# Valid JPEG comment segments enlarge an existing synthetic fixture without changing pixels.
comment=b'PicLex synthetic large backup test. '*1800
segments=[];target=4*1024**2
while sum(map(len,segments))+len(image)<target-65537:
 data=comment[:min(65533,len(comment))];segments.append(b'\xff\xfe'+(len(data)+2).to_bytes(2,'big')+data)
image=image[:2]+b''.join(segments)+image[2:];digest=hashlib.sha256(image).hexdigest();count=max(1,(mib*1024**2+len(image)-1)//len(image));items=[]
folder=root/'PicLex-Backup-large';folder.mkdir(exist_ok=True)
with zipfile.ZipFile(folder/'photos.piclexdeck','w',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
 for n in range(count):
  ident=str(uuid.UUID(int=0x55555555555545558555000000000000+n));stem='photos/'+ident;meta={**template,'id':ident,'imagePath':stem+'.jpg','imageByteCount':len(image),'imageSHA256':digest,'deletedAt':None};label={**meta['labels'][0],'english':'camera','chinese':'相机'};label.pop('learning',None);meta['labels']=[label];data=json.dumps(meta,ensure_ascii=False,separators=(',',':')).encode();z.writestr(stem+'.jpg',image);z.writestr(stem+'.json',data);items.append({'id':ident,'jsonPath':stem+'.json','jsonSHA256':hashlib.sha256(data).hexdigest()})
 manifest.update(photos=items,photoCount=count,trashCount=0,deckName='大备份测试');z.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False).encode())
progress=(Path(__file__).resolve().parents[1]/'fixtures/backup/native-progress.json').read_bytes();(folder/'learning-progress.json').write_bytes(progress)
h=hashlib.sha256()
with (folder/'photos.piclexdeck').open('rb') as f:
 while chunk:=f.read(1024**2):h.update(chunk)
complete={'format':'com.zhaoolee.piclex.complete-backup','version':1,'photos':'photos.piclexdeck','learningProgress':'learning-progress.json','photoCount':count,'photosSHA256':h.hexdigest(),'progressSHA256':json.loads(progress)['contentSHA256']};(folder/'backup.json').write_text(json.dumps(complete))
(root/'fixture.json').write_text(json.dumps({'count':count,'imageBytes':len(image),'imageSHA256':digest,'archiveBytes':(folder/'photos.piclexdeck').stat().st_size,'firstID':items[0]['id']}));print((root/'fixture.json').read_text(),flush=True)
