import jsPDF from "jspdf";
import QRCode from "qrcode";
import { formatCurrency, formatDate, formatNumber } from "@/utils/text";
import { groupByCategory } from "@/utils/billing";
import { CATEGORY_NAMES } from "@/config/constants";
import { EnvSchema } from "@/schemas/env";

/**
 * A utility function to generate a rental receipt PDF from the provided agreement record.
 *
 * @param env - The environment variables used for PDF generation
 * @param record - The agreement record used to generate the receipt PDF
 * @returns A Blob representing the generated PDF
 */
export const generateReceiptPDF = async (
  envData: EnvSchema,
  record: AgreementRecord
): Promise<Blob> => {
  const {
    NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_COMPANY_NAME,
    NEXT_PUBLIC_ADDRESS_LINE1,
    NEXT_PUBLIC_ADDRESS_LINE2,
    NEXT_PUBLIC_DEPLOYMENT_URL,
  } = envData;
  const { agreement, finalization, uuid } = record;

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [102, 152],
    putOnlyUsedFonts: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  doc.setProperties({
    title: `Rental Receipt - ${agreement.agreement_number}`,
    subject: `Rental receipt for agreement ${agreement.agreement_number}`,
    author: NEXT_PUBLIC_COMPANY_NAME,
    creator: NEXT_PUBLIC_APP_NAME,
    keywords: `Automotive, Rental, Receipt, ${NEXT_PUBLIC_APP_NAME}`,
  });
  doc.setLanguage("en-US");

  // Helper function to add text with optional centering/right-align
  const addText = (
    text: string,
    size: number,
    weight: "bold" | "normal" = "normal",
    align: "left" | "center" | "right" = "left"
  ) => {
    doc.setFontSize(size);
    doc.setFont("Helvetica", weight);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = size * 0.352778;
    const xPos =
      align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - margin : margin;

    lines.forEach((line: string) => {
      doc.text(line, xPos, currentY, { align });
      currentY += lineHeight;
    });
  };

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    [NEXT_PUBLIC_COMPANY_NAME, NEXT_PUBLIC_ADDRESS_LINE1, NEXT_PUBLIC_ADDRESS_LINE2],
    centerX,
    8,
    { align: "center" }
  );
  currentY += 10;

  const qrImage = await QRCode.toDataURL(`${NEXT_PUBLIC_DEPLOYMENT_URL}/agreement?uuid=${uuid}`, {
    errorCorrectionLevel: "H",
    type: "image/png",
    margin: 0,
  });
  doc.addImage(qrImage, "PNG", pageWidth - 26.5, 4, 20, 20, "QR_CODE");
  currentY += 12;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RENTAL RECEIPT", pageWidth / 2, currentY - 4.5, { align: "center" });
  currentY += 2;

  addText(`Agreement No.: ${agreement.agreement_number}`, 8, "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
  currentY += 2;

  addText("Summary", 8, "bold");
  currentY += 0.5;
  addText(
    `Vehicle: ${`${agreement.rental_vehicle.year} ${agreement.rental_vehicle.make} ${agreement.rental_vehicle.model}`.trim()}`,
    7
  );
  addText(`VIN: ${agreement.rental_vehicle.VIN}`, 7);
  addText(`Plate: ${agreement.rental_vehicle.license_plate}`, 7);
  addText(`Rentee: ${agreement.rentee.full_name}`, 7);
  doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
  currentY += 2;

  addText("Return Details", 8, "bold");
  currentY += 0.5;
  addText(
    `Pickup Date: ${formatDate(agreement.rental_agreement_info.date_out, "MM/DD/YYYY [at] h:mm a")}`,
    7
  );
  addText(
    `Return Date (Actual): ${formatDate(finalization!.vehicle_returned_at, "MM/DD/YYYY [at] h:mm a")}`,
    7
  );
  addText(
    `Odometer Out: ${formatNumber(agreement.rental_agreement_info.odometer_out ?? 0)} ${agreement.rental_agreement_info.max_distance_measurement}`,
    7
  );
  addText(
    `Odometer In (Actual): ${formatNumber(finalization!.actual_odometer_in)} ${agreement.rental_agreement_info.max_distance_measurement}`,
    7
  );
  addText(`Fuel Out: ${agreement.rental_agreement_info.fuel_level_out ?? "N/A"}`, 7);
  addText(`Fuel In (Actual): ${finalization!.actual_fuel_level_in}`, 7);
  doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
  currentY += 2;

  const charges = agreement.agreement_charges;
  const categorizedItems = groupByCategory(charges.line_items);
  addText("Charges", 8, "bold");
  doc.setFontSize(7);
  doc.setFont("Helvetica", "normal");
  Object.entries(categorizedItems).forEach(([category, items]) => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.text(CATEGORY_NAMES[category] ?? category, margin, currentY);
    currentY += 3;
    doc.setFont("Helvetica", "normal");
    items.forEach(({ label, quantity, rate, total, note }) => {
      doc.text(label, margin + 3, currentY);
      doc.text(
        `${formatNumber(quantity)} @ ${formatCurrency(rate, agreement.currency)} ${note ?? ""}`,
        margin + 20,
        currentY
      );
      doc.text(formatCurrency(total, agreement.currency), pageWidth - margin, currentY, {
        align: "right",
      });
      currentY += 3;
    });
  });
  doc.setLineWidth(0.2);
  doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
  currentY += 2;

  doc.setFontSize(7);
  doc.setFont("Helvetica", "normal");
  doc.text("Subtotal:", margin, currentY);
  doc.text(formatCurrency(charges.subtotal, agreement.currency), pageWidth - margin, currentY, {
    align: "right",
  });
  currentY += 3;

  doc.text(`Tax (${formatNumber(charges.sales_tax_rate)}%):`, margin, currentY);
  doc.text(
    formatCurrency(charges.sales_tax_amount, agreement.currency),
    pageWidth - margin,
    currentY,
    {
      align: "right",
    }
  );
  currentY += 3;

  doc.text("Deposit:", margin, currentY);
  doc.text(
    formatCurrency(-charges.deposit_amount, agreement.currency),
    pageWidth - margin,
    currentY,
    {
      align: "right",
    }
  );
  currentY += 3;

  doc.setFont("Helvetica", "bold");
  doc.text("Total Due:", margin, currentY);
  doc.text(formatCurrency(charges.total_due, agreement.currency), pageWidth - margin, currentY, {
    align: "right",
  });

  doc.setFontSize(6);
  doc.setFont("Helvetica", "normal");
  doc.text(
    [
      `Finalized on ${formatDate(finalization!.finalized_at, "MM/DD/YYYY [at] h:mm a")}`,
      `Receipt generated on ${formatDate(new Date().toISOString(), "MM/DD/YYYY [at] h:mm a")}`,
      "Thank you for your business!",
    ],
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  return doc.output("blob");
};
