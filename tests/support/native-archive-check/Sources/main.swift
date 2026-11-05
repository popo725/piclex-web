import Foundation
import CryptoKit
import ZIPFoundation
setbuf(stdout,nil)
do {
let archive=try Archive(url:URL(fileURLWithPath:CommandLine.arguments[1]),accessMode:.read)
var count=0,total:UInt64=0
for entry in archive {
 if count % 200 == 0 { print("Checking entry \(count), size \(entry.uncompressedSize)") }
 if entry.uncompressedSize > 20*1024*1024*1024 { print("Invalid parsed size \(entry.path): \(entry.uncompressedSize)");exit(3) }
 var digest=SHA256();var bytes:UInt64=0
 let crc=try archive.extract(entry,bufferSize:512*1024){chunk in digest.update(data:chunk);bytes+=UInt64(chunk.count)}
 if crc != entry.checksum || bytes != entry.uncompressedSize {print("Mismatch \(entry.path): bytes \(bytes)/\(entry.uncompressedSize), crc \(crc)/\(entry.checksum)");exit(2)}
 total+=bytes;count+=1
}
print("ZIPFoundation 0.9.20: verified \(count) entries, \(total) expanded bytes, all CRC32 and sizes correct")
} catch {print("Native ZIP error: \(error)");exit(1)}
