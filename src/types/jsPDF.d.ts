declare module "jspdf" {
  interface jsPDF {
    buildTextField(
      name: string,
      x: number,
      y: number,
      w: number,
      height?: number
    ): AcroFormTextField;
    buildComboField(
      name: string,
      x: number,
      y: number,
      w: number,
      options: string[],
      height?: number
    ): AcroFormComboBox;
    drawField(label: string, x: number, y: number, w: number): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
  }

  interface jsPDFAPI {
    buildTextField(
      name: string,
      x: number,
      y: number,
      w: number,
      height?: number
    ): AcroFormTextField;
    buildComboField(
      name: string,
      x: number,
      y: number,
      w: number,
      options: string[],
      height?: number
    ): AcroFormComboBox;
    drawField(label: string, x: number, y: number, w: number): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
  }
}
