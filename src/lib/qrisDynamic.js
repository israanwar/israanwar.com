import QRCode from "qrcode";

export const QRIS_MAX_AMOUNT = 10_000_000;

export function buildDynamicQrisPayload(staticPayload, amount) {
  const source = String(staticPayload ?? "").trim();
  const amountValue = normalizeQrisAmount(amount);
  if (!source) throw new Error("Payload QRIS statis belum tersedia.");

  const fields = parseTlv(source).filter((field) => field.id !== "63");
  if (!fields.length) throw new Error("Payload QRIS tidak valid.");

  const next = fields.map((field) => (
    field.id === "01" ? { ...field, value: "12" } : field
  ));

  const existingAmountIndex = next.findIndex((field) => field.id === "54");
  if (existingAmountIndex >= 0) {
    next[existingAmountIndex] = { id: "54", value: amountValue };
  } else {
    const afterCurrency = next.findIndex((field) => field.id === "53");
    const beforeCountry = next.findIndex((field) => field.id === "58");
    const insertAt = afterCurrency >= 0
      ? afterCurrency + 1
      : beforeCountry >= 0
        ? beforeCountry
        : next.length;
    next.splice(insertAt, 0, { id: "54", value: amountValue });
  }

  const withoutCrc = `${serializeTlv(next)}6304`;
  return `${withoutCrc}${crc16CcittFalse(withoutCrc)}`;
}

export async function createDynamicQrisDataUrl(staticPayload, amount, options = {}) {
  const payload = buildDynamicQrisPayload(staticPayload, amount);
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: options.margin ?? 1,
    width: options.width ?? 720,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return { dataUrl, payload };
}

export function isValidQrisCrc(payload) {
  const source = String(payload ?? "").trim();
  const crcIndex = source.lastIndexOf("6304");
  if (crcIndex < 0 || crcIndex + 8 !== source.length) return false;
  return crc16CcittFalse(source.slice(0, -4)) === source.slice(-4).toUpperCase();
}

function normalizeQrisAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Nominal QRIS harus lebih dari 0.");
  }
  const rounded = Math.round(value);
  if (rounded > QRIS_MAX_AMOUNT) {
    throw new Error("Nominal QRIS melebihi limit Rp10.000.000 per transaksi.");
  }
  return String(rounded);
}

function parseTlv(payload) {
  const fields = [];
  let cursor = 0;
  while (cursor + 4 <= payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const lengthText = payload.slice(cursor + 2, cursor + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lengthText)) {
      throw new Error("Format payload QRIS tidak valid.");
    }
    const length = Number(lengthText);
    const start = cursor + 4;
    const end = start + length;
    if (end > payload.length) throw new Error("Panjang payload QRIS tidak valid.");
    const value = payload.slice(start, end);
    fields.push({ id, value });
    cursor = end;
    if (id === "63") break;
  }
  return fields;
}

function serializeTlv(fields) {
  return fields
    .map(({ id, value }) => `${id}${String(value.length).padStart(2, "0")}${value}`)
    .join("");
}

function crc16CcittFalse(value) {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i += 1) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
