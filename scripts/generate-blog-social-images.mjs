import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as LucideIcons from "lucide-react";
import sharp from "sharp";
import {
  BLOG_ARTWORK_COUNT,
  getBlogArtworkDescriptor,
  getBlogSocialArtworkPath,
} from "../src/data/blogArtwork.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const width = 1200;
const height = 630;
const iconSize = 228;

function renderArtwork(index) {
  const { theme, iconName } = getBlogArtworkDescriptor(index);
  const Icon = LucideIcons[iconName];
  if (!Icon) throw new Error(`Unknown Lucide icon: ${iconName}`);

  const icon = renderToStaticMarkup(createElement(Icon, {
    x: (width - iconSize) / 2,
    y: (height - iconSize) / 2,
    width: iconSize,
    height: iconSize,
    color: "#ffbf7a",
    opacity: 0.92,
    strokeWidth: 1.15,
    "aria-hidden": "true",
  }));

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="#0b0309"/>` +
      `<rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="42" fill="${theme}" stroke="#ef7d55" stroke-opacity="0.42" stroke-width="2"/>` +
      icon +
    `</svg>`,
  );
}

for (let index = 0; index < BLOG_ARTWORK_COUNT; index += 1) {
  const publicPath = getBlogSocialArtworkPath(index).replace(/^\//, "");
  const outputPath = resolve(projectRoot, "public", publicPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(renderArtwork(index))
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
}

console.log(`✓ generated ${BLOG_ARTWORK_COUNT} blog social artwork PNGs (${width}×${height})`);
