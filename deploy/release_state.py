"""Durable cutover receipts, written under the deployment lock before switching."""
import json
import os
from pathlib import Path
import re
import tempfile

from release_lifecycle import RELEASE_ID, file_sha256


def identity(path):
    metadata = path.stat()
    return [metadata.st_dev, metadata.st_ino]


def managed_release(root, path):
    if (path.parent != root / 'releases' or not RELEASE_ID.fullmatch(path.name)
            or path.is_symlink() or path.resolve() != path or not path.is_dir()):
        raise ValueError('Activation receipt requires a real managed release')


def receipt_path(root, target):
    if root.resolve() != root or (root / 'releases').resolve() != root / 'releases':
        raise ValueError('Unexpected deployment directory for activation receipt')
    managed_release(root, target)
    reports = root / 'reports'
    if reports.is_symlink():
        raise ValueError('Activation reports directory must not be a symlink')
    path = reports / f'activation-{target.name}.json'
    if path.is_symlink():
        raise ValueError('Activation receipt must not be a symlink')
    return path


def record_activation(root, target, previous, config_hash):
    """Record the observed predecessor, never infer it from names or timestamps.

    Each target has its own receipt so a failed cutover/rollback cannot overwrite
    the still-active release's predecessor. Reapplying current preserves it too.
    """
    path = receipt_path(root, target)
    pointer = root / 'current'
    if previous is None:
        if pointer.exists() or pointer.is_symlink():
            raise RuntimeError('Current changed before recording activation')
    else:
        managed_release(root, previous)
        if not pointer.is_symlink() or pointer.resolve() != previous:
            raise RuntimeError('Current changed before recording activation')
    if previous == target:
        return
    if not re.fullmatch(r'[0-9a-f]{64}', config_hash):
        raise ValueError('Invalid activation configuration hash')
    state = {'schemaVersion': 1, 'activatedRelease': str(target),
             'activatedIdentity': identity(target),
             'previousRelease': str(previous) if previous else None,
             'previousIdentity': identity(previous) if previous else None,
             'activatedConfigSHA256': config_hash}
    path.parent.mkdir(exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.activation-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as output:
            output.write(json.dumps(state, indent=2) + '\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        # Persist the rename before current can change, including after a crash.
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        Path(temporary).unlink(missing_ok=True)


def read_activation(root, site, current):
    """Return a bound receipt or None for legacy releases; invalid records fail closed."""
    path = receipt_path(root, current)
    if not path.exists():
        return None
    state = json.loads(path.read_text())
    if (not isinstance(state, dict) or state.get('schemaVersion') != 1
            or state.get('activatedRelease') != str(current)
            or state.get('activatedIdentity') != identity(current)
            or state.get('activatedConfigSHA256') != file_sha256(site)
            or not {'previousRelease', 'previousIdentity'} <= state.keys()):
        raise ValueError('Activation receipt does not match current release/configuration')
    previous = state['previousRelease']
    if previous is None:
        if state['previousIdentity'] is not None:
            raise ValueError('Invalid predecessor identity in activation receipt')
    else:
        if not isinstance(previous, str):
            raise ValueError('Invalid predecessor in activation receipt')
        previous = Path(previous)
        recorded_identity = state['previousIdentity']
        if (previous.parent != root / 'releases' or not RELEASE_ID.fullmatch(previous.name)
                or previous == current or previous.is_symlink()
                or not isinstance(recorded_identity, list) or len(recorded_identity) != 2
                or any(type(value) is not int or value < 0 for value in recorded_identity)):
            raise ValueError('Invalid predecessor in activation receipt')
        # A partial cleanup may already have removed this exact predecessor.
        if previous.exists():
            managed_release(root, previous)
            if identity(previous) != recorded_identity:
                raise ValueError('Predecessor directory changed since activation')
    return state
