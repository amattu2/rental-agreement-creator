import { FormSchema } from "@/schemas/form";
import jsPDF, { AcroFormTextField, AcroFormComboBox } from "jspdf";
import { loadFont } from "./fonts";
import { PDF_FONTS } from "@/config/fonts";
import { EnvSchema } from "@/schemas/env";
import { formatDate, formatNumber } from "./text";
import {
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
  value = ""
): void {
  // Field Label
  this.setFont("Cousine", "normal", 400);
  this.setFontSize(8);
  this.setTextColor(59, 59, 59);
  this.text(label, x, y);

  // Field Input
  this.buildTextField(label.toLowerCase().replace(/\s+/g, "_"), x, y, w, 5, value);
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
  doc.drawField("STATE", 54.2, currentY, 47, form.rentee.address_state);
  doc.buildTextField("RENTEE_ZIP_CODE", 102, currentY, 22.6, 5, form.rentee.address_zip);
  doc.setFont("Cousine", "normal", 400);
  doc.setFontSize(8);
  doc.text("ZIP CODE", 105.5, currentY);

  currentY += 5;
  doc.line(5, currentY, pageWidth - 5, currentY);
  currentY += 3;
  doc.drawField("DRIVER'S LICENSE #", 6, currentY, 47.4, form.rentee.driver_license_number);
  doc.drawField("STATE", 54.2, currentY, 47, form.rentee.driver_license_state);
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
  doc.drawField("CITY", 6, currentY, 47.4, form.rentee_employer.address_city ?? "");
  doc.drawField("STATE", 54.2, currentY, 47, form.rentee_employer.address_state ?? "");
  doc.drawField("ZIP CODE", 102, currentY, 22.6, form.rentee_employer.address_zip ?? "");
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
  doc.text(
    formatDate(form.rental_agreement_info.date_in, "MM/DD/YYYY hh:mm A"),
    170,
    currentY + 9,
    { align: "center" }
  );

  currentY += 12.7;
  doc.setFillColor("#DBD7D2");
  doc.rect(dividerX + 0.2, currentY, 85, 7.65, "F");

  return doc.output("blob");
};
