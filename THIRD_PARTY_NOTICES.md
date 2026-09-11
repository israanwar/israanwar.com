# Third-party notices

This project bundles the following third-party packages whose code runs
inside the built site (not build-time-only tooling). Each keeps its own
license; nothing here changes or overrides those licenses.

## @jsquash/jpeg, @jsquash/webp, @jsquash/oxipng

- License: Apache License 2.0
- Used by: Image Compressor and Image Resizer, for JPEG/WebP encoding and
  PNG optimisation (mozjpeg, libwebp, and oxipng compiled to WebAssembly).
- Source: https://github.com/jamsinclair/jSquash

## pica

- License: MIT
- Used by: Image Resizer, as the resize engine (`pica/pica_main`).
- Source: https://github.com/nodeca/pica

---

Full license text for each package ships with it under
`node_modules/<package>/LICENSE` and is not duplicated here.
