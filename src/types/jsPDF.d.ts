import type { PDFDocument } from "pdf-lib";

declare module "jspdf" {
  interface jsPDF {
    buildTextField(
      name: string,
      x: number,
      y: number,
      w: number,
      height?: number,
      value?: string
    ): void;
    buildComboField(
      name: string,
      x: number,
      y: number,
      w: number,
      options: string[],
      height?: number,
      selectedValue?: string
    ): void;
    drawField(
      label: string,
      x: number,
      y: number,
      w: number,
      value?: string,
      fieldName?: string
    ): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
    appendDocument(appendedDocument: ArrayBuffer): Promise<PDFDocument>;
  }

  interface jsPDFAPI {
    buildTextField(
      name: string,
      x: number,
      y: number,
      w: number,
      height?: number,
      value?: string
    ): void;
    buildComboField(
      name: string,
      x: number,
      y: number,
      w: number,
      options: string[],
      height?: number,
      selectedValue?: string
    ): void;
    drawField(
      label: string,
      x: number,
      y: number,
      w: number,
      value?: string,
      fieldName?: string
    ): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
    appendDocument(appendedDocument: ArrayBuffer): Promise<PDFDocument>;
  }
}
