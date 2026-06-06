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
    drawField(label: string, x: number, y: number, w: number, value?: string): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
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
    drawField(label: string, x: number, y: number, w: number, value?: string): void;
    drawCompressedText(lines: string[], x: number, y: number, spaceScale?: number): void;
  }
}
