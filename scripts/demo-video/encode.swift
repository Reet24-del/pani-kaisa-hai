// Renders timeline.json (frames, captions, narration) into an H.264 MP4.
// Build: swiftc -swift-version 5 -O encode.swift -o encode
// Run:   ./encode timeline.json out.mp4
import AVFoundation
import AppKit
import CoreText

struct Clip: Decodable { let file: String; let start: Double; let duration: Double; let zoomFrom: Double; let zoomTo: Double; let fade: Double }
struct Caption: Decodable { let text: String; let start: Double; let end: Double }
struct Audio: Decodable { let file: String; let start: Double }
struct Timeline: Decodable { let fps: Int; let width: Int; let height: Int; let total: Double; let clips: [Clip]; let captions: [Caption]; let audio: [Audio] }

let args = CommandLine.arguments
let base = URL(fileURLWithPath: args[1]).deletingLastPathComponent()
let tl = try! JSONDecoder().decode(Timeline.self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let outURL = URL(fileURLWithPath: args[2])
let silentURL = outURL.deletingPathExtension().appendingPathExtension("silent.mp4")
let W = tl.width, H = tl.height

var cache: [String: CGImage] = [:]
func image(_ f: String) -> CGImage {
  if let i = cache[f] { return i }
  let src = CGImageSourceCreateWithURL(base.appendingPathComponent(f) as CFURL, nil)!
  let i = CGImageSourceCreateImageAtIndex(src, 0, nil)!
  if cache.count > 12 { cache.removeAll() }
  cache[f] = i
  return i
}

func draw(_ clip: Clip, at t: Double, in ctx: CGContext, alpha: CGFloat) {
  let p = max(0, min(1, (t - clip.start) / max(clip.duration, 0.001)))
  let eased = p * p * (3 - 2 * p)
  let z = clip.zoomFrom + (clip.zoomTo - clip.zoomFrom) * eased
  let w = Double(W) * z, h = Double(H) * z
  ctx.saveGState()
  ctx.setAlpha(alpha)
  ctx.interpolationQuality = .high
  ctx.draw(image(clip.file), in: CGRect(x: (Double(W) - w) / 2, y: (Double(H) - h) / 2, width: w, height: h))
  ctx.restoreGState()
}

func drawCaption(_ text: String, in ctx: CGContext, alpha: CGFloat) {
  let para = NSMutableParagraphStyle(); para.alignment = .center; para.lineSpacing = 4
  let font = NSFont.systemFont(ofSize: 46, weight: .semibold)
  let attr = NSAttributedString(string: text, attributes: [
    .font: font, .foregroundColor: NSColor(red: 0.98, green: 0.93, blue: 0.84, alpha: 1), .paragraphStyle: para])
  let maxW: CGFloat = 1500
  let bounds = attr.boundingRect(with: NSSize(width: maxW, height: 400), options: [.usesLineFragmentOrigin, .usesFontLeading])
  let padX: CGFloat = 36, padY: CGFloat = 20
  let boxW = ceil(bounds.width) + padX * 2, boxH = ceil(bounds.height) + padY * 2
  let box = CGRect(x: (CGFloat(W) - boxW) / 2, y: 56, width: boxW, height: boxH)
  ctx.saveGState()
  ctx.setAlpha(alpha)
  ctx.setFillColor(CGColor(red: 0.08, green: 0.05, blue: 0.03, alpha: 0.80))
  ctx.addPath(CGPath(roundedRect: box, cornerWidth: 18, cornerHeight: 18, transform: nil))
  ctx.fillPath()
  let ns = NSGraphicsContext(cgContext: ctx, flipped: false)
  NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = ns
  attr.draw(with: CGRect(x: box.minX + padX, y: box.minY + padY, width: maxW > bounds.width ? ceil(bounds.width) : maxW, height: ceil(bounds.height)),
            options: [.usesLineFragmentOrigin, .usesFontLeading])
  NSGraphicsContext.restoreGraphicsState()
  ctx.restoreGState()
}

// 1. Video frames
try? FileManager.default.removeItem(at: silentURL)
let writer = try! AVAssetWriter(outputURL: silentURL, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 8_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let frames = Int((tl.total * Double(tl.fps)).rounded(.up))
let bg = CGColor(red: 0.09, green: 0.06, blue: 0.04, alpha: 1)
for n in 0..<frames {
  let t = Double(n) / Double(tl.fps)
  while !input.isReadyForMoreMediaData { usleep(2000) }
  var pb: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
  let buf = pb!
  CVPixelBufferLockBaseAddress(buf, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H, bitsPerComponent: 8,
                      bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.setFillColor(bg); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))

  if let i = tl.clips.lastIndex(where: { $0.start <= t }) {
    let clip = tl.clips[i]
    let into = t - clip.start
    if clip.fade > 0, into < clip.fade, i > 0 {
      draw(tl.clips[i - 1], at: t, in: ctx, alpha: 1)
      draw(clip, at: t, in: ctx, alpha: CGFloat(into / clip.fade))
    } else {
      draw(clip, at: t, in: ctx, alpha: 1)
    }
  }
  if let c = tl.captions.first(where: { $0.start <= t && t < $0.end }) {
    let a = min(1, (t - c.start) / 0.2, (c.end - t) / 0.2)
    drawCaption(c.text, in: ctx, alpha: CGFloat(max(0, a)))
  }
  CVPixelBufferUnlockBaseAddress(buf, [])
  adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(n), timescale: CMTimeScale(tl.fps)))
  if n % (tl.fps * 10) == 0 { print("frame", n, "of", frames) }
}
input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
guard writer.status == .completed else { print("writer failed:", writer.error as Any); exit(1) }

// 2. Narration on top
let comp = AVMutableComposition()
let videoAsset = AVURLAsset(url: silentURL)
let vTrack = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
let srcV = videoAsset.tracks(withMediaType: .video)[0]
try! vTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoAsset.duration), of: srcV, at: .zero)
let aTrack = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
for a in tl.audio {
  let asset = AVURLAsset(url: base.appendingPathComponent(a.file))
  guard let src = asset.tracks(withMediaType: .audio).first else { print("no audio in", a.file); continue }
  var d = asset.duration
  let room = CMTimeSubtract(videoAsset.duration, CMTime(seconds: a.start, preferredTimescale: 600))
  if CMTimeCompare(d, room) > 0 { d = room }
  try! aTrack.insertTimeRange(CMTimeRange(start: .zero, duration: d), of: src, at: CMTime(seconds: a.start, preferredTimescale: 600))
}
try? FileManager.default.removeItem(at: outURL)
let export = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetHighestQuality)!
export.outputURL = outURL
export.outputFileType = .mp4
export.exportAsynchronously { sem.signal() }
sem.wait()
if export.status == .completed { try? FileManager.default.removeItem(at: silentURL); print("wrote", outURL.path) }
else { print("export failed:", export.error as Any); exit(1) }
