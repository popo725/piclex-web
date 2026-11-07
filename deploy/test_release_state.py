import json
from unittest.mock import patch

import activate
import release_state as state
from release_lifecycle import file_sha256
from test_release_lifecycle import ReleaseFixture


class ReleaseStateTests(ReleaseFixture):
    def record(self):
        (self.root / 'current').unlink()
        (self.root / 'current').symlink_to(self.old)
        state.record_activation(self.root, self.new, self.old, file_sha256(self.site))
        return state.receipt_path(self.root, self.new)

    def test_reapplying_current_preserves_its_predecessor(self):
        receipt = self.record()
        before = receipt.read_bytes()
        (self.root / 'current').unlink()
        (self.root / 'current').symlink_to(self.new)
        state.record_activation(self.root, self.new, self.new, file_sha256(self.site))
        self.assertEqual(receipt.read_bytes(), before)

    def test_malformed_or_mismatched_receipts_fail_closed(self):
        receipt = self.record()
        valid = json.loads(receipt.read_text())
        mutations = [{'schemaVersion': 2}, {'activatedRelease': str(self.old)},
                     {'activatedIdentity': [0, 0]}, {'activatedConfigSHA256': '0' * 64},
                     {'previousRelease': str(self.base / 'private')},
                     {'previousRelease': str(self.new)}, {'previousIdentity': None},
                     {'previousIdentity': [True, False]}, {'previousRelease': []}]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                receipt.write_text(json.dumps({**valid, **mutation}))
                with self.assertRaises(ValueError):state.read_activation(self.root, self.site, self.new)
        for invalid in ['{', 'null', '[]', '{}']:
            receipt.write_text(invalid)
            with self.assertRaises(ValueError):state.read_activation(self.root, self.site, self.new)
        self.assertTrue(self.old.exists())

    def test_recreated_predecessor_cannot_use_old_receipt(self):
        self.record()
        self.old.rename(self.base / 'retired')
        self.old.mkdir()
        with self.assertRaisesRegex(ValueError, 'directory changed'):
            state.read_activation(self.root, self.site, self.new)

    def test_partially_removed_predecessor_allows_cleanup_retry(self):
        self.record()
        self.old.rename(self.base / 'retired')
        self.assertEqual(state.read_activation(self.root, self.site, self.new)['previousRelease'], str(self.old))

    def test_linked_receipts_and_report_directories_are_rejected(self):
        receipt = self.record()
        outside = self.base / 'outside.json'
        receipt.rename(outside)
        receipt.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            state.read_activation(self.root, self.site, self.new)
        receipt.unlink()
        receipt.parent.rmdir()
        receipt.parent.symlink_to(self.base)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            state.record_activation(self.root, self.new, self.old, file_sha256(self.site))
        self.assertTrue(outside.exists())

    def test_changed_pointer_prevents_recording(self):
        with self.assertRaisesRegex(RuntimeError, 'Current changed'):
            state.record_activation(self.root, self.new, self.old, file_sha256(self.site))
        self.assertFalse((self.root / 'reports').exists())

    def test_legacy_backup_remains_available_without_receipt(self):
        backup = self.site.parent.parent / 'piclex-web-backup-legacy'
        backup.mkdir()
        (backup / 'state.json').write_text(json.dumps({
            'previousRelease': str(self.old), 'activatedRelease': str(self.new),
            'activatedConfigSHA256': file_sha256(self.site)}))
        with patch.object(activate, 'ROOT', self.root), patch.object(activate, 'SITE', self.site):
            self.assertEqual(activate.previous_for_cleanup(self.new), self.old)
            self.record()
            state.receipt_path(self.root, self.new).write_text('{}')
            # A corrupt modern receipt must not be hidden by a legacy backup.
            with self.assertRaises(ValueError):activate.previous_for_cleanup(self.new)
