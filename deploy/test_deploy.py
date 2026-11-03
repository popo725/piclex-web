import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import activate
from activate import BEGIN, END, ROOT, OLD_ROOT, patch_site, verify_release, web_block, protected_routes

SITE = f'''server {{
    listen 443 ssl;
    server_name piclex.v2fy.com;
    location /v1/ {{ proxy_pass http://127.0.0.1:18090; }}
    location /decks/ {{ proxy_pass http://127.0.0.1:18090; }}
    location = / {{
        limit_except GET HEAD {{ deny all; }}
        root {OLD_ROOT};
        try_files /index.html =404;
    }}
    location ^~ /public/ {{ root /home/hermes/piclex; }}
    location / {{ return 404; }}
}}
'''


class DeploymentTests(unittest.TestCase):
    def test_failed_reload_restores_config_and_previous_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            site = root / 'site.conf'
            site.write_bytes(b'old config')
            (root / 'current').symlink_to('old release')
            metadata = site.stat()
            def write(path, data, _):
                path.write_bytes(data)
            with patch.object(activate, 'ROOT', root), patch.object(activate, 'SITE', site), patch.object(activate, 'replace_file', side_effect=write), patch.object(activate, 'reload_nginx', side_effect=[RuntimeError('rejected'), None]) as reload:
                with self.assertRaises(RuntimeError):
                    activate.apply_change('new release', 'old release', b'new config', b'old config', metadata)
                self.assertEqual(reload.call_count, 2)
            self.assertEqual(site.read_bytes(), b'old config')
            self.assertEqual((root / 'current').readlink(), Path('old release'))

    def test_first_activation_failure_removes_new_pointer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            site = root / 'site.conf'
            site.write_bytes(b'old config')
            def write(path, data, _):
                path.write_bytes(data)
            with patch.object(activate, 'ROOT', root), patch.object(activate, 'SITE', site), patch.object(activate, 'replace_file', side_effect=write), patch.object(activate, 'reload_nginx', side_effect=[RuntimeError('rejected'), None]):
                with self.assertRaises(RuntimeError):
                    activate.apply_change('new release', None, b'new config', b'old config', site.stat())
            self.assertFalse((root / 'current').is_symlink())
            self.assertEqual(site.read_bytes(), b'old config')

    def test_preserves_routes_and_is_idempotent(self):
        candidate = patch_site(SITE)
        self.assertEqual(patch_site(candidate), candidate)
        self.assertEqual(protected_routes(candidate), protected_routes(SITE))
        legacy = SITE.replace(OLD_ROOT, str(ROOT / 'current')).replace('    location / { return 404; }', web_block().replace('/piclex-web', '/web') + '    location / { return 404; }')
        self.assertEqual(patch_site(legacy), candidate)

    def test_rejects_unknown_homepage(self):
        with self.assertRaises(ValueError):
            patch_site(SITE.replace(OLD_ROOT, '/different/site'))

    def test_rejects_conflicting_web_route(self):
        with self.assertRaises(ValueError):
            patch_site(SITE.replace('    location / {', '    location /web/ { return 200; }\n    location / {'))

    def test_rejects_modified_marked_route(self):
        with self.assertRaises(ValueError):
            patch_site(patch_site(SITE).replace('autoindex off;', 'autoindex on;'))
        with self.assertRaises(ValueError):
            patch_site(patch_site(SITE).replace(END, ''))

    def test_release_detects_corruption_and_unlisted_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / 'piclex-web/library').mkdir(parents=True)
            files = {}
            for name in ['piclex-web/index.html', 'piclex-web/source.json', 'piclex-web/library/catalog.json']:
                (root / name).write_bytes(b'test')
                files[name] = {'bytes': 4, 'sha256': hashlib.sha256(b'test').hexdigest()}
            (root / 'release.json').write_text(json.dumps({'origin': 'https://piclex.v2fy.com', 'releaseID': 'a' * 12 + '-' + 'b' * 12, 'sourceRevision': 'a' * 40, 'files': files}))
            verify_release(root)
            (root / 'piclex-web/source.json').write_bytes(b'bad')
            with self.assertRaises(ValueError):
                verify_release(root)
            (root / 'piclex-web/source.json').write_bytes(b'test')
            (root / 'piclex-web/unexpected.txt').write_text('unexpected')
            with self.assertRaises(ValueError):
                verify_release(root)

    def test_rejects_symlinks_in_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / 'release.json').write_text(json.dumps({'origin': 'https://piclex.v2fy.com', 'releaseID': 'a' * 12 + '-' + 'b' * 12, 'sourceRevision': 'a' * 40, 'files': {}}))
            (root / 'linked').symlink_to('/etc/hosts')
            with self.assertRaises(ValueError):
                verify_release(root)


if __name__ == '__main__':
    unittest.main()
