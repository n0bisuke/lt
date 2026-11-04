import AppKit
import Foundation
import PDFKit

// usage: swift scripts/mosaic-page.swift decks/<deck> <page> <block> x,y,w,h [x,y,w,h ...]
// PDF から取り込んだデッキの1ページにモザイクをかける（座標は 1920×1080 基準、macOS 専用）。
// images/pNN.png と <deck>.pdf の該当ページを、モザイク済みの1枚画像に置き換える。
// ピクセルを平均して元に戻せないようにし、PDF の元の写真データも残さない。
let args = CommandLine.arguments
guard args.count >= 5, let pageNo = Int(args[2]), let block = Int(args[3]), block > 0 else {
    print("usage: swift scripts/mosaic-page.swift decks/<deck> <page> <block> x,y,w,h ...")
    exit(1)
}
let deck = URL(fileURLWithPath: args[1])
let name = deck.lastPathComponent
let pngURL = deck.appendingPathComponent(String(format: "images/p%02d.png", pageNo))
let pdfURL = deck.appendingPathComponent("\(name).pdf")

let src = NSBitmapImageRep(data: try Data(contentsOf: pngURL))!
let W = src.pixelsWide, H = src.pixelsHigh
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: W, pixelsHigh: H, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: W * 4, bitsPerPixel: 32)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
src.draw(in: NSRect(x: 0, y: 0, width: W, height: H))
NSGraphicsContext.restoreGraphicsState()

let px = rep.bitmapData!
let k = Double(W) / 1920
for spec in args[4...] {
    let v = spec.split(separator: ",").map { Int(Double($0)! * k) }
    guard v.count == 4 else { print("bad rect \(spec)"); exit(1) }
    let b = max(1, Int(Double(block) * k))
    var by = max(0, v[1])
    while by < min(H, v[1] + v[3]) {
        var bx = max(0, v[0])
        while bx < min(W, v[0] + v[2]) {
            let x1 = min(bx + b, min(W, v[0] + v[2])), y1 = min(by + b, min(H, v[1] + v[3]))
            var sum = [0, 0, 0, 0]
            for y in by..<y1 { for x in bx..<x1 { for c in 0..<4 { sum[c] += Int(px[y * W * 4 + x * 4 + c]) } } }
            let n = (x1 - bx) * (y1 - by)
            for y in by..<y1 { for x in bx..<x1 { for c in 0..<4 { px[y * W * 4 + x * 4 + c] = UInt8(sum[c] / n) } } }
            bx += b
        }
        by += b
    }
}
try rep.representation(using: .png, properties: [:])!.write(to: pngURL)

let doc = PDFDocument(url: pdfURL)!
let box = doc.page(at: pageNo - 1)!.bounds(for: .mediaBox)
let image = NSImage(size: NSSize(width: box.width, height: box.height))
image.addRepresentation(rep)
let page = PDFPage(image: image)!
doc.removePage(at: pageNo - 1)
doc.insert(page, at: pageNo - 1)
let tmp = pdfURL.appendingPathExtension("tmp")
guard doc.write(to: tmp) else { print("PDF の書き込みに失敗しました"); exit(1) }
_ = try FileManager.default.replaceItemAt(pdfURL, withItemAt: tmp)
print("p\(pageNo) done")
