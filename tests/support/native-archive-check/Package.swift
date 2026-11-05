// swift-tools-version: 5.9
import PackageDescription
let package=Package(name:"ArchiveCheck",platforms:[.macOS(.v13)],dependencies:[.package(url:"https://github.com/weichsel/ZIPFoundation.git",exact:"0.9.20")],targets:[.executableTarget(name:"ArchiveCheck",dependencies:["ZIPFoundation"],path:"Sources")])
