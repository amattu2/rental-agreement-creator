import jsPDF, { AcroFormTextField, AcroFormComboBox } from "jspdf";
import QRCode from "qrcode";
import {
  createTermsLayoutFlow,
  drawTermsListItem,
  getSubConditionPrefix,
  sanitizeTermsText,
} from "@/utils/pdfTerms";
import type { AgreementTermsSchema } from "@/schemas/form";

jsPDF.API.getLineHeightMm = function (this: jsPDF): number {
  return (this.getFontSize() * this.getLineHeightFactor()) / this.internal.scaleFactor;
};

jsPDF.API.buildTextField = function (
  this: jsPDF,
  name: string,
  x: number,
  y: number,
  w: number,
  height = 5,
  value = ""
): void {
  const field = new AcroFormTextField();
  field.value = value;
  field.defaultValue = value;
  field.fontName = "Helvetica";
  field.fontStyle = "normal";
  field.fontSize = 8;
  field.maxFontSize = 8;
  field.textAlign = "left";
  field.fieldName = name;
  field.multiline = false;
  field.x = x + 0.2;
  field.y = y;
  field.width = w;
  field.height = height;

  this.addField(field);
};

jsPDF.API.buildComboField = function (
  this: jsPDF,
  name: string,
  x: number,
  y: number,
  w: number,
  options: string[],
  height = 5,
  selectedValue = ""
): void {
  const field = new AcroFormComboBox();
  field.fieldName = name;
  field.commitOnSelChange = true;
  field.fontName = "Helvetica";
  field.fontStyle = "normal";
  field.fontSize = 8;
  field.maxFontSize = 8;
  field.textAlign = "left";
  field.x = x + 0.2;
  field.y = y;
  field.width = w;
  field.height = height;

  for (const option of options) {
    field.addOption(option);
  }

  field.value = selectedValue;
  field.defaultValue = selectedValue;

  this.addField(field);
};

jsPDF.API.drawField = function (
  this: jsPDF,
  label: string,
  x: number,
  y: number,
  w: number,
  value = "",
  fieldName?: string
): void {
  // Field Label
  this.setFont("Cousine", "normal", 400);
  this.setFontSize(8);
  this.setTextColor(59, 59, 59);
  this.text(label, x, y);

  // Field Input
  const normalizedName = (fieldName ?? label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  this.buildTextField(normalizedName, x, y, w, 5, value);
};

jsPDF.API.drawCompressedText = function (
  this: jsPDF,
  lines: string[],
  x: number,
  y: number,
  spaceScale = 0.2
): void {
  const lineHeight = (this.getFontSize() * this.getLineHeightFactor()) / this.internal.scaleFactor;
  const spaceWidth = this.getTextWidth(" ") * spaceScale;

  lines.forEach((line, lineIndex) => {
    let cursorX = x;
    const words = line.split(" ");

    words.forEach((word, wordIndex) => {
      if (word) {
        this.text(word, cursorX, y + lineIndex * lineHeight);
        cursorX += this.getTextWidth(word);
      }

      if (wordIndex < words.length - 1) {
        cursorX += spaceWidth;
      }
    });
  });
};

jsPDF.API.drawAgreementTerms = function (this: jsPDF, terms: AgreementTermsSchema): void {
  this.addPage();

  const bottomMargin = 10;
  const contentStartY = 28;
  const leftMargin = 10;
  const rightMargin = 10;
  const columnGap = 4;
  const subConditionIndent = 6.5;

  const pageWidth = this.internal.pageSize.getWidth();
  const pageHeight = this.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const columnWidth = (pageWidth - leftMargin - rightMargin - columnGap) / 2;
  const contentBottomY = pageHeight - bottomMargin;
  const flow = createTermsLayoutFlow(this, {
    contentStartY,
    contentBottomY,
    leftMargin,
    columnGap,
    columnWidth,
  });

  this.setTextColor(0, 0, 0);
  this.setFont("Archivo Black", "normal");
  this.setFontSize(16);
  this.text("RENTAL AGREEMENT", centerX, 14, { align: "center" });
  this.setFont("Helvetica", "normal");
  this.setFontSize(10);
  this.setTextColor(59, 59, 59);
  this.text(
    "Rentor hereby rents to the Rentee identified on Page 1, the vehicle described, subject to all the terms and provisions of the Agreement.",
    centerX,
    19,
    { align: "center", maxWidth: 130, lineHeightFactor: 1.2 }
  );

  this.setFont("Helvetica", "normal");
  this.setFontSize(7.7);
  this.setTextColor(0, 0, 0);
  this.setLineHeightFactor(1.2);

  terms?.conditions?.forEach((condition, index) => {
    if (index > 0) {
      flow.ensureSpace(1);
      flow.setCurrentY(flow.getCurrentY() + flow.getLineHeight() * 0.2);
    }

    drawTermsListItem(this, flow, {
      prefix: `${index + 1}.   ${condition.title}:`,
      content: sanitizeTermsText(condition.description),
      indent: 0,
      prefixGap: 1,
    });

    condition.sub_conditions.forEach((subCondition, subIndex) => {
      drawTermsListItem(this, flow, {
        prefix: getSubConditionPrefix(subIndex, condition.list_format),
        content: sanitizeTermsText(subCondition),
        indent: subConditionIndent,
        prefixGap: 2,
      });
    });
  });
};

jsPDF.API.drawQRCode = async function (
  this: jsPDF,
  agreementUuid: string,
  deploymentUrl: string
): Promise<void> {
  if (!agreementUuid || !deploymentUrl) {
    return;
  }

  const currentPage = this.getCurrentPageInfo().pageNumber;
  try {
    this.setPage(1);

    const pageWidth = this.internal.pageSize.getWidth();
    const qrImage = await QRCode.toDataURL(`${deploymentUrl}/agreement?uuid=${agreementUuid}`, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 0,
    });

    this.addImage(qrImage, "PNG", pageWidth - 26.5, 7, 20, 20, "QR_CODE");
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  } finally {
    this.setPage(currentPage);
  }
};

jsPDF.API.drawSignatureImage = function (
  this: jsPDF,
  signatureDataUrl: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  if (
    !signatureDataUrl ||
    typeof signatureDataUrl !== "string" ||
    !signatureDataUrl.startsWith("data:image/png")
  ) {
    return false;
  }

  try {
    this.addImage(signatureDataUrl, "PNG", x, y, width, height, undefined, "MEDIUM");
    return true;
  } catch (error) {
    console.error("Failed to render signature image:", error);
  }

  return false;
};

export default jsPDF;
