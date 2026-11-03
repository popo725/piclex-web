#!/usr/bin/env python3
"""Decode shipped examples with PicLex's actual Swift models, on macOS only.
Never opens a device, simulator, App container, or existing database.
"""
import argparse
from pathlib import Path
import subprocess
import tempfile
import zipfile


def block(source, marker):
    start = source.index(marker)
    end = source.index('{', start) + 1
    depth = 1
    while depth:
        depth += (source[end] == '{') - (source[end] == '}')
        end += 1
    return source[start:end]


parser = argparse.ArgumentParser()
parser.add_argument('--piclex-root', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
models = args.piclex_root / 'PicLex'
card = (models / 'Models/PhotoCard.swift').read_text()
context = (models / 'Models/ContextVocabulary.swift').read_text()
archive = (models / 'Services/PhotoArchive.swift').read_text()
source = 'import Foundation\nimport CoreGraphics\nimport CryptoKit\nimport ImageIO\nimport UniformTypeIdentifiers\n'
source += card[card.index('struct SceneBoundingBox:'):card.index('enum PhotoRecognitionStatus:')]
source += context[context.index('struct VocabularyLearning:'):context.index('enum VocabularyStudyGoal:')]
for marker in ['enum PhotoArchiveFormat', 'struct PhotoArchiveManifest:', 'struct PhotoArchiveMetadata:', 'enum PhotoArchiveError:']:
    source += '\n' + block(archive, marker) + '\n'
source += '''
let directory = URL(fileURLWithPath: CommandLine.arguments[1])
let decoder = PhotoArchiveFormat.decoder()
for name in ["cafe", "travel", "home"] {
    let manifest = try decoder.decode(PhotoArchiveManifest.self, from: Data(contentsOf: directory.appendingPathComponent(name + "-manifest.json")))
    let data = try Data(contentsOf: directory.appendingPathComponent(name + "-metadata.json"))
    let metadata = try decoder.decode(PhotoArchiveMetadata.self, from: data)
    try metadata.validate()
    precondition(manifest.photos[0].jsonSHA256 == PhotoArchiveFormat.digest(data))
    let image = try Data(contentsOf: directory.appendingPathComponent(name + ".jpg"))
    precondition(metadata.imageSHA256 == PhotoArchiveFormat.digest(image))
    precondition(metadata.imageByteCount == image.count)
    let imageType = try PhotoArchiveFormat.imageExtension(image)
    precondition(imageType == "jpg")
    precondition(metadata.labels.count == 6 && metadata.labels.first?.boundingBox != nil)
    print("Native model decode + metadata/image validation: " + name + " PASS")
}
'''
with tempfile.TemporaryDirectory(prefix='piclex-web-native-') as tmp:
    dest = Path(tmp)
    for name in ['cafe', 'travel', 'home']:
        with zipfile.ZipFile(root / f'tests/fixtures/demo/decks/{name}.piclexdeck') as z:
            paths = z.namelist()
            (dest / f'{name}-manifest.json').write_bytes(z.read('manifest.json'))
            (dest / f'{name}-metadata.json').write_bytes(z.read(next(p for p in paths if p.startswith('photos/') and p.endswith('.json'))))
            (dest / f'{name}.jpg').write_bytes(z.read(next(p for p in paths if p.endswith('.jpg'))))
    (dest / 'main.swift').write_text(source)
    subprocess.run(['xcrun', 'swiftc', '-module-cache-path', str(dest / 'cache'), str(dest / 'main.swift'), '-o', str(dest / 'check')], check=True)
    subprocess.run([str(dest / 'check'), str(dest)], check=True)
