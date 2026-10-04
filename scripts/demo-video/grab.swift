import AVFoundation
import AppKit
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
print("duration", CMTimeGetSeconds(asset.duration), "audio tracks", asset.tracks(withMediaType: .audio).count)
for (i, s) in a.dropFirst(3).enumerated() {
  let img = try! gen.copyCGImage(at: CMTime(seconds: Double(s)!, preferredTimescale: 600), actualTime: nil)
  let rep = NSBitmapImageRep(cgImage: img)
  try! rep.representation(using: .jpeg, properties: [:])!.write(to: URL(fileURLWithPath: "\(a[2])-\(i).jpg"))
}
