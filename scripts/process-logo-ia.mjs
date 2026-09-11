import sharp from "sharp";

const input = process.argv[2];
const markOutput = process.argv[3];
const faviconOutput = process.argv[4];

if (!input || !markOutput || !faviconOutput) {
  throw new Error("Usage: node scripts/process-logo-ia.mjs <input> <mark-output> <favicon-output>");
}

const { data, info } = await sharp(input)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = Buffer.alloc(info.width * info.height * 4);
const charcoal = [0x20, 0x18, 0x1b];
const ember = [0xc9, 0x57, 0x32];

for (let source = 0, target = 0; source < data.length; source += 3, target += 4) {
  const red = data[source];
  const green = data[source + 1];
  const blue = data[source + 2];
  const average = (red + green + blue) / 3;
  const contrast = 255 - average;
  const alpha = contrast <= 18 ? 0 : contrast >= 68 ? 255 : Math.round(((contrast - 18) / 50) * 255);
  const isEmber = red > green * 1.35 && red > blue * 1.35 && red > 110;
  const color = isEmber ? ember : charcoal;

  pixels[target] = color[0];
  pixels[target + 1] = color[1];
  pixels[target + 2] = color[2];
  pixels[target + 3] = alpha;
}

const trimmed = await sharp(pixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const trimmedMeta = await sharp(trimmed).metadata();
const contentWidth = trimmedMeta.width;
const contentHeight = trimmedMeta.height;
const side = Math.ceil(Math.max(contentWidth, contentHeight) * 1.16);
const left = Math.floor((side - contentWidth) / 2);
const top = Math.floor((side - contentHeight) / 2);

const squareMark = await sharp({
  create: {
    width: side,
    height: side,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: trimmed, left, top }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(squareMark).resize(800, 800, { fit: "contain" }).png({ compressionLevel: 9 }).toFile(markOutput);
await sharp(squareMark).resize(512, 512, { fit: "contain" }).png({ compressionLevel: 9 }).toFile(faviconOutput);

console.log(`logo mark: ${markOutput}`);
console.log(`favicon: ${faviconOutput}`);
