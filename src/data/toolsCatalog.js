// Only tools with a working route and implementation belong in this catalog.
// This keeps the public count truthful: no placeholders and no "coming soon" pills.

export const TOOLS_CATALOG = [
  {
    slug: "image-tools",
    name: "Image Tools",
    description: "Convert and optimise images privately in your browser.",
    tools: [
      { slug: "jpg-to-png", name: "JPG to PNG", description: "Convert JPG images into lossless PNG files.", icon: "Image", kind: "image", popular: true },
      { slug: "png-to-jpg", name: "PNG to JPG", description: "Create compact JPG files from PNG images.", icon: "Image", kind: "image", popular: true },
      { slug: "webp-to-jpg", name: "WebP to JPG", description: "Turn modern WebP images into universal JPG files.", icon: "Image", kind: "image" },
      { slug: "jpg-to-webp", name: "JPG to WebP", description: "Create efficient WebP images from JPG files.", icon: "Image", kind: "image" },
      { slug: "svg-to-png", name: "SVG to PNG", description: "Rasterise SVG artwork as a PNG image.", icon: "Shapes", kind: "image" },
      { slug: "image-compressor", name: "Image Compressor", description: "Shrink JPEG, PNG, or WebP images and convert between formats — processed entirely on your device.", icon: "Minimize2", kind: "image", popular: true },
      { slug: "image-resizer", name: "Image Resizer", description: "Resize JPEG, PNG, or WebP images by exact size, percentage, or a bounding box — processed entirely on your device.", icon: "Scaling", kind: "image", popular: true },
    ],
  },
  {
    slug: "web-tools",
    name: "Web Tools",
    description: "Small, focused utilities for links and websites.",
    tools: [
      { slug: "qr-code-generator", name: "QR Code Generator", description: "Generate a downloadable QR code from text or a URL.", icon: "QrCode", kind: "generator", popular: true },
      { slug: "whatsapp-link-generator", name: "WhatsApp Link Generator", description: "Create a clean click-to-chat WhatsApp link.", icon: "MessageCircle", kind: "generator", popular: true },
      { slug: "utm-builder", name: "UTM Builder", description: "Build campaign URLs with consistent tracking parameters.", icon: "Link2", kind: "generator" },
      { slug: "canonical-url-builder", name: "Canonical URL Builder", description: "Normalise a URL into a clean canonical address.", icon: "Link", kind: "generator" },
      { slug: "robots-txt-generator", name: "Robots.txt Generator", description: "Generate a simple, valid robots.txt file.", icon: "Bot", kind: "generator" },
      { slug: "sitemap-generator", name: "Sitemap Generator", description: "Turn a list of URLs into an XML sitemap.", icon: "Network", kind: "generator" },
    ],
  },
  {
    slug: "creative-tools",
    name: "Creative Tools",
    description: "Practical helpers for colour and content production.",
    tools: [
      { slug: "color-palette-generator", name: "Color Palette Generator", description: "Generate a harmonious five-colour palette.", icon: "Palette", kind: "generator", popular: true },
      { slug: "contrast-checker", name: "Contrast Checker", description: "Check text and background colours against WCAG ratios.", icon: "CircleDot", kind: "generator" },
      { slug: "gradient-generator", name: "Gradient Generator", description: "Design a CSS gradient and copy the final code.", icon: "Blend", kind: "generator" },
      { slug: "caption-formatter", name: "Caption Formatter", description: "Clean spacing and line breaks in social captions.", icon: "TextCursorInput", kind: "generator" },
      { slug: "social-media-size-guide", name: "Social Media Size Guide", description: "Reference common working dimensions for popular social assets.", icon: "LayoutTemplate", kind: "reference" },
    ],
  },
  {
    slug: "seo-tools",
    name: "SEO Tools",
    description: "Generate useful metadata without fabricated scores.",
    tools: [
      { slug: "meta-tag-generator", name: "Meta Tag Generator", description: "Build essential title, description, robots, and social meta tags.", icon: "Code2", kind: "generator", popular: true },
      { slug: "schema-markup-generator", name: "Schema Markup Generator", description: "Create JSON-LD structured data for a person or organisation.", icon: "Braces", kind: "generator" },
    ],
  },
];

export const TOOLS = TOOLS_CATALOG.flatMap((category) =>
  category.tools.map((tool) => ({ ...tool, category: category.name, categorySlug: category.slug })),
);

export const TOOLS_TOTAL_COUNT = TOOLS.length;

export function getToolBySlug(slug) {
  return TOOLS.find((tool) => tool.slug === slug) ?? null;
}
