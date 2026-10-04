// Captures demo-video frames with an offscreen WKWebView.
// Build: swiftc -swift-version 5 -O capture.swift -o capture
// Run:   ./capture <outDir> <liveBase> <localBase>
import Cocoa
import WebKit

let args = CommandLine.arguments
let outDir = URL(fileURLWithPath: args.count > 1 ? args[1] : "frames")
let live = args.count > 2 ? args[2] : "https://pani-kaisa-hai.vercel.app"
let local = args.count > 3 ? args[3] : "http://localhost:3010"

let viewW: CGFloat = 1440, viewH: CGFloat = 810
let outW = 1920, outH = 1080

final class Nav: NSObject, WKNavigationDelegate {
  var done: CheckedContinuation<Void, Never>?
  func webView(_ w: WKWebView, didFinish n: WKNavigation!) { done?.resume(); done = nil }
  func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) { print("fail", e); done?.resume(); done = nil }
  func webView(_ w: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { print("fail", e); done?.resume(); done = nil }
}

@MainActor final class Shooter {
  let web: WKWebView
  let nav = Nav()
  let window: NSWindow
  var count = 0
  var manifest: [[String: Any]] = []

  init() {
    let cfg = WKWebViewConfiguration()
    cfg.websiteDataStore = .nonPersistent()
    // A hidden window would otherwise pause requestAnimationFrame, which the
    // map's tile fade-in and the scroll-driven girl both depend on.
    if #available(macOS 14.0, *) { cfg.preferences.inactiveSchedulingPolicy = .none }
    web = WKWebView(frame: NSRect(x: 0, y: 0, width: viewW, height: viewH), configuration: cfg)
    window = NSWindow(contentRect: NSRect(x: -4000, y: -4000, width: viewW, height: viewH),
                      styleMask: [.borderless], backing: .buffered, defer: false)
    window.contentView = web
    window.orderFrontRegardless()
    web.navigationDelegate = nav
    web.appearance = NSAppearance(named: .darkAqua)
    // OpenStreetMap's tile servers refuse requests without a normal browser user agent.
    web.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15"
  }

  func load(_ url: String) async {
    await withCheckedContinuation { c in
      nav.done = c
      web.load(URLRequest(url: URL(string: url)!))
    }
  }

  @discardableResult
  func js(_ code: String) async -> Any? {
    do { return try await web.callAsyncJavaScript(code, arguments: [:], in: nil, contentWorld: .page) }
    catch { print("js error:", error.localizedDescription, "in:", code.prefix(80)); return nil }
  }

  func wait(_ s: Double) async { try? await Task.sleep(nanoseconds: UInt64(s * 1_000_000_000)) }

  /// Polls a page condition until it is true or the timeout passes.
  func until(_ cond: String, timeout: Double = 15) async {
    var t = 0.0
    while t < timeout {
      if (await js("return !!(\(cond))") as? Bool) == true { return }
      await wait(0.25); t += 0.25
    }
    print("timed out waiting for:", cond)
  }

  // Shows Leaflet tiles without their fade-in and without 3D layers, which the snapshot misses.
  let mapFix = """
    const st = document.createElement('style');
    st.textContent = '.leaflet-tile{opacity:1!important;transition:none!important;will-change:auto!important}.leaflet-tile-container,.leaflet-zoom-animated,.leaflet-pane{will-change:auto!important}';
    document.head.appendChild(st); return 1
  """
  let imagesReady = "[...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).every(i => i.complete && i.naturalWidth > 0)"
  let tilesReady = "[...document.querySelectorAll('.leaflet-tile')].filter(t => t.naturalWidth > 0).length >= 8"

  /// Saves one frame under a scene label so the editor can pick it up.
  func shot(_ scene: String) async {
    let conf = WKSnapshotConfiguration()
    conf.rect = NSRect(x: 0, y: 0, width: viewW, height: viewH)
    guard let img = try? await web.takeSnapshot(configuration: conf) else { print("snapshot failed"); return }
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: outW, pixelsHigh: outH, bitsPerSample: 8,
                               samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    img.draw(in: NSRect(x: 0, y: 0, width: outW, height: outH))
    NSGraphicsContext.restoreGraphicsState()
    count += 1
    let name = String(format: "%03d-%@.jpg", count, scene)
    let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.9])!
    try! data.write(to: outDir.appendingPathComponent(name))
    manifest.append(["file": name, "scene": scene])
    print("shot", name)
  }

  // Page helpers, run inside the page.
  let helpers = """
    window.__click = (t) => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t) || b.getAttribute('aria-label') === t); if (!b) return 'missing ' + t; b.click(); return 'ok' };
    window.__top = (t) => { const h = [...document.querySelectorAll('h1,h2')].find(h => h.textContent.includes(t)); return h ? h.getBoundingClientRect().top + scrollY : 0 };
    window.__pick = (sel, text) => { const s = document.querySelector(sel); const o = [...s.options].find(o => o.textContent.includes(text)); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, o.value); s.dispatchEvent(new Event('change', {bubbles: true})); return o.value };
    return 'ready'
  """

  /// Smoothly scrolls to a y position, shooting frames along the way.
  func scroll(to y: Double, frames: Int, scene: String) async {
    let start = (await js("return scrollY") as? Double) ?? 0
    for i in 1...frames {
      let t = Double(i) / Double(frames)
      let eased = t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
      await js("window.scrollTo(0, \(start + (y - start) * eased)); return 1")
      await wait(0.06)
      await shot(scene)
    }
  }

  func run() async {
    try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

    // 1. The stall
    await load(live + "/")
    await until(imagesReady)
    await wait(3)
    await js(helpers)
    await shot("hero")

    // 2. Down to the chalkboard menu
    let menuY = (await js("return __top('Today’s water menu') - 90") as? Double) ?? 1300
    await scroll(to: menuY, frames: 24, scene: "scroll-menu")
    await wait(0.8)
    await shot("menu")

    // 3. The map
    let mapY = (await js("return __top('Water in Indore today') - 40") as? Double) ?? 2800
    await scroll(to: mapY, frames: 20, scene: "scroll-map")
    await until(tilesReady, timeout: 20)
    await wait(1)
    print("tile opacity:", await js("return [...document.querySelectorAll('.leaflet-tile')].slice(0,3).map(t => getComputedStyle(t).opacity + '/' + getComputedStyle(t.parentElement).opacity).join(' ')") ?? "?")
    await js(mapFix)
    await wait(0.5)
    await shot("map")

    // 4. Shake the golgappa
    let simY = (await js("return __top('Shake the golgappa') - 40") as? Double) ?? 4200
    await scroll(to: simY, frames: 20, scene: "scroll-sim")
    await wait(1)
    await shot("sim-0")
    for _ in 0..<2 { await js("return __click('More: Neighbours who smelled something')"); await wait(0.5); await shot("sim-neighbours") }
    await js("return __click('More: Homes where someone is ill')"); await wait(0.5); await shot("sim-ill")
    await js("return __click('A TDS reading of 780 mg/L')"); await wait(0.6); await shot("sim-tds")
    await wait(0.6); await shot("sim-soggy")
    await js("return __click('Health worker confirms')"); await wait(0.8); await shot("sim-confirmed")

    // 5. The report form, step by step, never sent
    await load(live + "/report")
    await wait(2.5)
    await js(helpers)
    await shot("report-1")
    await js("return __pick('select', 'Sector 14')"); await wait(0.5); await shot("report-1-picked")
    await js("return __click('Next')"); await wait(0.6); await shot("report-2")
    await js("return __click('Smell')"); await wait(0.4); await shot("report-2-smell")
    await js("return __click('Next')"); await wait(0.6); await shot("report-3")
    await js("return __click('Next')"); await wait(0.6); await shot("report-4")

    // 6. The control room, on the local copy with the built-in demo passphrase
    await load(local + "/control")
    await wait(4)
    await js("""
      const i = document.querySelector('input[type=password]');
      if (!i) return 'already signed in';
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(i, 'pani-demo'); i.dispatchEvent(new Event('input', {bubbles: true}));
      i.form.requestSubmit(); return 'submitted'
    """)
    await wait(5)
    await js("document.querySelectorAll('nextjs-portal').forEach(e => e.remove()); return 1")
    await wait(0.3)
    await shot("control")

    // 7. Sector 14 after the decision
    await load(live + "/area/sector-14")
    await wait(2.5)
    await js(helpers)
    await shot("area-top")
    await scroll(to: 260, frames: 14, scene: "area-scroll")
    await wait(0.5)
    await shot("area-verified")

    // 8. Back to the map, one golgappa burst
    await load(live + "/")
    await wait(3)
    await js(helpers)
    let mapY2 = (await js("return __top('Water in Indore today') - 40") as? Double) ?? 2800
    await js("window.scrollTo(0, \(mapY2)); return 1")
    await until(tilesReady, timeout: 20)
    await js(mapFix)
    await wait(1.5)
    await shot("map-final")

    let json = try! JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted])
    try! json.write(to: outDir.appendingPathComponent("manifest.json"))
    print("done", count, "frames")
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
Task { @MainActor in
  let s = Shooter()
  await s.run()
  exit(0)
}
app.run()
