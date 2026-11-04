#!/usr/bin/env python3
"""Validate a release on an isolated loopback Nginx; never reload production."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import socket
import subprocess
import tempfile
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from activate import SITE, ROOT, OLD_ROOT, patch_site, verify_release, web_block, homepage_block, protected_routes


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def main():
    opener = build_opener(NoRedirect)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', required=True, type=Path)
    args = parser.parse_args()
    release = args.release.resolve()
    verify_release(release)
    original = SITE.read_text()
    candidate = patch_site(original)
    assert protected_routes(candidate) == protected_routes(original), 'Unexpected existing route changes'
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix='piclex-web-check-') as directory:
        temporary = Path(directory)
        config = temporary / 'nginx.conf'
        config.write_text(f'''pid {temporary}/nginx.pid;
error_log {temporary}/error.log;
events {{ worker_connections 64; }}
http {{
    access_log off;
    client_body_temp_path {temporary}/body;
    proxy_temp_path {temporary}/proxy;
    fastcgi_temp_path {temporary}/fastcgi;
    uwsgi_temp_path {temporary}/uwsgi;
    scgi_temp_path {temporary}/scgi;
    server {{
        listen 127.0.0.1:{port};
{homepage_block()}
{web_block(release)}
        location / {{ return 404; }}
    }}
}}
''')
        process = subprocess.Popen(['/usr/sbin/nginx', '-c', str(config), '-p', str(temporary), '-g', 'daemon off;'], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        try:
            for _ in range(50):
                if process.poll() is not None:
                    raise RuntimeError(process.stderr.read().decode())
                try:
                    with socket.create_connection(('127.0.0.1', port), timeout=.1):
                        break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError('Isolated Nginx did not start')

            def request(path, method='GET', expected=200, mime=None):
                try:
                    response = opener.open(Request(f'http://127.0.0.1:{port}{path}', method=method), timeout=5)
                except HTTPError as error:
                    response = error
                with response:
                    assert response.status == expected, (path, response.status)
                    if mime:
                        assert response.headers.get_content_type() == mime, (path, dict(response.headers))
                    if expected == 200:
                        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
                    return response.read()

            request('/', expected=302)
            homepage = request('/piclex-web/', mime='text/html')
            assert homepage == (release / 'piclex-web/index.html').read_bytes()
            request('/piclex-web', expected=308)
            assert request('/piclex-web/', method='HEAD') == b''
            for asset in re.findall(r'(?:src|href)="(/piclex-web/[^" ]+)"', homepage.decode()):
                mime = {'.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png'}[Path(asset).suffix]
                assert request(asset, mime=mime) == (release / asset.lstrip('/')).read_bytes()
            catalog = json.loads(request('/piclex-web/library/catalog.json', mime='application/json'))
            source = json.loads(request('/piclex-web/source.json', mime='application/json'))
            assert len(catalog) == len(source['decks']) >= 1
            for deck in source['decks']:
                package = urlsplit(deck['packageURL'])
                cover = urlsplit(deck['coverURL'])
                assert package.scheme == cover.scheme == '' and package.netloc == cover.netloc == ''
                assert package.path.startswith('/piclex-web/library/') and cover.path.startswith('/piclex-web/library/')
                data = request(package.path, mime='application/octet-stream')
                assert len(data) == deck['packageBytes']
                assert hashlib.sha256(data).hexdigest() == deck['packageSHA256']
                request(cover.path, mime='image/jpeg')
            for card in catalog:
                payload = json.loads(request('/piclex-web/' + card['payload'], mime='application/json'))
                for word in payload['words']:
                    clip = word.get('audio')
                    if clip:
                        data = request('/piclex-web/' + clip['path'], mime='audio/mpeg')
                        assert len(data) == clip['byteCount']
                        assert hashlib.sha256(data).hexdigest() == clip['sha256']
            request('/piclex-web/credits.html', mime='text/html')
            for path in ['/piclex-web/', '/piclex-web/library/catalog.json']:
                request(path, method='POST', expected=403)
            for path in ['/release.json', '/piclex-web/.env', '/piclex-web/missing', '/unknown']:
                request(path, expected=404)
            request('/piclex-web/assets/', expected=403)
            assert SITE.read_text() == original, 'Production config changed during check'
            print('PASS: homepage, JS/CSS MIME, catalog, public same-origin packages/hashes/covers, credits, HEAD, write/hidden/listing guards; existing routes preserved.')
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            process.stderr.close()
    print('Isolated Nginx stopped and temporary files removed.')


if __name__ == '__main__':
    main()
