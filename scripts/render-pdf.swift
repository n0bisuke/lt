import AppKit
import Foundation
import PDFKit

// usage: swift scripts/render-pdf.swift <pdf> <outdir> <width>
// 各ページを p01.png, p02.png ... に、本文のテキストを text.json に書き出す（macOS 専用）
let args = CommandLine.arguments
guard args.count == 4, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])), let width = Double(args[3]) else {
    print("usage: swift scripts/render-pdf.swift <pdf> <outdir> <width>")
    exit(1)
}
let out = args[2]
try FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
var texts: [String] = []
for i in 0..<doc.pageCount {
    let page = doc.page(at: i)!
    let box = page.bounds(for: .mediaBox)
    let scale = CGFloat(width) / box.width
    let w = Int(box.width * scale), h = Int(box.height * scale)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    let cg = ctx.cgContext
    cg.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    cg.fill(CGRect(x: 0, y: 0, width: w, height: h))
    cg.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: cg)
    NSGraphicsContext.restoreGraphicsState()
    let png = rep.representation(using: .png, properties: [:])!
    try png.write(to: URL(fileURLWithPath: String(format: "%@/p%02d.png", out, i + 1)))
    texts.append(page.string ?? "")
}
let json = try JSONSerialization.data(withJSONObject: texts)
try json.write(to: URL(fileURLWithPath: out + "/text.json"))
print("pages", doc.pageCount)
