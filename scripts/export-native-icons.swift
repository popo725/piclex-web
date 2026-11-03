import UIKit
@main struct Export {
 @MainActor static func main() throws {
  let root=URL(fileURLWithPath:CommandLine.arguments[1]);try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true)
  let format=UIGraphicsImageRendererFormat();format.scale=3;format.opaque=false
  for (index,name) in ["capture","learn","settings"].enumerated() {
   try TabEntryIcon.image(at:index).pngData()!.write(to:root.appendingPathComponent("tab-\(name).png"))
   let atlas=UIGraphicsImageRenderer(size:CGSize(width:26*31,height:26),format:format).image{_ in
    for frame in 0...30 { TabEntryIcon.image(at:index,progress:CGFloat(frame)/30).withTintColor(.black,renderingMode:.alwaysOriginal).draw(in:CGRect(x:frame*26,y:0,width:26,height:26)) }
   }
   try atlas.pngData()!.write(to:root.appendingPathComponent("tab-\(name)-frames.png"))
  }
  let symbols=["camera":"camera","arrow":"arrow.right","sound":"speaker.wave.2","upload":"square.and.arrow.down","sun":"sun.max","moon":"moon","share":"square.and.arrow.up","check":"checkmark","back":"chevron.left","forward":"chevron.right","close":"xmark","external":"arrow.up.right","photo":"photo","pause":"pause.fill","stop":"stop.fill","peek":"eye","microphone":"mic","headphones":"headphones"]
  for (name,symbol) in symbols {
   guard let image=UIImage(systemName:symbol,withConfiguration:UIImage.SymbolConfiguration(pointSize:22,weight:.regular)) else {fatalError(symbol)}
   let scale=min(24/image.size.width,24/image.size.height),size=CGSize(width:image.size.width*scale,height:image.size.height*scale)
   let rendered=UIGraphicsImageRenderer(size:CGSize(width:26,height:26),format:format).image{_ in image.withTintColor(.black,renderingMode:.alwaysOriginal).draw(in:CGRect(x:(26-size.width)/2,y:(26-size.height)/2,width:size.width,height:size.height))}
   try rendered.pngData()!.write(to:root.appendingPathComponent("\(name).png"))
  }
  print("Exported shared native tab drawings, animation frames and matching system symbols")
 }
}
