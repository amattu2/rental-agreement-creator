import { FormSchema } from "@/schemas/form";
import jsPDF, { AcroFormTextField, AcroFormComboBox } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { loadFont } from "./fonts";
import { PDF_FONTS } from "@/config/fonts";
import { EnvSchema } from "@/schemas/env";
import { formatDate, formatNumber } from "./text";
import {
  AGREEMENT_TERMS_PDF_URL,
  DISTANCE_MEASUREMENT_OPTIONS,
  FUEL_LEVEL_OPTIONS,
  PAYLOAD_MEASUREMENT_OPTIONS,
} from "@/config/constants";

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

jsPDF.API.appendDocument = async function (
  this: jsPDF,
  pdfBuffer: ArrayBuffer
): Promise<PDFDocument> {
  const sourceBytes = this.output("arraybuffer");
  const [agreementPdf, appendedPdf] = await Promise.all([
    PDFDocument.load(sourceBytes),
    PDFDocument.load(pdfBuffer),
  ]);

  const mergedPdf = await PDFDocument.create();
  const [agreementPage] = await mergedPdf.copyPages(agreementPdf, [0]);
  const [appendedPage] = await mergedPdf.copyPages(appendedPdf, [0]);

  mergedPdf.addPage(agreementPage);
  mergedPdf.addPage(appendedPage);

  return mergedPdf;
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

  await Promise.allSettled(PDF_FONTS.map((font) => loadFont(doc, font)));

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const dividerX = 125.5;

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
  roField.hasAppearanceStream = true;
  roField.fieldName = "AGREEMENT_NUMBER";
  roField.value = form.agreement_number;
  roField.defaultValue = form.agreement_number;
  roField.fontName = "Helvetica";
  roField.fontStyle = "normal";
  roField.fontSize = 10;
  roField.maxFontSize = 10;
  roField.textAlign = "left";
  roField.x = pageWidth - 49;
  roField.y = 28;
  roField.width = 44;
  roField.height = 8;
  doc.addField(roField);

  let currentY = 36.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, pageWidth - 5, currentY);
  doc.line(dividerX, currentY, dividerX, doc.internal.pageSize.getHeight() - 5);
  currentY += 3;

  // ---- COLUMN 1 ----
  doc.drawField("RENTEE NAME", 6, currentY, 119, form.rentee.full_name);

  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("HOME ADDRESS", 6, currentY, 95, form.rentee.address_street1);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("VERIFIED", 105.5, currentY);
  doc.buildTextField("VERIFIED", 101.5, currentY, 23.5, 5, form.rentee.verified ? "YES" : "NO");
  doc.setDrawColor(0, 0, 0);
  doc.line(101.5, currentY - 3, 101.5, currentY + 5);
  doc.setDrawColor(59, 59, 59);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3;
  doc.drawField("CITY", 6, currentY, 47.4, form.rentee.address_city);
  doc.drawField("STATE", 54.2, currentY, 47, form.rentee.address_state, "RENTEE_STATE");
  doc.buildTextField("RENTEE_ZIP_CODE", 102, currentY, 22.6, 5, form.rentee.address_zip);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("ZIP CODE", 105.5, currentY);

  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3;
  doc.drawField("DRIVER'S LICENSE #", 6, currentY, 47.4, form.rentee.driver_license_number);
  doc.drawField(
    "STATE",
    54.2,
    currentY,
    47,
    form.rentee.driver_license_state,
    "DRIVER_LICENSE_STATE"
  );
  doc.buildTextField(
    "DRIVER_LICENSE_EXPIRATION",
    102,
    currentY,
    22.6,
    5,
    formatDate(form.rentee.driver_license_expiration)
  );
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("EXP. DATE", 105.5, currentY);
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("DATE OF BIRTH", 6, currentY, 47.4, formatDate(form.rentee.date_of_birth));
  doc.drawField("CELL PHONE #", 54.2, currentY, 47, form.rentee.cell_phone);
  doc.drawField("ALT PHONE #", 102, currentY, 22.6, form.rentee.alternate_phone ?? "");
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("EMAIL ADDRESS", 6, currentY, 119, form.rentee.email ?? "");
  currentY += 5;
  doc.line(5, currentY, dividerX, currentY);

  currentY += 3;
  doc.drawField("EMPLOYER", 6, currentY, 64, form.rentee_employer.company ?? "");
  doc.drawField("POSITION", 71, currentY, 54, form.rentee_employer.position ?? "");
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("EMPLOYER'S ADDRESS", 6, currentY, 119, form.rentee_employer.address_street1 ?? "");
  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField(
    "CITY",
    6,
    currentY,
    47.4,
    form.rentee_employer.address_city ?? "",
    "EMPLOYER_CITY"
  );
  doc.drawField(
    "STATE",
    54.2,
    currentY,
    47,
    form.rentee_employer.address_state ?? "",
    "EMPLOYER_STATE"
  );
  doc.drawField(
    "ZIP CODE",
    102,
    currentY,
    22.6,
    form.rentee_employer.address_zip ?? "",
    "EMPLOYER_ZIP_CODE"
  );
  currentY += 5;
  doc.line(5, currentY, dividerX, currentY);

  currentY += 3;
  doc.drawField("INSURANCE CO.", 6, currentY, 53, form.rentee_insurance.company ?? "");
  doc.drawField("POLICY #", 60, currentY, 54, form.rentee_insurance.policy_number ?? "");
  currentY += 5;
  doc.line(5, currentY, dividerX, currentY);

  currentY += 3.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(7.8);
  doc.setTextColor(0, 0, 0);
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

  doc.setTextColor(59, 59, 59);
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
  doc.text(FUEL_LEVEL_OPTIONS, 105, currentY + 13, {
    align: "center",
    lineHeightFactor: 1.8,
  });
  doc.text(FUEL_LEVEL_OPTIONS, 118, currentY + 13, {
    align: "center",
    lineHeightFactor: 1.8,
  });

  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  currentY += 5;
  const additionalDriversSectionTopY = currentY - 1;
  doc.buildTextField(
    "ADDITIONAL_DRIVER_1_NAME",
    6,
    currentY,
    59,
    4,
    form.additional_drivers?.[0]?.full_name ?? ""
  );
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("NAME", 6, currentY + 7.5);
  doc.buildTextField(
    "ADDITIONAL_DRIVER_1_DOB",
    68,
    currentY,
    28,
    4,
    formatDate(form.additional_drivers?.[0]?.date_of_birth)
  );
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("DATE OF BIRTH", 68, currentY + 7.5);

  currentY += 9.5;
  doc.buildTextField(
    "ADDITIONAL_DRIVER_1_LICENSE",
    6,
    currentY,
    59,
    4,
    form.additional_drivers?.[0]?.driver_license_number ?? ""
  );
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("DRIVER'S LICENSE #", 6, currentY + 7.5);
  doc.buildTextField(
    "ADDITIONAL_DRIVER_1_LICENSE_EXPIRATION",
    68,
    currentY,
    28,
    4,
    formatDate(form.additional_drivers?.[0]?.driver_license_expiration)
  );
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("EXPIRES", 68, currentY + 7.5);

  currentY += 9.5;
  doc.buildTextField(
    "ADDITIONAL_DRIVER_2_NAME",
    6,
    currentY,
    59,
    4,
    form.additional_drivers?.[1]?.full_name ?? ""
  );
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("NAME", 6, currentY + 7.5);
  doc.buildTextField(
    "ADDITIONAL_DRIVER_2_DOB",
    68,
    currentY,
    28,
    4,
    formatDate(form.additional_drivers?.[1]?.date_of_birth)
  );
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("DATE OF BIRTH", 68, currentY + 7.5);

  currentY += 9.5;
  doc.buildTextField(
    "ADDITIONAL_DRIVER_2_LICENSE",
    6,
    currentY,
    59,
    4,
    form.additional_drivers?.[1]?.driver_license_number ?? ""
  );
  doc.line(6, currentY + 4.5, 65, currentY + 4.5);
  doc.text("DRIVER'S LICENSE #", 6, currentY + 7.5);
  doc.buildTextField(
    "ADDITIONAL_DRIVER_2_LICENSE_EXPIRATION",
    68,
    currentY,
    28,
    4,
    formatDate(form.additional_drivers?.[1]?.driver_license_expiration)
  );
  doc.line(68, currentY + 4.5, 96, currentY + 4.5);
  doc.text("EXPIRES", 68, currentY + 7.5);

  if (!form.additional_drivers || form.additional_drivers.length === 0) {
    doc.setFont("Archivo Black", "normal");
    doc.setFontSize(30);
    doc.setTextColor(170, 170, 170);
    doc.setCharSpace(1.8);
    doc.text("NONE", 38, additionalDriversSectionTopY + 34, { angle: 40, align: "center" });
    doc.text("NONE", 78, additionalDriversSectionTopY + 34, { angle: 40, align: "center" });
    doc.setCharSpace(0);
  }

  currentY += 9.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, dividerX, currentY);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  currentY += 3.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(7.8);
  doc.setTextColor(0, 0, 0);
  doc.setCharSpace(0);
  doc.text("VEHICLE DAMAGE WAIVER", 5, currentY);
  currentY += 5;
  doc.setTextColor(59, 59, 59);
  doc.text("RATES:", 5, currentY);
  doc.buildTextField(
    "VDW_RATE_PER_DAY",
    16,
    currentY - 3,
    15,
    4,
    formatNumber(form.vehicle_damage_waiver?.rate_per_day)
  );
  doc.line(16, currentY + 1, 31, currentY + 1);
  doc.text("PER DAY", 32, currentY);
  doc.buildTextField(
    "VDW_RATE_PER_WEEK",
    45,
    currentY - 3,
    15,
    4,
    formatNumber(form.vehicle_damage_waiver?.rate_per_week)
  );
  doc.line(45, currentY + 1, 60, currentY + 1);
  doc.text("PER WEEK", 61, currentY);
  currentY += 3.8;
  doc.setCharSpace(-0.2);
  doc.setLineHeightFactor(0.96);
  doc.text(
    [
      "BY INITIALING, RENTEE ACCEPTS OR DECLINES VEHICLE DAMAGE WAIVER AT THE",
      "RATES LISTED ABOVE BY DECLINING WAIVER, RENTEE ACCEPTS FULL RESPONSIBILITY",
      "FOR ALL LOSS/DAMAGE TO THE RENTED VEHICLE UP TO                    PER OCCURRENCE,",
      "REGARDLESS OR CAUSE NOTICE, WAIVER DOES NOT COVER LOSS OR DAMAGE RESULTING FROM",
      "ANY VIOLATION OR PARAGRAPH 1 OR 2 ON PAGE 2 OF THIS AGREEMENT, FOR MISSING VEHICLE",
      "PARTS OR FOR INTERIOR VEHICLE DAMAGE OTHER THAN NORMAL WEAR AND TEAR",
      "CAUSED BY VEHICLE OCCUPANTS INCLUDING ANIMALS.",
    ],
    5,
    currentY
  );
  doc.setLineHeightFactor(1);
  doc.setCharSpace(0);
  doc.buildTextField(
    "VDW_DAMAGE_LIABILITY_LIMIT",
    75,
    currentY + 2.5,
    26,
    3.8,
    formatNumber(form.vehicle_damage_waiver?.damage_liability_limit)
  );
  doc.line(75, currentY + 5.5, 101, currentY + 5.5);
  doc.setFont("Cousine", "normal", 700);
  doc.setTextColor(0, 0, 0);
  doc.text("VEHICLE DAMAGE WAIVER IS NOT INSURANCE", 60.25, currentY + 20, { align: "center" });

  doc.setFont("Cousine", "normal", 400);
  doc.setTextColor(59, 59, 59);
  doc.setDrawColor(0, 0, 0);
  doc.setFontSize(7);
  doc.rect(108.5, currentY - 10.5, 15, 8);
  doc.text("ACCEPTS", 116, currentY - 7.5, { align: "center" });
  doc.setFontSize(10);
  doc.text("×", 109, currentY - 3);
  doc.buildTextField("VDW_ACCEPT_INITIAL", 110.5, currentY - 7.5, 12.5, 5);
  doc.rect(108.5, currentY + 12, 15, 8);
  doc.setFontSize(7);
  doc.text("DECLINES", 116, currentY + 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("×", 109, currentY + 19.5);
  doc.buildTextField("VDW_DECLINE_INITIAL", 110.5, currentY + 15, 12.5, 5);

  currentY += 21.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, dividerX, currentY);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);

  currentY += 3.5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setCharSpace(0);
  doc.text("PERSONAL ACCIDENT INSURANCE", 5, currentY);
  currentY += 5;
  doc.setTextColor(59, 59, 59);
  doc.setCharSpace(-0.2);
  doc.setLineHeightFactor(0.96);
  doc.text(
    [
      "BY INITIALING, RENTEE ACCEPTS OR DECLINES PERSONAL",
      "ACCIDENT INSURANCE (PAI) AT THE ADDITIONAL",
      "DAILY RATE OF                   PER DAY.",
    ],
    5,
    currentY
  );
  doc.setCharSpace(0);
  doc.setLineHeightFactor(1);
  doc.buildTextField(
    "PAI_RATE_PER_DAY",
    25.5,
    currentY + 3,
    26,
    3.8,
    formatNumber(form.personal_accident_insurance?.rate_per_day)
  );
  doc.line(25.5, currentY + 6, 51.5, currentY + 6);
  doc.setDrawColor(0, 0, 0);
  doc.setFontSize(7);
  doc.rect(91.5, currentY - 4, 15, 8);
  doc.setFontSize(7);
  doc.text("ACCEPTS", 99, currentY - 1, { align: "center" });
  doc.setFontSize(10);
  doc.text("×", 92, currentY + 3.5);
  doc.buildTextField("PAI_ACCEPT_INITIAL", 93.5, currentY - 1, 12.5, 5);
  doc.rect(108.5, currentY - 4, 15, 8);
  doc.setFontSize(7);
  doc.text("DECLINES", 116, currentY - 1, { align: "center" });
  doc.setFontSize(10);
  doc.text("×", 109, currentY + 3.5);
  doc.buildTextField("PAI_DECLINE_INITIAL", 110.5, currentY - 1, 12.5, 5);

  currentY += 8;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(5, currentY, dividerX, currentY);

  // NOTE: This is a buffer section that can be adjusted as needed
  currentY += 34;
  doc.line(5, currentY, dividerX, currentY);

  doc.setLineWidth(0.5);
  doc.rect(10, currentY + 3, 110.5, 20);
  doc.setFont("Archivo Black", "normal");
  doc.setFontSize(11);
  doc.text("ATTENTION LAW ENFORCEMENT", 65, currentY + 7, { align: "center" });
  doc.setFontSize(7.8);
  doc.text(
    [
      "IF THIS AUTO IS STOPPED FOR ANY REASON AND THE DRIVER IS NOT",
      "AUTHORIZED ON THIS RENTAL AGREEMENT, CONSIDER THIS AUTO",
      "STOLEN. PLEASE IMPOUND AUTO, TAKE NECESSARY ACTION",
      "AGAINST THE DRIVER AND CALL OUR RENTAL OFFICE.",
    ],
    11.5,
    currentY + 11,
    { lineHeightFactor: 1.2 }
  );
  currentY += 26.5;
  doc.setFont("Helvetica", "normal", 400);
  doc.setFontSize(5);
  doc.setTextColor(59, 59, 59);
  doc.text(
    "The Printer makes no warranty, express or implied, as to content or fitness for purpose of this form. Consult your own legal counsel.",
    15,
    currentY
  );

  doc.setCharSpace(0);
  doc.setDrawColor(59, 59, 59);
  doc.setLineWidth(0.2);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);

  // ---- COLUMN 2 ----

  currentY = 39.5;
  doc.drawField("VEHICLE #", 126.5, currentY, 19.5, form.rental_vehicle.identifier);
  doc.setDrawColor(0, 0, 0);
  doc.line(146.2, currentY - 3, 146.2, currentY + 5);
  doc.drawField("VIN", 147, currentY, 36.5, form.rental_vehicle.VIN);
  doc.line(184, currentY - 3, 184, currentY + 5);
  doc.drawField("LICENSE #", 184.8, currentY, 26, form.rental_vehicle.license_plate);
  currentY += 5;
  doc.setDrawColor(59, 59, 59);
  doc.line(dividerX, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.drawField("YEAR", 126.5, currentY, 15.5, formatNumber(form.rental_vehicle.year));
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.drawField("MAKE", 143, currentY, 33.2, form.rental_vehicle.make);
  doc.line(176.5, currentY - 3, 176.5, currentY + 5);
  doc.drawField(
    "MODEL/COLOR",
    177.3,
    currentY,
    33.5,
    `${form.rental_vehicle.model} / ${form.rental_vehicle.color}`
  );
  currentY += 5;
  doc.setDrawColor(59, 59, 59);
  doc.line(dividerX, currentY, pageWidth - 5, currentY);

  currentY += 3;
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text("ODOMETER", 126.5, currentY);
  doc.text("IN", 136.5, currentY + 3.5);
  doc.buildTextField(
    "ODOMETER_IN",
    143,
    currentY - 2.6,
    14.5,
    7.5,
    formatNumber(form.rental_agreement_info.odometer_in)
  );
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  doc.drawField(
    "DATE & TIME IN",
    158.8,
    currentY,
    32,
    formatDate(form.rental_agreement_info.date_in)
  );
  doc.buildTextField(
    "DATE_TIME_IN",
    192,
    currentY,
    19,
    5,
    formatDate(form.rental_agreement_info.date_in, "hh:mm A")
  );

  currentY += 8;
  doc.setDrawColor(0, 0, 0);
  doc.line(142.5, currentY - 3, 142.5, currentY + 5);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.text("ODOMETER", 126.5, currentY);
  doc.text("OUT", 135, currentY + 3.5);
  doc.buildTextField(
    "ODOMETER_OUT",
    143,
    currentY - 2.6,
    14.5,
    7.5,
    formatNumber(form.rental_agreement_info.odometer_out)
  );
  doc.setDrawColor(59, 59, 59);
  doc.line(158, currentY - 3, 158, currentY + 5);
  doc.drawField(
    "DATE & TIME OUT",
    158.8,
    currentY,
    32,
    formatDate(form.rental_agreement_info.date_out)
  );
  doc.buildTextField(
    "DATE_TIME_OUT",
    192,
    currentY,
    19,
    5,
    formatDate(form.rental_agreement_info.date_out, "hh:mm A")
  );

  currentY += 8;
  doc.drawField(
    "MAX DISTANCE ALLOWED",
    126.5,
    currentY,
    32,
    formatNumber(form.rental_agreement_info.max_distance)
  );
  doc.buildComboField(
    "MAX_DISTANCE_MEASUREMENT",
    160,
    currentY,
    11,
    DISTANCE_MEASUREMENT_OPTIONS.map((option) => option.value),
    5,
    form.rental_agreement_info.max_distance_measurement
  );
  doc.setDrawColor(59, 59, 59);
  doc.line(171.5, currentY - 3, 171.5, currentY + 5);
  doc.drawField(
    "MAX PAYLOAD ALLOWED",
    172,
    currentY,
    28,
    formatNumber(form.rental_agreement_info.max_payload)
  );
  doc.buildComboField(
    "MAX_PAYLOAD_MEASUREMENT",
    201.5,
    currentY,
    9.5,
    PAYLOAD_MEASUREMENT_OPTIONS.map((option) => option.value),
    5,
    form.rental_agreement_info.max_payload_measurement
  );

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
  doc.setFontSize(11);
  doc.setTextColor(255, 64, 64);
  doc.setCharSpace(0.1);
  doc.text(
    formatDate(form.rental_agreement_info.date_in, "ddd, MMMM D, YYYY h:mm A"),
    170,
    currentY + 9.5,
    { align: "center" }
  );
  doc.setCharSpace(0);

  currentY += 12.7;
  const chargesLineStartY = currentY;
  doc.setFillColor("#DBD7D2");
  doc.rect(dividerX + 0.3, currentY, 84.8, 7.65, "F");
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(["RENTAL RATES", "DO NOT", "INCLUDE FUEL"], dividerX + 30, currentY + 2.5, {
    align: "center",
    lineHeightFactor: 0.8,
  });
  doc.text("CHARGES", dividerX + 72, currentY + 4.5, { align: "center" });

  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);

  currentY += 7.8;
  form.rental_vehicle.rental_rates?.forEach(({ rate_unit, rate_cost, rate_note }) => {
    doc.text(rate_unit.toUpperCase(), dividerX + 2, currentY + 3.8);
    doc.text(`@`, dividerX + 18, currentY + 3.8);
    doc.buildTextField(
      `${rate_unit.toUpperCase()}_RATE_COST`,
      dividerX + 20,
      currentY + 1.2,
      15,
      4,
      formatNumber(rate_cost)
    );

    if (rate_note) {
      doc.text(rate_note, dividerX + 40, currentY + 3.8);
    }

    doc.buildTextField(
      `${rate_unit.toUpperCase()}_RATE_TOTAL`,
      dividerX + 60,
      currentY + 1.2,
      25,
      4,
      "" // TODO: Calculate this field based on rate_cost * duration
    );

    doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
    currentY += 5;
  });

  doc.setFillColor("#DBD7D2");
  doc.rect(dividerX + 0.3, currentY + 0.1, 59.6, 5, "F");
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("RENTAL CHARGES", dividerX + 2, currentY + 3.5);
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);

  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  currentY += 5;
  if (form.vehicle_damage_waiver) {
    doc.text("VDW", dividerX + 2, currentY + 3.8);
    doc.buildTextField(
      "VDW_TOTAL",
      dividerX + 60,
      currentY + 1.2,
      25,
      4,
      "" // TODO: Compute vehicle damage waiver total based on rate_per_day * rental duration or rate_per_week * rental duration
    );
    doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
    currentY += 5;
  }

  if (form.personal_accident_insurance) {
    doc.text("PAI", dividerX + 2, currentY + 3.8);
    doc.text(`@`, dividerX + 18, currentY + 3.8);
    doc.buildTextField(
      "PAI_RATE_COST",
      dividerX + 20,
      currentY + 1.2,
      15,
      4,
      formatNumber(form.personal_accident_insurance.rate_per_day)
    );
    doc.text("Per Day", dividerX + 40, currentY + 3.8);

    doc.buildTextField(
      "PAI_TOTAL",
      dividerX + 60,
      currentY + 1.2,
      25,
      4,
      "" // TODO: Compute personal accident insurance total based on rate_per_day * rental duration or rate_per_week * rental duration
    );
    doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
    currentY += 5;
  }

  doc.setFillColor("#DBD7D2");
  doc.rect(dividerX + 0.3, currentY + 0.1, 59.6, 5, "F");
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("BALANCE DUE", dividerX + 2, currentY + 3.5);
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);

  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  currentY += 5;

  doc.text("Subtotal", dividerX + 2, currentY + 3.8);
  doc.buildTextField(
    "SUBTOTAL",
    dividerX + 60,
    currentY + 1.2,
    25,
    4,
    "" // TODO: Compute subtotal based on all charges
  );
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
  currentY += 5;

  doc.text("Less Deposit", dividerX + 2, currentY + 3.8);
  doc.buildTextField(
    "DEPOSIT_CREDIT",
    dividerX + 60,
    currentY + 1.2,
    25,
    4,
    "" // TODO: Compute deposit credit based on deposit amount
  );
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
  currentY += 5;

  doc.text("Sales Tax", dividerX + 2, currentY + 3.8);
  doc.buildTextField(
    "SALES_TAX",
    dividerX + 60,
    currentY + 1.2,
    25,
    4,
    "" // TODO: Compute sales tax based on subtotal
  );
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
  currentY += 5;

  doc.setFont("Cousine", "normal", 700);
  doc.text("Total Due", dividerX + 2, currentY + 3.8);
  doc.setFont("Cousine", "normal", 400);
  doc.buildTextField(
    "TOTAL_DUE",
    dividerX + 60,
    currentY + 1.2,
    25,
    4,
    "" // TODO: Compute total due based on subtotal + sales tax
  );

  doc.setLineWidth(0.4);
  doc.line(dividerX, currentY + 5, dividerX + 85.4, currentY + 5);
  currentY += 5.3;
  doc.line(dividerX + 60, chargesLineStartY, dividerX + 60, currentY); // Charges section vertical divider

  // warning / disclosures section
  doc.setFillColor("#DBD7D2");
  doc.rect(dividerX + 0.3, currentY + 0.1, 85.4, 19, "F");
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("WARNING:", dividerX + 2, currentY + 3.5);
  doc.setFont("Cousine", "normal", 400);
  doc.setCharSpace(-0.2);
  doc.text(
    [
      "- Read carefully all conditions on the reverse side.",
      "- Report all accidents immediately.",
      "- You are responsible for all traffic violations.",
      "- Only minimum liability insurance on an excess basis",
      "  is provided as stated on the reverse side.",
    ],
    dividerX + 3,
    currentY + 6.5
  );
  doc.setCharSpace(0);
  doc.line(dividerX, currentY + 19, dividerX + 85.4, currentY + 19);

  currentY += 19.4;
  doc.setLineWidth(0.2);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.setTextColor(59, 59, 59);
  doc.setCharSpace(-0.2);
  doc.text(
    [
      "RENTEE HAS READ BOTH SIDES OF THIS AGREEMENT AND AGREES",
      "TO THE TERMS AND CONDITIONS THEREOF:",
      "RENTEE AUTHORIZES RENTOR TO PROCESS A CREDIT CARD",
      "VOUCHER, IF ANY, IN THE RENTOR'S NAME",
      "RENTEE MAY BE PROSECUTED IF VEHICLE IS NOT RETURNED WHEN",
      "DUE BACK.",
    ],
    dividerX + 2,
    currentY + 3.5
  );
  doc.setCharSpace(0);

  currentY += 18;
  doc.setFont("Cousine", "normal", 700);
  doc.setFontSize(6.5);
  doc.text("THIS AGREEMENT SHOULD NOT EXCEED A 30 DAY PERIOD.", dividerX + 42.7, currentY + 3.8, {
    align: "center",
  });

  currentY += 5;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("×", dividerX + 0.8, currentY + 7);
  doc.buildTextField("RENTEE_SIGNATURE", dividerX + 3.5, currentY, 81.5, 6);
  doc.line(dividerX + 3.5, currentY + 6.5, dividerX + 85, currentY + 6.5);
  doc.setFontSize(7);
  doc.setTextColor(59, 59, 59);
  doc.text("RENTEE SIGNATURE", dividerX + 3.5 + 81.5 / 2, currentY + 9.5, { align: "center" });
  currentY += 10;
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("×", dividerX + 0.8, currentY + 7);
  doc.buildTextField("AUTHORIZED_CLERK_SIGNATURE", dividerX + 3.5, currentY, 81.5, 6);
  doc.line(dividerX + 3.5, currentY + 6.5, dividerX + 85, currentY + 6.5);
  doc.setFontSize(7);
  doc.setTextColor(59, 59, 59);
  doc.text("AUTHORIZED RENTAL CLERK SIGNATURE", dividerX + 3.5 + 81.5 / 2, currentY + 9.5, {
    align: "center",
  });

  try {
    const termsResponse = await fetch(AGREEMENT_TERMS_PDF_URL);
    if (!termsResponse.ok) {
      throw new Error(`Failed to fetch ${AGREEMENT_TERMS_PDF_URL}: ${termsResponse.status}`);
    }

    const newDoc = await doc.appendDocument(await termsResponse.arrayBuffer());
    newDoc.setTitle(`Rental Agreement - ${form.agreement_number}`);
    newDoc.setSubject(`Rental agreement form ${form.agreement_number}`);
    newDoc.setAuthor(NEXT_PUBLIC_COMPANY_NAME);
    newDoc.setCreator(NEXT_PUBLIC_APP_NAME);
    newDoc.setKeywords(["Automotive", "Rental", "Agreement", "PDF", "Form", NEXT_PUBLIC_APP_NAME]);
    newDoc.setLanguage("en-US");

    const blobBytes = Uint8Array.from(await newDoc.save());
    return new Blob([blobBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Failed to append agreement terms PDF", error);

    doc.setProperties({
      title: `Rental Agreement - ${form.agreement_number}`,
      subject: `Rental agreement form ${form.agreement_number}`,
      author: NEXT_PUBLIC_COMPANY_NAME,
      creator: NEXT_PUBLIC_APP_NAME,
      keywords: `Automotive, Rental, Agreement, PDF, Form, ${NEXT_PUBLIC_APP_NAME}`,
    });
    doc.setLanguage("en-US");

    return doc.output("blob");
  }
};
