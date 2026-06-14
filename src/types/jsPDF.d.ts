import type { AgreementTermsSchema } from "@/schemas/form";

declare module "jspdf" {
  interface jsPDF {
    getLineHeightMm(): number;
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
    drawAgreementTerms(terms: AgreementTermsSchema): void;
    drawQRCode(agreementUuid: string, deploymentUrl: string): Promise<void>;
    drawSignatureImage(
      signatureDataUrl: string | undefined,
      x: number,
      y: number,
      width: number,
      height: number
    ): boolean;
  }

  interface jsPDFAPI {
    getLineHeightMm(): number;
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
    drawAgreementTerms(terms: AgreementTermsSchema): void;
    drawQRCode(agreementUuid: string, deploymentUrl: string): Promise<void>;
    drawSignatureImage(
      signatureDataUrl: string | undefined,
      x: number,
      y: number,
      width: number,
      height: number
    ): boolean;
  }
}
