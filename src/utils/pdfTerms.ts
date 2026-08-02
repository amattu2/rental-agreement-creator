import jsPDF from "jspdf";

import { AgreementTermsSchema } from "@/schemas/form";

export type TermsLayoutConfig = {
  contentStartY: number;
  contentBottomY: number;
  leftMargin: number;
  columnGap: number;
  columnWidth: number;
};

export type TermsLayoutFlow = {
  getCurrentY: () => number;
  setCurrentY: (y: number) => void;
  getColumnX: () => number;
  getColumnWidth: () => number;
  getLineHeight: () => number;
  ensureSpace: (lineCount?: number) => void;
  moveToNextColumnOrPage: () => void;
};

export const sanitizeTermsText = (text: string): string => text.replace(/\s+/g, " ").trim();

export const toAlphaSequence = (zeroBasedIndex: number): string => {
  let index = zeroBasedIndex + 1;
  let output = "";

  while (index > 0) {
    index -= 1;
    output = String.fromCharCode(97 + (index % 26)) + output;
    index = Math.floor(index / 26);
  }

  return output;
};

export const getSubConditionPrefix = (
  zeroBasedIndex: number,
  format: AgreementTermsSchema["conditions"][number]["list_format"]
): string => {
  if (format === "numerical") {
    return `${zeroBasedIndex + 1}.)`;
  }

  return `(${toAlphaSequence(zeroBasedIndex)})`;
};

export const splitFirstLineByWidth = (
  doc: jsPDF,
  text: string,
  width: number
): { firstLine: string; remainder: string } => {
  const trimmed = sanitizeTermsText(text);
  if (!trimmed) {
    return { firstLine: "", remainder: "" };
  }

  const words = trimmed.split(" ");
  let firstLine = "";
  let usedWords = 0;

  for (const word of words) {
    const candidate = firstLine ? `${firstLine} ${word}` : word;
    if (doc.getTextWidth(candidate) <= width) {
      firstLine = candidate;
      usedWords += 1;
    } else {
      break;
    }
  }

  if (!firstLine) {
    const forced = doc.splitTextToSize(trimmed, width) as string[];
    firstLine = forced[0] ?? "";
    return { firstLine, remainder: forced.slice(1).join(" ") };
  }

  return {
    firstLine,
    remainder: words.slice(usedWords).join(" "),
  };
};

export const createTermsLayoutFlow = (doc: jsPDF, config: TermsLayoutConfig): TermsLayoutFlow => {
  const { contentStartY, contentBottomY, leftMargin, columnGap, columnWidth } = config;

  let columnIndex = 0;
  let currentY = contentStartY;

  const getColumnX = (): number => leftMargin + columnIndex * (columnWidth + columnGap);

  const moveToNextColumnOrPage = (): void => {
    if (columnIndex === 0) {
      columnIndex = 1;
      currentY = contentStartY;
      return;
    }

    doc.addPage();
    columnIndex = 0;
    currentY = contentStartY;
  };

  const getLineHeight = (): number => doc.getLineHeightMm();

  const ensureSpace = (lineCount = 1): void => {
    const neededHeight = getLineHeight() * lineCount;
    if (currentY + neededHeight > contentBottomY) {
      moveToNextColumnOrPage();
    }
  };

  return {
    getCurrentY: () => currentY,
    setCurrentY: (y: number) => {
      currentY = y;
    },
    getColumnX,
    getColumnWidth: () => columnWidth,
    getLineHeight,
    ensureSpace,
    moveToNextColumnOrPage,
  };
};

export const drawTermsListItem = (
  doc: jsPDF,
  flow: TermsLayoutFlow,
  {
    prefix,
    content,
    indent = 0,
    prefixGap = 0.9,
  }: {
    prefix: string;
    content: string;
    indent?: number;
    prefixGap?: number;
  }
): void => {
  const getStartX = (): number => flow.getColumnX() + indent;
  const markerWidth = doc.getTextWidth(prefix);
  const firstLineWidth = Math.max(10, flow.getColumnWidth() - indent - markerWidth - prefixGap);

  const { firstLine, remainder } = splitFirstLineByWidth(doc, content, firstLineWidth);
  const wrapped = remainder
    ? (doc.splitTextToSize(remainder, flow.getColumnWidth() - indent) as string[])
    : [];

  flow.ensureSpace(1);
  const startX = getStartX();
  doc.setFont("Helvetica", "bold");
  doc.text(prefix, startX, flow.getCurrentY());

  doc.setFont("Helvetica", "normal");
  if (firstLine) {
    doc.text(firstLine, startX + markerWidth + prefixGap, flow.getCurrentY());
  }

  flow.setCurrentY(flow.getCurrentY() + flow.getLineHeight());

  wrapped.forEach((line) => {
    flow.ensureSpace(1);
    doc.text(line, getStartX(), flow.getCurrentY());
    flow.setCurrentY(flow.getCurrentY() + flow.getLineHeight());
  });
};
