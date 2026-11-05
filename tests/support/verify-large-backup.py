from pathlib import Path
import sys,zipfile,json,hashlib
root=Path(sys.argv[1]);manifest=json.loads((root/'backup.json').read_bytes());h=hashlib.sha256()
with (root/'photos.piclexdeck').open('rb') as f:
 while chunk:=f.read(1024**2):h.update(chunk)
assert h.hexdigest()==manifest['photosSHA256']
with zipfile.ZipFile(root/'photos.piclexdeck') as z:
 m=json.loads(z.read('manifest.json'));assert m['photoCount']==manifest['photoCount'];digests=set()
 for p in m['photos']:
  raw=z.read(p['jsonPath']);assert hashlib.sha256(raw).hexdigest()==p['jsonSHA256'];meta=json.loads(raw);h=hashlib.sha256()
  with z.open(meta['imagePath']) as f:
   while chunk:=f.read(1024**2):h.update(chunk)
  assert h.hexdigest()==meta['imageSHA256'];digests.add(h.hexdigest())
 assert len(digests)==1
 progress=json.loads((root/'learning-progress.json').read_bytes());assert progress['contentSHA256']==manifest['progressSHA256'];assert progress['content']['progress'][0]['attempts']==3
 print(json.dumps({'photoCount':m['photoCount'],'imageSHA256':digests.pop(),'zip64':any(e.header_offset>0xffffffff or e.file_size>0xffffffff for e in z.infolist()),'archiveBytes':(root/'photos.piclexdeck').stat().st_size}))
