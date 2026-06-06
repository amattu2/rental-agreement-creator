import { FormSchema } from "@/schemas/form";
import jsPDF, { AcroFormTextField, AcroFormComboBox } from "jspdf";
import { loadFont } from "./fonts";
import { PDF_FONTS } from "@/config/fonts";
import { EnvSchema } from "@/schemas/env";

jsPDF.API.buildTextField = function (
  this: jsPDF,
  name: string,
  x: number,
  y: number,
  w: number,
  height = 5
): void {
  const field = new AcroFormTextField();
  field.value = ""; // TODO: Allow setting this value from the form data
  field.defaultValue = "";
  field.fontName = "Cousine";
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
  height = 5
): void {
  const field = new AcroFormComboBox();
  field.fieldName = name;
  field.commitOnSelChange = true;
  field.fontName = "Cousine";
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

  this.addField(field);
};

jsPDF.API.drawField = function (this: jsPDF, label: string, x: number, y: number, w: number): void {
  // Field Label
  this.setFont("Cousine", "normal", 400);
  this.setFontSize(8);
  this.setTextColor(59, 59, 59);
  this.text(label, x, y);

  // Field Input
  this.buildTextField(label.toLowerCase().replace(/\s+/g, "_"), x, y, w);
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

/**
 * A utility function to generate a rental agreement PDF from the provided form data.
 *
 * @param data - The form data used to generate the rental agreement PDF
 * @returns A Blob representing the generated PDF
 */
export const generateRentalPDF = async (
  {
    NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_COMPANY_NAME,
    NEXT_PUBLIC_ADDRESS_LINE1,
    NEXT_PUBLIC_ADDRESS_LINE2,
  }: EnvSchema,
  form: FormSchema
): Promise<Readonly<Blob>> => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "letter",
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: `Rental Agreement - ${form.agreement_number}`,
    subject: `Rental agreement form ${form.agreement_number}`,
    author: NEXT_PUBLIC_COMPANY_NAME,
    creator: NEXT_PUBLIC_APP_NAME,
    keywords: `Automotive, Rental, Agreement, PDF, Form, ${NEXT_PUBLIC_APP_NAME}`,
  });
  doc.setLanguage("en-US");

  await Promise.allSettled(PDF_FONTS.map((font) => loadFont(doc, font)));

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // Company Heading
  doc.setFont("Carlito", "normal");
  doc.setFontSize(14);
  doc.text(
    [NEXT_PUBLIC_COMPANY_NAME, NEXT_PUBLIC_ADDRESS_LINE1, NEXT_PUBLIC_ADDRESS_LINE2],
    centerX,
    7.5,
    {
      align: "center",
      lineHeightFactor: 1.2,
    }
  );

  // Document Title
  doc.setFont("Archivo Black", "normal");
  doc.setFontSize(18);
  doc.text("RENTAL AGREEMENT", centerX, 28.5, { align: "center" });
  doc.setFontSize(11);
  doc.text("NO DRIVER UNDER THE AGE OF 21", centerX, 33, { align: "center" });

  // Rental Agreement Number
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.text("NO.", pageWidth - 54, 35);
  const roField = new AcroFormTextField();
  roField.x = pageWidth - 49;
  roField.y = 28;
  roField.width = 44;
  roField.height = 8;
  doc.addField(roField);
  // field.fieldName = options.textField;
  // field.value = text;
  // field.defaultValue = text;
  // field.fontName = "Helvetica";
  // field.fontStyle = options.fontStyle || "normal";
  // field.fontSize = doc.getFontSize();
  // field.textAlign = textAlign;
  // field.multiline = false;

  let currentY = 36.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, pageWidth - 5, currentY); // Horizontal divider
  doc.line(125.5, currentY, 125.5, doc.internal.pageSize.getHeight() - 10); // Vertical divider
  currentY += 3; // 41.5

  // ---- COLUMN 1 ----
  doc.drawField("RENTEE NAME", 6, currentY, 119);

  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);
  currentY += 5; // 46.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 49.5
  doc.drawField("HOME ADDRESS", 6, currentY, 95);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("VERIFIED", 105.5, currentY);
  doc.buildTextField("VERIFIED", 101.5, currentY, 23.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(101.5, currentY - 3, 101.5, currentY + 5);
  doc.setDrawColor(59, 59, 59);
  currentY += 5; // 54.5
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3; // 57.5
  doc.drawField("CITY", 6, currentY, 47.4);
  doc.drawField("STATE", 54.2, currentY, 47);
  doc.buildTextField("ZIP CODE", 102, currentY, 22.6);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("ZIP CODE", 105.5, currentY);

  currentY += 5; // 62.5
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3; // 65.5
  doc.drawField("DRIVER'S LICENSE #", 6, currentY, 47.4);
  doc.drawField("STATE", 54.2, currentY, 47);
  doc.buildTextField("EXP. DATE", 102, currentY, 22.6);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("EXP. DATE", 105.5, currentY);
  currentY += 5; // 70.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 73.5
  doc.drawField("DATE OF BIRTH", 6, currentY, 47.4);
  doc.drawField("CELL PHONE #", 54.2, currentY, 47);
  doc.drawField("ALT PHONE #", 102, currentY, 22.6);
  currentY += 5; // 78.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 81.5
  doc.drawField("EMAIL ADDRESS", 6, currentY, 119);
  currentY += 5; // 86.5
  doc.line(5, currentY, 125.5, currentY);

  currentY += 3; // 89.5
  doc.drawField("EMPLOYER", 6, currentY, 64);
  doc.drawField("POSITION", 71, currentY, 54);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 94.5
  doc.drawField("EMPLOYER'S ADDRESS", 6, currentY, 119);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("CITY", 6, currentY, 47.4);
  doc.drawField("STATE", 54.2, currentY, 47);
  doc.drawField("ZIP CODE", 102, currentY, 22.6);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("INSURANCE CO.", 6, currentY, 53);
  doc.drawField("POLICY #", 60, currentY, 54);
  currentY += 5;
  doc.line(5, currentY, 125.5, currentY);

  currentY += 3.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(7.8);
  doc.setTextColor(59, 59, 59);
  doc.setCharSpace(-0.2);
  doc.setLineHeightFactor(0.95);
  doc.drawCompressedText(
    [
      "ONLY THE BELOW NAMED PERSONS ARE AUTHORIZED AS ADDITIONAL DRIVERS.",
      'IF NONE, PRINT "NONE" ACROSS THIS SECTION AND HAVE SIGNED BY RENTEE.',
    ],
    5,
    currentY
  );
  doc.setLineHeightFactor(1);
  doc.setCharSpace(0);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(99.5, currentY - 1.6, 24, 42);
  doc.setFont("Archivo Black", "normal");
  doc.setFontSize(10);
  doc.text("FUEL", 111.5, currentY + 2, { align: "center" });
  doc.setFontSize(8);
  doc.text("OUT", 105, currentY + 7, { align: "center" });
  doc.text("IN", 118, currentY + 7, { align: "center" });
  doc.line(99.5, currentY + 8.5, 123.5, currentY + 8.5);
  doc.line(111.5, currentY + 8.5, 111.5, currentY + 40.4);
  doc.setFontSize(10);
  doc.text(["E", "1/4", "1/2", "3/4", "F"], 105, currentY + 13, {
    align: "center",
    lineHeightFactor: 1.8,
  });
  doc.text(["E", "1/4", "1/2", "3/4", "F"], 118, currentY + 13, {
    align: "center",
    lineHeightFactor: 1.8,
  });

  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  currentY += 5;
  doc.buildTextField("ADDITIONAL_DRIVER_1_NAME", 6, currentY, 59, 4);
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("NAME", 6, currentY + 7.5);
  doc.buildTextField("ADDITIONAL_DRIVER_1_DOB", 68, currentY, 28, 4);
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("DATE OF BIRTH", 68, currentY + 7.5);

  currentY += 9.5;
  doc.buildTextField("ADDITIONAL_DRIVER_1_LICENSE", 6, currentY, 59, 4);
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("DRIVER'S LICENSE #", 6, currentY + 7.5);
  doc.buildTextField("ADDITIONAL_DRIVER_1_LICENSE_EXPIRATION", 68, currentY, 28, 4);
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("EXPIRES", 68, currentY + 7.5);

  currentY += 9.5;
  doc.buildTextField("ADDITIONAL_DRIVER_2_NAME", 6, currentY, 59, 4);
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("NAME", 6, currentY + 7.5);
  doc.buildTextField("ADDITIONAL_DRIVER_2_DOB", 68, currentY, 28, 4);
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("DATE OF BIRTH", 68, currentY + 7.5);
  
  currentY += 9.5;
  doc.buildTextField("ADDITIONAL_DRIVER_2_LICENSE", 6, currentY, 59, 4);
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("DRIVER'S LICENSE #", 6, currentY + 7.5);
  doc.buildTextField("ADDITIONAL_DRIVER_2_LICENSE_EXPIRATION", 68, currentY, 28, 4);
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("EXPIRES", 68, currentY + 7.5);

  currentY += 9.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, 125.5, currentY);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  // ---- COLUMN 2 ----

  currentY = 39.5;
  doc.drawField("VEHICLE #", 126.5, currentY, 19.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(146.2, currentY - 3, 146.2, currentY + 5);
  doc.drawField("VIN", 147, currentY, 36.5);
  doc.line(184, currentY - 3, 184, currentY + 5);
  doc.drawField("LICENSE #", 184.8, currentY, 26);
  currentY += 5;
  doc.setDrawColor(59, 59, 59);
  doc.line(125.5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("YEAR", 126.5, currentY, 15.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.drawField("MAKE", 143, currentY, 33.2);
  doc.line(176.5, currentY - 3, 176.5, currentY + 5);
  doc.drawField("MODEL/COLOR", 177.3, currentY, 33.5);
  currentY += 5;
  doc.setDrawColor(59, 59, 59);
  doc.line(125.5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text("ODOMETER", 126.5, currentY);
  doc.text("IN", 136.5, currentY + 3.5);
  doc.buildTextField("ODOMETER_IN", 143, currentY - 2.6, 14.5, 7.5);
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  doc.drawField("DATE & TIME IN", 158.8, currentY, 32); // Date Field
  doc.buildTextField("DATE_TIME_IN", 192, currentY, 19); // Time field

  currentY += 8;
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text("ODOMETER", 126.5, currentY);
  doc.text("OUT", 135, currentY + 3.5);
  doc.buildTextField("ODOMETER_OUT", 143, currentY - 2.6, 14.5, 7.5);
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  doc.drawField("DATE & TIME OUT", 158.8, currentY, 32); // Date Field
  doc.buildTextField("DATE_TIME_OUT", 192, currentY, 19); // Time field

  currentY += 8;
  doc.drawField("MAX DISTANCE ALLOWED", 126.5, currentY, 32);
  doc.buildComboField("MAX_DISTANCE_MEASUREMENT", 160, currentY, 11, ["MI", "KM"]);
  doc.setDrawColor(59, 59, 59);
  doc.line(171.5, currentY - 3, 171.5, currentY + 5);
  doc.drawField("MAX PAYLOAD ALLOWED", 172, currentY, 28);
  doc.buildComboField("MAX_PAYLOAD_MEASUREMENT", 201.5, currentY, 9.5, ["LBS", "KG"]);

  currentY += 8.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(["DUE DATE", "EXPIRATION OF CONTRACT"], 170, currentY, {
    align: "center",
    lineHeightFactor: 1.1,
  });
  doc.line(151.5, currentY + 3.8, 188.5, currentY + 3.8);
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(9);
  doc.setTextColor(255, 64, 64);
  doc.text("00/00/0000 00:00 AM", 170, currentY + 9, { align: "center" });

  return doc.output("blob");
};
