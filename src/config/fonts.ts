/**
 * Defines the fonts to be loaded for the PDF generation.
 *
 * @note jsPDF does NOT support anything other than ttf fonts. In order to get TTF fonts from Google Fonts,
 * Open the typical Google Fonts CSS URL, then mock your user agent to an old device (e.g. blackberry) and reload the page.
 */
export const PDF_FONTS: Readonly<FontResource[]> = [
  {
    family: "Archivo Black",
    style: "normal",
    src: "https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf",
    fontWeight: 400,
  },
  {
    family: "Carlito",
    style: "normal",
    src: "https://fonts.gstatic.com/s/carlito/v4/3Jn9SDPw3m-pk039PDA.ttf",
    fontWeight: 400,
  },
  {
    family: "Cousine",
    style: "normal",
    src: "https://fonts.gstatic.com/s/cousine/v29/d6lIkaiiRdih4SpPzSM.ttf",
    fontWeight: 400,
  },
  {
    family: "Cousine",
    style: "normal",
    src: "https://fonts.gstatic.com/s/cousine/v29/d6lNkaiiRdih4SpP9Z8K6T4.ttf",
    fontWeight: 700,
  },
];
