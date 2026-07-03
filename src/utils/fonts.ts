import type { jsPDF } from "jspdf";

/**
 * Convert an ArrayBuffer to a base64 string
 *
 * @param buffer the ArrayBuffer to convert
 * @returns the base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    return "";
  }

  if (typeof Buffer === "function") {
    return Buffer.from(buffer).toString("base64");
  }

  if (typeof btoa === "function") {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  console.error("arrayBufferToBase64: No compatible method to convert ArrayBuffer to base64");
  return "";
};

/**
 * Load a external font file and add it to the jsPDF instance
 *
 * @note This function enforces heavy caching to avoid unnecessary network requests.
 * @param doc the jsPDF instance to add the font to
 * @param font the font resource to load
 * @return A promise that resolves when the font is loaded
 */
export const loadFont = async (
  doc: jsPDF,
  { src, family, style, fontWeight }: FontResource
): Promise<void> => {
  if (!src || !family || !style || !fontWeight) {
    return;
  }

  const response = await fetch(src, { cache: "force-cache" }).catch(() => null);
  if (!response || !response.ok) {
    console.error(`loadFont: Failed to fetch font ${family}`);
    return;
  }

  const contentBuffer = await response.arrayBuffer().catch(() => null);
  const contentString = arrayBufferToBase64(contentBuffer);
  if (contentString) {
    doc.addFileToVFS(family, contentString);
    doc.addFont(family, family, style, fontWeight);
  } else {
    console.error(`loadFont: Failed to base64 font ${family}`);
  }
};
