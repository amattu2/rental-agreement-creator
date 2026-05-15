import { FormSchema } from "@/schemas/form";
import jsPDF, { AcroFormTextField, AcroFormComboBox } from "jspdf";
import { loadFont } from "./fonts";
import { PDF_FONTS } from "@/config/fonts";

const buildTextField = (
  name: string,
  x: number,
  y: number,
  w: number,
  height = 5
): AcroFormTextField => {
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

  return field;
};

const buildComboField = (
  name: string,
  x: number,
  y: number,
  w: number,
  options: string[],
  height = 5
): AcroFormComboBox => {
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

  return field;
};

const drawField = (doc: jsPDF, label: string, x: number, y: number, w: number) => {
  // Field Label
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text(label, x, y);

  // Field Input
  doc.addField(buildTextField(label.toLowerCase().replace(/\s+/g, "_"), x, y, w));
};

/**
 * A utility function to generate a rental agreement PDF from the provided form data.
 *
 * @param data - The form data used to generate the rental agreement PDF
 * @returns A Blob representing the generated PDF
 */
export const generateRentalPDF = async ({
  COMPANY_NAME,
  ADDRESS_LINE1,
  ADDRESS_LINE2,
}: {
  // TODO: use form schema
  COMPANY_NAME: string;
  ADDRESS_LINE1: string;
  ADDRESS_LINE2: string;
}): Promise<Readonly<Blob>> => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "letter",
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: `Rental Agreement {TODO}`,
    subject: `Rental agreement form {TODO}`,
    author: COMPANY_NAME,
    creator: process.env.NEXT_PUBLIC_APP_NAME || "",
    keywords: `Automotive, Rental, Agreement, PDF, Form, ${process.env.NEXT_PUBLIC_APP_NAME}`,
  });
  doc.setLanguage("en-US");

  await Promise.allSettled(PDF_FONTS.map((font) => loadFont(doc, font)));

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // Company Heading
  doc.setFont("Carlito", "normal");
  doc.setFontSize(14);
  doc.text([COMPANY_NAME, ADDRESS_LINE1, ADDRESS_LINE2], centerX, 7.5, {
    align: "center",
    lineHeightFactor: 1.2,
  });

  // Document Title
  doc.setFont("Archivo Black", "normal");
  doc.setFontSize(18);
  doc.text("RENTAL AGREEMENT", centerX, 28.5, { align: "center" });
  doc.setFontSize(11);
  doc.text("NO DRIVER UNDER THE AGE OF 21", centerX, 34.5, { align: "center" });

  // Rental Agreement Number
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.text("NO.", pageWidth - 54, 37);
  const roField = new AcroFormTextField();
  roField.x = pageWidth - 49;
  roField.y = 30;
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

  let currentY = 38.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, pageWidth - 5, currentY); // Horizontal divider
  doc.line(125.5, currentY, 125.5, doc.internal.pageSize.getHeight() - 10); // Vertical divider
  currentY += 3; // 41.5

  // ---- COLUMN 1 ----
  drawField(doc, "RENTEE NAME", 6, currentY, 119);

  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);
  currentY += 5; // 46.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 49.5
  drawField(doc, "HOME ADDRESS", 6, currentY, 95);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("VERIFIED", 105.5, currentY);
  doc.addField(buildTextField("VERIFIED", 101.5, currentY, 23.5));
  doc.setDrawColor(0, 0, 0);
  doc.line(101.5, 46.5, 101.5, 54.5);
  doc.setDrawColor(59, 59, 59);
  currentY += 5; // 54.5
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3; // 57.5
  drawField(doc, "CITY", 6, currentY, 47.4);
  drawField(doc, "STATE", 54.2, currentY, 47);
  doc.addField(buildTextField("ZIP CODE", 102, currentY, 22.6));
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("ZIP CODE", 105.5, currentY);

  currentY += 5; // 62.5
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3; // 65.5
  drawField(doc, "DRIVER'S LICENSE #", 6, currentY, 47.4);
  drawField(doc, "STATE", 54.2, currentY, 47);
  doc.addField(buildTextField("EXP. DATE", 102, currentY, 22.6));
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("EXP. DATE", 105.5, currentY);
  currentY += 5; // 70.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 73.5
  drawField(doc, "DATE OF BIRTH", 6, currentY, 47.4);
  drawField(doc, "CELL PHONE #", 54.2, currentY, 47);
  drawField(doc, "ALT PHONE #", 102, currentY, 22.6);
  currentY += 5; // 78.5
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 81.5
  drawField(doc, "LOCAL CONTACT", 6, currentY, 119); // TODO: Replace with email address
  currentY += 5; // 86.5
  doc.line(5, currentY, 125.5, currentY);

  currentY += 3; // 89.5
  drawField(doc, "EMPLOYER", 6, currentY, 64);
  drawField(doc, "POSITION", 71, currentY, 54);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3; // 94.5
  drawField(doc, "EMPLOYER'S ADDRESS", 6, currentY, 119);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  drawField(doc, "CITY", 6, currentY, 47.4);
  drawField(doc, "STATE", 54.2, currentY, 47);
  drawField(doc, "ZIP CODE", 102, currentY, 22.6);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  drawField(doc, "INSURANCE CO.", 6, currentY, 53);
  drawField(doc, "POLICY #", 60, currentY, 54);
  currentY += 5;
  doc.line(5, currentY, 125.5, currentY);

  currentY += 3.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.setCharSpace(-0.2);
  doc.text(
    [
      "ONLY THE BELOW NAMED PERSONS ARE AUTHORIZED AS ADDITIONAL DRIVERS.",
      "IF NONE, PRINT \"NONE\" ACROSS THIS SECTION AND HAVE SIGNED BY RENTEE.",
    ],
    6,
    currentY,
    {
      lineHeightFactor: 1.1,
    }
  );
  doc.setCharSpace(0);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(90, currentY, 26, 38);

  // reset
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  // ---- COLUMN 2 ----

  currentY = 41.5;
  drawField(doc, "VEHICLE #", 126.5, currentY, 19.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(146.2, currentY - 3, 146.2, currentY + 5);
  drawField(doc, "VIN", 147, currentY, 36.5);
  doc.line(184, currentY - 3, 184, currentY + 5);
  drawField(doc, "LICENSE #", 184.8, currentY, 26);
  currentY += 5;
  doc.setDrawColor(59, 59, 59);
  doc.line(125.5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  drawField(doc, "YEAR", 126.5, currentY, 15.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  drawField(doc, "MAKE", 143, currentY, 33.2);
  doc.line(176.5, currentY - 3, 176.5, currentY + 5);
  drawField(doc, "MODEL/COLOR", 177.3, currentY, 33.5);
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
  doc.addField(buildTextField("ODOMETER_IN", 143, currentY - 2.6, 14.5, 7.5));
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  drawField(doc, "DATE & TIME IN", 158.8, currentY, 32); // Date Field
  doc.addField(buildTextField("DATE_TIME_IN", 192, currentY, 19)); // Time field

  currentY += 8;
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text("ODOMETER", 126.5, currentY);
  doc.text("OUT", 135, currentY + 3.5);
  doc.addField(buildTextField("ODOMETER_OUT", 143, currentY - 2.6, 14.5, 7.5));
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  drawField(doc, "DATE & TIME OUT", 158.8, currentY, 32); // Date Field
  doc.addField(buildTextField("DATE_TIME_OUT", 192, currentY, 19)); // Time field

  currentY += 8;
  drawField(doc, "MAX DISTANCE ALLOWED", 126.5, currentY, 32);
  doc.addField(buildComboField("MAX_DISTANCE_MEASUREMENT", 160, currentY, 11, ["MI", "KM"]));
  doc.setDrawColor(59, 59, 59);
  doc.line(171.5, currentY - 3, 171.5, currentY + 5);
  drawField(doc, "MAX PAYLOAD ALLOWED", 172, currentY, 28);
  doc.addField(buildComboField("MAX_PAYLOAD_MEASUREMENT", 201.5, currentY, 9.5, ["LBS", "KG"]));

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
