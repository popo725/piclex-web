import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

MODULE=pathlib.Path(__file__).with_name('auto-update-public.py')
spec=importlib.util.spec_from_file_location('auto_update_public',MODULE)
auto=importlib.util.module_from_spec(spec)
spec.loader.exec_module(auto)


class AutoUpdatePublicTests(unittest.TestCase):
    def test_rejects_unsafe_manifest_paths_and_downloads(self):
        info={'bytes':1,'sha256':'a'*64}
        self.assertTrue(auto.safe_file('piclex-web/library/card.json',info))
        for name in ('piclex-web/../other','piclex-web//file','piclex-web/.env','piclex-web/a?x','other/file'):
            self.assertFalse(auto.safe_file(name,info))
        with patch.object(auto,'fetch',return_value=b'{}'):
            with self.assertRaises(RuntimeError):auto.manifest_from_pages()
        files={'piclex-web/index.html':{'bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()}}
        revision='a'*40
        identity=revision[:12]+'-'+hashlib.sha256(json.dumps(files,separators=(',',':')).encode()).hexdigest()[:12]
        manifest={'releaseID':identity,'sourceRevision':revision,'origin':'https://piclex.v2fy.com','files':files}
        with patch.object(auto,'fetch',return_value=json.dumps(manifest).encode()):
            self.assertEqual(auto.manifest_from_pages(),manifest)

    def test_reuses_verified_old_file_and_checks_new_download(self):
        with tempfile.TemporaryDirectory(dir='/private/tmp') as directory:
            root=pathlib.Path(directory);old=root/'old';stage=root/'stage'
            (old/'piclex-web').mkdir(parents=True);stage.mkdir()
            previous=old/'piclex-web/old.txt';previous.write_bytes(b'old')
            same={'bytes':3,'sha256':hashlib.sha256(b'old').hexdigest()}
            fresh={'bytes':3,'sha256':hashlib.sha256(b'new').hexdigest()}
            (old/'release.json').write_text(json.dumps({'files':{'piclex-web/old.txt':same}}))
            required={f'piclex-web/{name}':{'bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()} for name in ('index.html','source.json','library/catalog.json')}
            manifest={'releaseID':'a'*12+'-'+'b'*12,'sourceRevision':'a'*40,'origin':'https://piclex.v2fy.com','files':{'piclex-web/old.txt':same,'piclex-web/new.txt':fresh,**required}}
            def fetch(url,output=None,limit=None):output.write_bytes(b'new' if url.endswith('new.txt') else b'x')
            with patch.object(auto,'fetch',side_effect=fetch):auto.populate(stage,manifest,old)
            self.assertEqual((stage/'piclex-web/old.txt').stat().st_ino,previous.stat().st_ino)
            self.assertEqual((stage/'piclex-web/new.txt').read_bytes(),b'new')
            from activate import verify_release
            self.assertEqual(verify_release(stage),manifest)
            with patch.object(auto,'fetch',side_effect=lambda url,output=None,limit=None:output.write_bytes(b'bad')):
                with self.assertRaises(RuntimeError):auto.populate(root/'bad-stage',manifest,None)

    def test_pointer_switch_retains_previous_release(self):
        with tempfile.TemporaryDirectory(dir='/private/tmp') as directory:
            root=pathlib.Path(directory);first=root/'old';second=root/'new'
            first.mkdir();second.mkdir();(root/'current').symlink_to(first)
            with patch.object(auto,'ROOT',root):auto.switch(second)
            self.assertEqual((root/'current').resolve(),second)
            self.assertTrue(first.exists())


if __name__=='__main__':unittest.main()
