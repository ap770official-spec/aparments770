import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 56;

/**
 * Generates the "listing confirmed" PDF sent to an owner after admin
 * approval. Hebrew and Latin/numeric text need separate embedded
 * fonts here - the bundled Hebrew font (a Google Fonts "Hebrew
 * subset") has no Latin or digit glyphs, and pdf-lib doesn't do
 * bidi reordering, so each line is drawn in a single script: Hebrew
 * lines are reversed + right-aligned (a safe visual-order hack for
 * plain Hebrew with no embedded digits/Latin), Latin/numeric lines
 * (address, phone, dates, price) use the built-in Helvetica font
 * left-aligned.
 */
export async function generateSubscriptionPdf({
  ownerName,
  address,
  regionName,
  pricePerNight,
  approvedAt,
  expiresAt,
}: {
  ownerName: string;
  address: string;
  regionName: string;
  pricePerNight: number;
  approvedAt: Date;
  expiresAt: Date;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const hebrewFontBytes = await readFile(
    path.join(process.cwd(), "src/lib/fonts/noto-sans-hebrew-400.woff2"),
  );
  const hebrewFont = await pdfDoc.embedFont(hebrewFontBytes);
  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const latinFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const rightEdge = PAGE_WIDTH - MARGIN;
  let y = PAGE_HEIGHT - MARGIN;

  function hebrewLine(text: string, size: number, gapAfter = 20) {
    const reversed = [...text].reverse().join("");
    const width = hebrewFont.widthOfTextAtSize(reversed, size);
    page.drawText(reversed, {
      x: rightEdge - width,
      y,
      size,
      font: hebrewFont,
      color: rgb(0.09, 0.09, 0.09),
    });
    y -= gapAfter;
  }

  // For a Latin/numeric value (address, price, date): label in Hebrew
  // (right-aligned) and value in Latin (left-aligned) as two separate
  // runs, since the line mixes scripts.
  function fieldLineLatinValue(
    labelHe: string,
    value: string,
    size = 12,
    gapAfter = 22,
  ) {
    const reversedLabel = [...labelHe].reverse().join("");
    const labelWidth = hebrewFont.widthOfTextAtSize(reversedLabel, size);
    page.drawText(reversedLabel, {
      x: rightEdge - labelWidth,
      y,
      size,
      font: hebrewFont,
      color: rgb(0.35, 0.35, 0.35),
    });
    page.drawText(value, {
      x: MARGIN,
      y,
      size,
      font: latinFont,
      color: rgb(0.09, 0.09, 0.09),
    });
    y -= gapAfter;
  }

  // For a Hebrew value (owner name, region name): label and value are
  // both Hebrew, so they're combined into one right-to-left run
  // instead of split into two differently-aligned pieces.
  function fieldLineHebrewValue(
    labelHe: string,
    value: string,
    size = 12,
    gapAfter = 22,
  ) {
    hebrewLine(`${labelHe} ${value}`, size, gapAfter);
  }

  page.drawText("770 Apartments", {
    x: MARGIN,
    y,
    size: 22,
    font: latinFontBold,
    color: rgb(0.09, 0.09, 0.09),
  });
  y -= 30;
  hebrewLine("אישור פרסום דירה באתר", 16, 28);

  fieldLineHebrewValue("בעל הדירה", ownerName);
  fieldLineLatinValue("כתובת הדירה", address);
  fieldLineHebrewValue("אזור", regionName);
  fieldLineLatinValue("מחיר ללילה", `$${pricePerNight}`);
  fieldLineLatinValue("תאריך אישור", approvedAt.toLocaleDateString("en-GB"));
  fieldLineLatinValue("בתוקף עד", expiresAt.toLocaleDateString("en-GB"));

  y -= 20;
  hebrewLine("הדירה תופיע באתר עד לתאריך שצוין למעלה", 11, 18);
  hebrewLine("לחידוש התוקף יש ליצור קשר עם הנהלת האתר", 11, 18);

  page.drawLine({
    start: { x: MARGIN, y: y - 10 },
    end: { x: rightEdge, y: y - 10 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText("770apartments", {
    x: MARGIN,
    y: MARGIN,
    size: 9,
    font: latinFontBold,
    color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}
