#!/usr/bin/env python3
"""Preview or activate a verified static release; preserve existing PicLex routes."""
import argparse
import difflib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path('/home/hermes/piclex-web')
SITE = Path('/etc/nginx/conf.d/piclex.v2fy.com.conf')
OLD_ROOT = '/usr/share/nginx/html/piclex.v2fy.com'
BEGIN = '    # BEGIN PICLEX WEB\n'
END = '    # END PICLEX WEB\n'
FALLBACK = '    location / { return 404; }\n'


def web_block(root=None):
    root = root or ROOT / 'current'
    return BEGIN + f'''    location = /piclex-web {{ return 308 /piclex-web/; }}
    location ^~ /piclex-web/ {{
        root {root};
        index index.html;
        autoindex off;
        if ($uri ~ "(^|/)\\.") {{ return 404; }}
        limit_except GET HEAD {{ deny all; }}
        try_files $uri $uri/ =404;
        types {{
            text/html html;
            text/css css;
            application/javascript js;
            application/json json;
            application/octet-stream piclexdeck;
            image/jpeg jpg jpeg;
            image/png png;
            image/svg+xml svg;
            text/plain txt;
        }}
        default_type application/octet-stream;
        charset utf-8;
        add_header Cache-Control "no-cache" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}
''' + END


def homepage_block():
    return """    location = / {
        return 302 /piclex-web/$is_args$args;
        add_header Cache-Control "no-cache" always;
    }
"""


def protected_routes(current):
    value = re.sub(r'    location = / \{\n.*?^    \}\n', '', current, flags=re.M | re.S)
    return re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), '', value, flags=re.S)


def patch_site(current):
    if current.count('    location = / {\n') != 1 or current.count(FALLBACK) != 1:
        raise ValueError('Unexpected site layout; review the production configuration first')
    if 'listen 443 ssl;' not in current or 'server_name piclex.v2fy.com;' not in current:
        raise ValueError('Unexpected site identity')
    match = re.search(r'    location = / \{\n.*?^    \}\n', current, re.M | re.S)
    if match is None or match.start() < current.index('listen 443 ssl;'):
        raise ValueError('Expected the existing HTTPS homepage')
    homepage = match[0]
    allowed_roots = [f'        root {OLD_ROOT};\n', f'        root {ROOT / "current"};\n']
    if homepage != homepage_block() and (sum(homepage.count(root) for root in allowed_roots) != 1 or 'try_files /index.html =404;' not in homepage):
        raise ValueError('Unrecognized homepage; refusing to replace it')
    candidate = current[:match.start()] + homepage_block() + current[match.end():]
    if BEGIN in candidate or END in candidate:
        if candidate.count(BEGIN) != 1 or candidate.count(END) != 1:
            raise ValueError('Malformed Web route markers')
        start, stop = candidate.index(BEGIN), candidate.index(END) + len(END)
        legacy = web_block().replace('/piclex-web', '/web')
        if candidate[start:stop] not in [web_block(), legacy]:
            raise ValueError('Existing Web routes differ; review before applying')
        candidate = candidate[:start] + web_block() + candidate[stop:]
    else:
        if re.search(r'\blocation\s+[^\n{]*\/(?:web|piclex-web)\b', candidate):
            raise ValueError('An unmarked Web route already exists')
        candidate = candidate.replace(FALLBACK, web_block() + FALLBACK, 1)
    if protected_routes(candidate) != protected_routes(current):
        raise ValueError('Unexpected changes outside Web routes')
    return candidate


def verify_release(release):
    if release.is_symlink() or not release.is_dir() or release.resolve() != release:
        raise ValueError('Release must be a real directory')
    manifest = json.loads((release / 'release.json').read_text())
    if manifest.get('origin') != 'https://piclex.v2fy.com':
        raise ValueError('Wrong release origin')
    if not re.fullmatch(r'[0-9a-f]{12}-[0-9a-f]{12}', manifest.get('releaseID', '')):
        raise ValueError('Invalid release ID')
    if not re.fullmatch(r'[0-9a-f]{40}', manifest.get('sourceRevision', '')):
        raise ValueError('Missing source revision')
    actual = set()
    for path in release.rglob('*'):
        if path.is_symlink():
            raise ValueError('Symlinks are forbidden inside releases')
        if path.is_dir():
            continue
        relative = path.relative_to(release).as_posix()
        if relative == 'release.json':
            continue
        if not path.is_file() or any(part.startswith('.') for part in path.relative_to(release).parts):
            raise ValueError('Only public regular files are allowed')
        if not relative.startswith('piclex-web/'):
            raise ValueError('Unexpected file outside web/')
        actual.add(relative)
        data = path.read_bytes()
        expected = manifest['files'].get(relative)
        if expected != {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}:
            raise ValueError(f'Release checksum mismatch: {relative}')
    if actual != set(manifest['files']) or not {'piclex-web/index.html', 'piclex-web/source.json', 'piclex-web/library/catalog.json'} <= actual:
        raise ValueError('Missing release files')
    print(f'Verified {len(actual)} files: {manifest["releaseID"]}', flush=True)
    return manifest


def replace_file(path, content, metadata):
    fd, name = tempfile.mkstemp(prefix='.piclex-web-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(name, metadata.st_mode & 0o777)
        os.chown(name, metadata.st_uid, metadata.st_gid)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def switch_current(target):
    current = ROOT / 'current'
    if target is None:
        current.unlink(missing_ok=True)
        return
    temporary = ROOT / f'.current-{os.getpid()}'
    try:
        temporary.symlink_to(target)
        os.replace(temporary, current)
    finally:
        temporary.unlink(missing_ok=True)


def reload_nginx():
    subprocess.run(['/usr/sbin/nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)


def apply_change(target, previous, candidate, original, metadata):
    try:
        switch_current(target)
        replace_file(SITE, candidate, metadata)
        reload_nginx()
    except BaseException:
        switch_current(previous)
        replace_file(SITE, original, metadata)
        print('Restored previous release and configuration; reloading.', flush=True)
        reload_nginx()
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--release', type=Path)
    action.add_argument('--rollback', type=Path, help='Backup directory printed by activation')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if SITE.is_symlink() or not SITE.is_file():
        raise SystemExit('Expected a regular existing Nginx site configuration')
    if ROOT.resolve() != ROOT or not ROOT.is_dir():
        raise SystemExit('Expected the prepared real deployment directory')
    if args.apply and os.geteuid() != 0:
        raise SystemExit('Activation needs sudo for Nginx configuration validation and reload')
    # All activations/rollbacks using this script serialize through the same root lock.
    lock = open('/run/lock/piclex-web.lock', 'a') if args.apply else None
    try:
        if lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
        original = SITE.read_bytes()
        metadata = SITE.stat()
        current = ROOT / 'current'
        if current.exists() and not current.is_symlink():
            raise SystemExit('current must be a symlink, not an existing directory')
        previous = os.readlink(current) if current.is_symlink() else None
        if args.release:
            release = args.release.absolute()
            if release.parent != ROOT / 'releases':
                raise SystemExit('Release must be under the prepared releases directory')
            manifest = verify_release(release)
            if release.name != manifest['releaseID']:
                raise SystemExit('Release directory does not match its manifest')
            candidate = patch_site(original.decode()).encode()
            target = str(release)
        else:
            backup = args.rollback.absolute()
            if backup.parent != SITE.parent.parent or not backup.name.startswith('piclex-web-backup-') or backup.is_symlink():
                raise SystemExit('Expected a backup directory under /etc/nginx')
            state = json.loads((backup / 'state.json').read_text())
            if hashlib.sha256(original).hexdigest() != state['activatedConfigSHA256'] or previous != state['activatedRelease']:
                raise SystemExit('Live deployment has changed since this backup; review before rollback')
            candidate = (backup / 'site.conf').read_bytes()
            target = state['previousRelease']
        print(''.join(difflib.unified_diff(original.decode().splitlines(True), candidate.decode().splitlines(True),
                                         fromfile=str(SITE), tofile='candidate')), end='')
        print(f'Current release: {previous}\nTarget release: {target}', flush=True)
        if not args.apply:
            print('Preview only; add --apply with sudo after reviewing the diff.')
            return
        subprocess.run(['/usr/sbin/nginx', '-t'], check=True)
        if SITE.read_bytes() != original or (os.readlink(current) if current.is_symlink() else None) != previous:
            raise SystemExit('Deployment changed during validation; review and retry')
        backup = Path(tempfile.mkdtemp(prefix='piclex-web-backup-', dir='/etc/nginx'))
        shutil.copy2(SITE, backup / 'site.conf')
        (backup / 'state.json').write_text(json.dumps({
            'previousRelease': previous, 'activatedRelease': target,
            'activatedConfigSHA256': hashlib.sha256(candidate).hexdigest()
        }, indent=2) + '\n')
        print(f'Backup: {backup}', flush=True)
        apply_change(target, previous, candidate, original, metadata)
        print('Activated: https://piclex.v2fy.com/piclex-web/', flush=True)
        print(f'Rollback: sudo python3 {Path(__file__).resolve()} --rollback {backup} --apply', flush=True)
    finally:
        if lock:
            lock.close()


if __name__ == '__main__':
    main()
