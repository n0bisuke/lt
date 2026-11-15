---
name: qr-code-generator
description: Generate a scannable QR image from a URL for a slide, document, or other local project artifact.
---

# QR Code Generator

When the user supplies a URL and asks for a QR code, encode that URL exactly and save a PNG at the requested project path. If the user does not name a path, use a clear filename in the current project's image or asset folder and report where it was saved.

Use the repository helper:

```bash
npm run qr -- "https://example.com/path" decks/<deck>/images/example-qr.png
```

The helper validates that the input is an HTTP(S) URL, uses a white quiet zone and high error correction, and does not print the full URL. Do not shorten or rewrite the URL, add a logo, or place text over the code. For lecture-theme slides, use `qr-prompt` so the QR appears above its instruction text. Preview the generated image in the intended output and, when a decoder is available, confirm that it resolves to the supplied URL.

Use a dedicated output filename so an existing QR image is not overwritten unless the user asked to update it. Creating a QR image does not by itself authorize adding it to a deck, publishing it, or sending the URL elsewhere.
